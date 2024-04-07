import { defineStore } from "pinia";
import { currentDateStr } from "src/js/utils";
import { useMintsStore, WalletProof } from "./mints";
import { useLocalStorage } from "@vueuse/core";
import { useProofsStore } from "./proofs";
import { useTokensStore } from "./tokens";
import { useReceiveTokensStore } from "./receiveTokensStore";
import { useCameraStore } from "./camera";
import { useUiStore } from "src/stores/ui";

import { step1Alice, step3Alice } from "src/js/dhke";
import * as nobleSecp256k1 from "@noble/secp256k1";
import { splitAmount } from "src/js/utils";
import * as _ from "underscore";
import { uint8ToBase64 } from "src/js/base64";
import token from "src/js/token";
import { notifyApiError, notifyError, notifySuccess, notifyWarning, notify } from "src/js/notify";
import { CashuMint, CashuWallet, Proof, SerializedBlindedSignature, MintKeys, RequestMintPayload, SplitPayload, PostMintPayload, MeltPayload, CheckStatePayload, MeltQuotePayload } from "@cashu/cashu-ts";
import { hashToCurve } from "@cashu/cashu-ts/dist/lib/es5/DHKE";
import * as bolt11Decoder from "light-bolt11-decoder";
import bech32 from "bech32";
import axios from "axios";
import { date } from "quasar";

type Invoice = {
  amount: number;
  bolt11: string;
  quote: string;
  memo: string;
};

type InvoiceHistory = Invoice & {
  date: string;
  status: "pending" | "paid";
  mint?: string;
};

const receiveStore = useReceiveTokensStore();
const tokenStore = useTokensStore();
const uIStore = useUiStore();

export const useWalletStore = defineStore("wallet", {
  state: () => {
    return {
      invoiceHistory: useLocalStorage(
        "cashu.invoiceHistory",
        [] as InvoiceHistory[]
      ),
      invoiceData: {
        amount: 0,
        memo: "",
        bolt11: "",
        quote: "",
      } as Invoice,
      payInvoiceData: {
        blocking: false,
        bolt11: "",
        show: false,
        invoice: {} as Invoice,
        lnurlpay: {},
        lnurlauth: {},
        data: {
          request: "",
          amount: 0,
          comment: "",
          quote: "",
        },
      },
    };
  },
  getters: {
    wallet() {
      const mints = useMintsStore();
      const mint = new CashuMint(mints.activeMintUrl);
      const wallet = new CashuWallet(mint);
      return wallet;
    },
  },
  actions: {
    constructOutputs: async function (amounts: number[], secrets: Uint8Array[], id: string) {
      const outputs = [];
      const rs = [];
      for (let i = 0; i < amounts.length; i++) {
        const { B_, r } = await step1Alice(secrets[i]);
        outputs.push({ amount: amounts[i], B_: B_, id: id });
        rs.push(r);
      }
      return {
        outputs,
        rs,
      };
    },
    promiseToProof: async function (id: string, amount: number, C_hex: string, r: string) {
      const mintStore = useMintsStore();

      const C_ = nobleSecp256k1.Point.fromHex(C_hex);
      const A = await mintStore.getKeysForKeyset(id);
      const publicKey: string = A.keys[amount];

      const C = step3Alice(
        C_,
        nobleSecp256k1.utils.hexToBytes(r),
        nobleSecp256k1.Point.fromHex(publicKey)
      );
      return {
        id,
        amount,
        C: C.toHex(true),
      };
    },
    constructProofs: async function (promises: SerializedBlindedSignature[], secrets: Uint8Array[], rs: string[]) {
      const proofs = [];
      for (let i = 0; i < promises.length; i++) {
        // const encodedSecret = uint8ToBase64.encode(secrets[i]);
        // use hex for now
        const encodedSecret = nobleSecp256k1.utils.bytesToHex(secrets[i]);
        let { id, amount, C } = await this.promiseToProof(
          promises[i].id,
          promises[i].amount,
          promises[i].C_,
          rs[i]
        );
        proofs.push({ id, amount, C, secret: encodedSecret });
      }
      return proofs;
    },
    generateSecrets: async function (amounts: number[]) {
      let secrets = [];
      for (let i = 0; i < amounts.length; i++) {
        const secret = nobleSecp256k1.utils.randomBytes(32);
        secrets.push(secret);
      }
      return secrets;
    },
    /**
     * Sets an invoice status to paid
     */
    setInvoicePaid(quoteId: string) {
      const invoice = this.invoiceHistory.find((i) => i.quote === quoteId);
      if (!invoice) return;
      invoice.status = "paid";
    },
    splitToSend: async function (proofs: WalletProof[], amount: number, invlalidate: boolean = false) {
      /*
      splits proofs so the user can keep firstProofs, send scndProofs.
      then sets scndProofs as reserved.

      if invalidate, scndProofs (the one to send) are invalidated
      */
      const proofsStore = useProofsStore();
      const mintStore = useMintsStore();
      try {
        const spendableProofs = proofsStore.getUnreservedProofs(proofs);
        if (proofsStore.sumProofs(spendableProofs) < amount) {
          const balance = await mintStore.getBalance();
          notifyWarning(
            "Balance is too low.",
            `Your balance is ${balance} sat and you're trying to pay ${amount} sats.`
          );
          throw Error("balance too low.");
        }

        // coin selection: sort and select proofs until amount is reached
        spendableProofs.sort((a, b) => a.amount - b.amount);
        let sum = 0;
        let i = 0;
        while (sum < amount) {
          sum += spendableProofs[i].amount;
          i += 1;
        }
        const proofsToSplit = spendableProofs.slice(0, i);

        // call /split
        let { firstProofs, scndProofs } = await this.split(
          proofsToSplit,
          amount
        );
        if (invlalidate) {
          mintStore.removeProofs(scndProofs);
        }
        return { firstProofs, scndProofs };
      } catch (error: any) {
        console.error(error);
        try {
          notifyApiError(error);
        } catch { }
        throw error;
      }
    },
    /**
     *
     *
     * @param {array} proofs
     */
    redeem: async function () {
      /*
      uses split to receive new tokens.
      */
      const mintStore = useMintsStore();
      receiveStore.showReceiveTokens = false;
      console.log("### receive tokens", receiveStore.receiveData.tokensBase64);
      try {
        if (receiveStore.receiveData.tokensBase64.length == 0) {
          throw new Error("no tokens provided.");
        }
        const tokenJson = token.decode(receiveStore.receiveData.tokensBase64);
        if (tokenJson == undefined) {
          throw new Error("no tokens provided.");
        }
        let proofs = token.getProofs(tokenJson);
        // check if we have all mints
        for (var i = 0; i < tokenJson.token.length; i++) {
          if (
            !mintStore.mints
              .map((m) => m.url)
              .includes(token.getMint(tokenJson))
          ) {
            // pop up add mint dialog warning
            // hack! The "add mint" component is in SettingsView which may now
            // have been loaded yet. We switch the tab to settings to make sure
            // that it loads. Remove this code when the TrustMintComnent is refactored!
            // await this.setTab("settings");
            uIStore.setTab("settings");
            mintStore.setMintToAdd(tokenJson.token[i].mint);
            mintStore.showAddMintDialog = true;
            // this.addMintDialog.show = true;
            // show the token receive dialog again for the next attempt
            receiveStore.showReceiveTokens = true;
            return;
          }

          // TODO: We assume here that all proofs are from one mint! This will fail if
          // that's not the case!
          if (token.getMint(tokenJson) != mintStore.activeMintUrl) {
            await mintStore.activateMintUrl(token.getMint(tokenJson));
          }
        }

        const amount = proofs.reduce((s, t) => (s += t.amount), 0);

        // redeem
        await this.split(proofs, amount);

        // update UI

        // HACK: we need to do this so the balance updates
        // mintStore.addProofs(mintStore.proofs.concat([]));
        // mintStore.setActiveProofs(mintStore.activeProofs.concat([]));
        mintStore.getBalance();

        tokenStore.addPaidToken({
          amount,
          serializedProofs: receiveStore.receiveData.tokensBase64,
        });

        if (window.navigator.vibrate) navigator.vibrate(200);
        notifySuccess("Ecash Received");
      } catch (error: any) {
        console.error(error);
        try {
          notifyApiError(error);
        } catch { }
        throw error;
      }
      // }
    },
    // SPLIT

    split: async function (proofs: WalletProof[], amount: number) {
      /*
                    supplies proofs and requests a split from the mint of these
                    proofs at a specific amount
                    */
      const mintStore = useMintsStore();
      try {
        if (proofs.length == 0) {
          throw new Error("no proofs provided.");
        }
        let { firstProofs, scndProofs } = await this.splitApi(proofs, amount);
        mintStore.removeProofs(proofs);
        // add new firstProofs, scndProofs to this.proofs
        mintStore.addProofs(
          firstProofs.concat(scndProofs)
        );
        return { firstProofs, scndProofs };
      } catch (error: any) {
        console.error(error);
        try {
          try {
            notifyApiError(error);
          } catch { }
        } catch { }
        throw error;
      }
    },

    // /split

    splitApi: async function (proofs: Proof[], amount: number) {
      const proofsStore = useProofsStore();
      const mintStore = useMintsStore();
      try {
        const total = proofsStore.sumProofs(proofs);
        const frst_amount = total - amount;
        const scnd_amount = amount;
        const frst_amounts = splitAmount(frst_amount);
        const scnd_amounts = splitAmount(scnd_amount);
        const amounts = _.clone(frst_amounts);
        amounts.push(...scnd_amounts);
        let secrets = await this.generateSecrets(amounts);
        if (secrets.length != amounts.length) {
          throw new Error(
            "number of secrets does not match number of outputs."
          );
        }
        const keysets = mintStore.activeMint().keysets;
        if (keysets == null || keysets.length == 0) {
          throw new Error("no keysets found.");
        }
        const keyset_id = keysets[0].id;
        let { outputs, rs } = await this.constructOutputs(amounts, secrets, keyset_id);
        const payload: SplitPayload = {
          inputs: proofs,
          outputs: outputs,
        };
        const data = await mintStore.activeMint().api.split(payload);

        // push all promise, amount, secret, rs to mintStore.appendBlindSignatures
        for (let i = 0; i < data.signatures.length; i++) {
          mintStore.appendBlindSignatures(
            data.signatures[i],
            amounts[i],
            secrets[i],
            rs[i]
          );
        }

        mintStore.assertMintError(data);
        const first_promises = data.signatures.slice(0, frst_amounts.length);
        const frst_rs = rs.slice(0, frst_amounts.length);
        const frst_secrets = secrets.slice(0, frst_amounts.length);
        const scnd_promises = data.signatures.slice(frst_amounts.length);
        const scnd_rs = rs.slice(frst_amounts.length);
        const scnd_secrets = secrets.slice(frst_amounts.length);
        const firstProofs = await this.constructProofs(
          first_promises,
          frst_secrets,
          frst_rs,
        );
        const scndProofs = await this.constructProofs(
          scnd_promises,
          scnd_secrets,
          scnd_rs,
        );

        return { firstProofs, scndProofs };
      } catch (error: any) {
        this.payInvoiceData.blocking = false;
        console.error(error);
        try {
          notifyApiError(error);
        } catch { }
        throw error;
      }
    },

    // /mint
    /**
     * Ask the mint to generate an invoice for the given amount
     * Upon paying the request, the mint will credit the wallet with
     * cashu tokens
     */
    requestMint: async function (amount?: number) {
      const mintStore = useMintsStore();
      if (amount) {
        this.invoiceData.amount = amount;
      }
      try {
        // create RequestMintPayload(this.invoiceData.amount) payload
        const payload: RequestMintPayload = {
          amount: this.invoiceData.amount, unit: "sat"
        };
        const data = await mintStore.activeMint().api.mintQuote(
          payload
        );
        this.invoiceData.bolt11 = data.request;
        this.invoiceData.quote = data.quote;
        this.invoiceHistory.push({
          ...this.invoiceData,
          date: currentDateStr(),
          status: "pending",
          mint: mintStore.activeMintUrl,
        });
        return data;
      } catch (error: any) {
        console.error(error);
        notifyApiError(error, "Could not request mint");
      }
    },
    mintApi: async function (amounts: number[], hash: string, verbose: boolean = true) {
      /*
                asks the mint to check whether the invoice with payment_hash has been paid
                and requests signing of the attached outputs.
                */
      const mintStore = useMintsStore();
      try {
        const secrets = await this.generateSecrets(amounts);
        const keysets = mintStore.activeMint().keysets;
        if (keysets == null || keysets.length == 0) {
          throw new Error("no keysets found.");
        }
        const keyset_id = keysets[0].id;
        const { outputs, rs } = await this.constructOutputs(amounts, secrets, keyset_id);

        const payload: PostMintPayload = {
          outputs: outputs,
          quote: hash,
        };
        const data = await mintStore.activeMint().api.mint(payload);
        mintStore.assertMintError(data, false);
        let proofs = await this.constructProofs(
          data.signatures,
          secrets,
          rs
        );
        return proofs;
      } catch (error: any) {
        console.error(error);
        if (verbose) {
          try {
            notifyApiError(error);
          } catch { }
        }
        throw error;
      }
    },
    mint: async function (amount: number, hash: string, verbose: boolean = true) {
      const proofsStore = useProofsStore();
      const mintStore = useMintsStore();
      const tokenStore = useTokensStore();

      try {
        const split = splitAmount(amount);
        const proofs = await this.mintApi(split, hash, verbose);
        if (!proofs.length) {
          throw "could not mint";
        }
        mintStore.addProofs(proofs);
        // hack to update balance
        // mintStore.setActiveProofs(mintStore.activeProofs.concat([]));
        // this.storeProofs();

        // update UI
        await this.setInvoicePaid(hash);
        tokenStore.addPaidToken({
          amount,
          serializedProofs: proofsStore.serializeProofs(proofs),
        });

        return proofs;
      } catch (error: any) {
        console.error(error);
        if (verbose) {
          try {
            notifyApiError(error);
          } catch { }
        }
        throw error;
      }
    },
    melt: async function () {
      const proofsStore = useProofsStore();
      const mintStore = useMintsStore();
      const tokenStore = useTokensStore();

      this.payInvoiceData.blocking = true;
      console.log("#### pay lightning");
      if (this.payInvoiceData.invoice == null) {
        throw new Error("no invoice provided.");
      }
      const amount_invoice = this.payInvoiceData.invoice.sat;
      const quote = await this.meltQuote(this.payInvoiceData.data.request);
      const amount = amount_invoice + quote.fee_reserve;

      console.log(
        "#### amount invoice",
        amount_invoice,
        "amount with fees",
        amount
      );
      const keep_send = await this.splitToSend(
        mintStore.activeProofs,
        amount
      );
      const scndProofs = keep_send.scndProofs;
      proofsStore.setReserved(scndProofs, true);
      try {
        // NUT-08 blank outputs for change
        let n_outputs = Math.max(Math.ceil(Math.log2(quote.fee_reserve)), 1);
        let amounts = Array.from({ length: n_outputs }, () => 1);
        let secrets = await this.generateSecrets(amounts);
        const keysets = mintStore.activeMint().keysets;
        if (keysets == null || keysets.length == 0) {
          throw new Error("no keysets found.");
        }
        const keyset_id = keysets[0].id;
        let { outputs, rs } = await this.constructOutputs(amounts, secrets, keyset_id);

        let amount_paid = amount;
        const payload: MeltPayload = {
          inputs: scndProofs.flat(),
          outputs: outputs,
          quote: quote.quote,
        };
        const data = await mintStore.activeMint().api.melt(payload);
        mintStore.assertMintError(data);
        if (data.paid != true) {
          throw new Error("Invoice not paid.");
        }

        if (window.navigator.vibrate) navigator.vibrate(200);

        notifySuccess("Invoice Paid");
        console.log("#### pay lightning: token paid");
        // delete spent tokens from db
        mintStore.removeProofs(scndProofs);

        // NUT-08 get change
        if (data.change != null) {
          const changeProofs = await this.constructProofs(
            data.change,
            secrets,
            rs
          );
          console.log(
            "## Received change: " + proofsStore.sumProofs(changeProofs)
          );
          amount_paid = amount_paid - proofsStore.sumProofs(changeProofs);
          mintStore.addProofs(changeProofs);
        }
        // update UI
        tokenStore.addPaidToken({
          amount: -amount_paid,
          serializedProofs: proofsStore.serializeProofs(scndProofs),
        });

        this.invoiceHistory.push({
          amount: -amount_paid,
          bolt11: this.payInvoiceData.data.request,
          quote: quote.quote,
          memo: "fixme",
          date: currentDateStr(),
          status: "paid",
          mint: mintStore.activeMintUrl,
        });

        this.payInvoiceData.invoice = {} as Invoice;
        this.payInvoiceData.show = false;
        this.payInvoiceData.blocking = false;
      } catch (error) {
        this.payInvoiceData.blocking = false;
        proofsStore.setReserved(scndProofs, false);
        console.error(error);
        throw error;
      }
    },

    // get a melt quote
    meltQuote: async function (payment_request: string) {
      const mintStore = useMintsStore();
      const payload: MeltQuotePayload = {
        unit: "sat",
        request: payment_request,
      };
      try {
        const data = await mintStore.activeMint().api.meltQuote(payload);
        mintStore.assertMintError(data);
        console.log("#### meltQuote", payment_request, data);
        return data;
      } catch (error: any) {
        console.error(error);
        try {
          notifyApiError(error);
        } catch { }
        throw error;
      }
    },
    // /check

    checkProofsSpendable: async function (proofs: Proof[], update_history = false) {
      /*
      checks with the mint whether an array of proofs is still
      spendable or already invalidated
      */
      const mintStore = useMintsStore();
      const proofsStore = useProofsStore();
      const tokenStore = useTokensStore();
      if (proofs.length == 0) {
        return;
      }
      const enc = new TextEncoder();
      const payload: CheckStatePayload = {
        // Ys is hashToCurve of the secret of proofs
        Ys: proofs.map((p) => hashToCurve(enc.encode(p.secret)).toHex(true)),
      };
      try {
        const spentProofs = await this.wallet.checkProofsSpent(proofs);
        // const data = await mintStore.activeMint().api.check(payload);
        // mintStore.assertMintError(data);
        if (spentProofs.length) {
          mintStore.removeProofs(spentProofs);

          // update UI
          if (update_history) {
            tokenStore.addPaidToken({
              amount: -proofsStore.sumProofs(spentProofs),
              serializedProofs: proofsStore.serializeProofs(spentProofs),
            });
          }
        }
        // return unspent proofs
        return spentProofs;
      } catch (error) {
        console.error(error);
        try {
          notifyApiError(error);
        } catch { }
        throw error;
      }
    },
    checkTokenSpendable: async function (tokenStr: string, verbose: boolean = true) {
      /*
      checks whether a base64-encoded token (from the history table) has been spent already.
      if it is spent, the appropraite entry in the history table is set to paid.
      */
      const mintStore = useMintsStore();
      const tokenStore = useTokensStore();

      const tokenJson = token.decode(tokenStr);
      if (tokenJson == undefined) {
        throw new Error("no tokens provided.");
      }
      const proofs = token.getProofs(tokenJson);

      // activate the mint
      if (token.getMint(tokenJson).length > 0) {
        await mintStore.activateMintUrl(token.getMint(tokenJson));
      }

      const spentProofs = await this.checkProofsSpendable(proofs);
      let paid = false;
      if (spentProofs != undefined && spentProofs.length == proofs.length) {
        tokenStore.setTokenPaid(tokenStr);
        paid = true;
      }
      if (paid) {
        if (window.navigator.vibrate) navigator.vibrate(200);
        notifySuccess("Ecash Paid");
      } else {
        console.log("### token not paid yet");
        if (verbose) {
          notify("Token still pending");
        }
        // this.sendData.tokens = token
      }
      return paid;
    },
    checkInvoice: async function (quote: string, verbose = true) {
      const mintStore = useMintsStore();
      console.log("### checkInvoice.quote", quote);
      const invoice = this.invoiceHistory.find((i) => i.quote === quote);
      if (!invoice) {
        throw new Error("invoice not found");
      }
      try {
        if (invoice.mint != mintStore.activeMintUrl && invoice.mint != undefined) {
          await mintStore.activateMintUrl(invoice.mint, false);
        }
        const proofs = await this.mint(invoice.amount, invoice.quote, verbose);
        if (window.navigator.vibrate) navigator.vibrate(200);
        notifySuccess("Payment received", "top");
        return proofs;
      } catch (error) {
        if (verbose) {
          notify("Invoice still pending");
        }
        console.log("Invoice still pending", invoice.quote);
        throw error;
      }
    },
    ////////////// UI HELPERS //////////////

    checkPendingInvoices: async function (verbose: boolean = true) {
      const last_n = 10;
      let i = 0;
      for (const invoice of this.invoiceHistory.slice().reverse()) {
        if (i >= last_n) {
          break;
        }
        if (invoice.status === "pending" && invoice.amount > 0) {
          console.log("### checkPendingInvoices", invoice.quote)
          try {
            await this.checkInvoice(invoice.quote, verbose);
          } catch (error) {
            console.log(`${invoice.quote} still pending`);
            throw error;
          }
        }
        i += 1;
      }
    },
    checkPendingTokens: async function (verbose: boolean = true) {
      const tokenStore = useTokensStore();
      const last_n = 5;
      let i = 0;
      // invert for loop
      for (const token of tokenStore.historyTokens.slice().reverse()) {
        if (i >= last_n) {
          break;
        }
        if (token.status === "pending" && token.amount < 0) {
          console.log("### checkPendingTokens", token.token)
          this.checkTokenSpendable(token.token, verbose);
        }
        i += 1;
      }
    },

    // findTokenForAmount: function (amount) {
    //   const mintStore = useMintsStore();
    //   // unused coin selection
    //   for (const token of mintStore.activeProofs) {
    //     const index = token.promises?.findIndex((p) => p.amount === amount);
    //     if (index >= 0) {
    //       return {
    //         promise: token.promises[index],
    //         secret: token.secrets[index],
    //         r: token.rs[index],
    //       };
    //     }
    //   }
    // },
    decodeRequest: function (r = null) {
      const camera = useCameraStore();
      // set the argument as the data to parse
      if (typeof r == "string" && r != null) {
        this.payInvoiceData.data.request = r;
      }
      let reqtype = null;
      let req = null;
      // get request
      if (camera.camera.data) {
        // get request from camera
        req = camera.camera.data;
      } else if (this.payInvoiceData.data.request) {
        // get request from pay invoice dialog
        req = this.payInvoiceData.data.request;
      }
      if (req == null) {
        throw new Error("no request provided.");
      }

      if (req.toLowerCase().startsWith("lnbc")) {
        this.payInvoiceData.data.request = req;
        reqtype = "bolt11";
      } else if (req.toLowerCase().startsWith("lightning:")) {
        this.payInvoiceData.data.request = req.slice(10);
        reqtype = "bolt11";
      } else if (req.toLowerCase().startsWith("lnurl:")) {
        this.payInvoiceData.data.request = req.slice(6);
        reqtype = "lnurl";
      } else if (req.indexOf("lightning=lnurl1") !== -1) {
        this.payInvoiceData.data.request = req
          .split("lightning=")[1]
          .split("&")[0];
        reqtype = "lnurl";
      } else if (
        req.toLowerCase().startsWith("lnurl1") ||
        req.match(/[\w.+-~_]+@[\w.+-~_]/)
      ) {
        this.payInvoiceData.data.request = req;
        reqtype = "lnurl";
      } else if (req.indexOf("cashuA") !== -1) {
        // very dirty way of parsing cashu tokens from either a pasted token or a URL like https://host.com?token=eyJwcm
        receiveStore.receiveData.tokensBase64 = req.slice(req.indexOf("cashuA"));
        reqtype = "cashu";
      }

      if (reqtype == "bolt11") {
        console.log("#### QR CODE: BOLT11");
        this.payInvoiceData.show = true;
        let invoice;
        try {
          invoice = bolt11Decoder.decode(this.payInvoiceData.data.request);
        } catch (error) {
          notifyWarning("Failed to decode invoice", undefined, 3000);
          this.payInvoiceData.show = false;
          throw error;
        }

        // invoice.amount = invoice.sections[2] / 1000;
        // invoice.amount_msat = invoice.sections[2];
        let cleanInvoice = {};
        // let cleanInvoice = {
        //   msat: invoice.amount_msat,
        //   sat: invoice.amount,
        //   fsat: invoice.amount,
        // };
        // _.each(invoice.sections, (tag) => {
        //   console.log(tag);
        // });
        _.each(invoice.sections, (tag) => {
          if (_.isObject(tag) && _.has(tag, "name")) {
            if (tag.name === "amount") {
              cleanInvoice.msat = tag.value;
              cleanInvoice.sat = tag.value / 1000;
              cleanInvoice.fsat = cleanInvoice.sat;
            } else if (tag.name === "payment_hash") {
              cleanInvoice.hash = tag.value;
            } else if (tag.name === "description") {
              cleanInvoice.description = tag.value;
            } else if (tag.name === "timestamp") {
              cleanInvoice.timestamp = tag.value;
            } else if (tag.name === "expiry") {
              var expireDate = new Date(
                (cleanInvoice.timestamp + tag.value) * 1000
              );
              cleanInvoice.expireDate = date.formatDate(
                expireDate,
                "YYYY-MM-DDTHH:mm:ss.SSSZ"
              );
              cleanInvoice.expired = false; // TODO
            }
          }
        });

        this.payInvoiceData.invoice = Object.freeze(cleanInvoice) as Invoice;
      } else if (reqtype == "lnurl") {
        console.log("#### QR CODE: LNURL");
        this.lnurlPayFirst(this.payInvoiceData.data.request);
      } else if (reqtype == "cashu") {
        console.log("#### QR CODE: CASHU TOKEN");
        this.payInvoiceData.show = false;
        receiveStore.showReceiveTokens = true;
      }
    },
    lnurlPayFirst: async function (address: string) {
      var host;
      if (address.split("@").length == 2) {
        let [user, lnaddresshost] = address.split("@");
        host = `https://${lnaddresshost}/.well-known/lnurlp/${user}`;
      } else if (address.toLowerCase().slice(0, 6) === "lnurl1") {
        let host = Buffer.from(
          bech32.fromWords(bech32.decode(address, 20000).words)
        ).toString();
        var { data } = await axios.get(host);
        // const { data } = await LNbits.api.request(
        //   "POST",
        //   "/api/v1/payments/decode",
        //   "",
        //   {
        //     data: address,
        //   }
        // );
        host = data.domain;
      }
      if (host == undefined) {
        notifyError("Invalid LNURL", "LNURL Error");
        return;
      }
      var { data } = await axios.get(host);
      if (data.tag == "payRequest") {
        this.payInvoiceData.domain = host.split("https://")[1].split("/")[0];
        this.payInvoiceData.lnurlpay = data;
        if (
          this.payInvoiceData.lnurlpay.maxSendable ==
          this.payInvoiceData.lnurlpay.minSendable
        ) {
          this.payInvoiceData.data.amount =
            this.payInvoiceData.lnurlpay.maxSendable / 1000;
        }
        this.payInvoiceData.show = true;
      }
    },
    lnurlPaySecond: async function () {
      let amount = this.payInvoiceData.data.amount;
      if (this.payInvoiceData.lnurlpay == null) {
        notifyError("No LNURL data", "LNURL Error");
        return;
      }
      if (
        this.payInvoiceData.lnurlpay.tag == "payRequest" &&
        this.payInvoiceData.lnurlpay.minSendable <=
        amount * 1000 <=
        this.payInvoiceData.lnurlpay.maxSendable
      ) {
        var { data } = await axios.get(
          `${this.payInvoiceData.lnurlpay.callback}?amount=${amount * 1000}`
        );
        // check http error
        if (data.status == "ERROR") {
          notifyError(data.reason, "LNURL Error");
          return;
        }
        console.log(data.pr);
        this.payInvoiceData.data.request = data.pr;
        this.decodeRequest();
      }
    },
  },
});
