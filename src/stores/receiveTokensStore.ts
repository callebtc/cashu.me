import { defineStore } from "pinia";
import { Mint, useMintsStore } from "./mints";
import { useUiStore } from "./ui";
import { useP2PKStore } from "./p2pk";
import { useWalletStore } from "./wallet";
import token from "src/js/token";
import { useTokensStore } from "./tokens";
import {
  notifyError,
  notifySuccess,
  notify,
  notifyWarning,
} from "../js/notify";
import { getDecodedTokenBinary, getEncodedToken, Token } from "@cashu/cashu-ts";
import { useSwapStore } from "./swap";
import { Clipboard } from "@capacitor/clipboard";

export const useReceiveTokensStore = defineStore("receiveTokensStore", {
  state: () => ({
    showReceiveTokens: false,
    watchClipboardPaste: false,
    receiveData: {
      tokensBase64: "",
      p2pkPrivateKey: "",
    },
    scanningCard: false,
  }),
  actions: {
    decodeToken: function (encodedToken: string) {
      let decodedToken = undefined;
      try {
        decodedToken = token.decode(encodedToken);
      } catch (error) {}
      return decodedToken;
    },
    knowThisMintOfTokenJson: function (tokenJson: Token) {
      const mintStore = useMintsStore();
      let uniqueIds = [...new Set(token.getProofs(tokenJson).map((p) => p.id))];
      return mintStore.mints
        .map((m) => m.url)
        .includes(token.getMint(tokenJson));
    },
    receiveToken: async function (encodedToken: string) {
      const mintStore = useMintsStore();
      const walletStore = useWalletStore();
      const receiveStore = useReceiveTokensStore();
      const uiStore = useUiStore();
      console.log("### receive tokens", receiveStore.receiveData.tokensBase64);

      if (receiveStore.receiveData.tokensBase64.length == 0) {
        throw new Error("no tokens provided.");
      }

      // get the private key for the token we want to receive if it is locked with P2PK
      receiveStore.receiveData.p2pkPrivateKey =
        useP2PKStore().getPrivateKeyForP2PKEncodedToken(
          receiveStore.receiveData.tokensBase64
        );

      const tokenJson = token.decode(receiveStore.receiveData.tokensBase64);
      if (tokenJson == undefined) {
        throw new Error("no tokens provided.");
      }
      // check if we have all mints
      if (!this.knowThisMintOfTokenJson(tokenJson)) {
        // add the mint
        await mintStore.addMint({ url: token.getMint(tokenJson) });
      }
      // redeem the token
      await walletStore.redeem();
      receiveStore.showReceiveTokens = false;
      uiStore.closeDialogs();
    },
    receiveIfDecodes: async function () {
      try {
        const decodedToken = this.decodeToken(this.receiveData.tokensBase64);
        if (decodedToken) {
          await this.receiveToken(this.receiveData.tokensBase64);
          return true;
        }
      } catch (error) {
        console.error(error);
        return false;
      }
    },
    meltTokenToMint: async function (encodedToken: string, mint: Mint) {
      const receiveStore = useReceiveTokensStore();
      const mintStore = useMintsStore();
      const uiStore = useUiStore();
      const tokenJson = token.decode(encodedToken);
      if (tokenJson == undefined) {
        throw new Error("no tokens provided.");
      }
      // check if we have all mints
      if (!this.knowThisMintOfTokenJson(tokenJson)) {
        // add the mint
        await mintStore.addMint({ url: token.getMint(tokenJson) });
      }
      await useSwapStore().meltProofsToMint(tokenJson, mint);
      receiveStore.showReceiveTokens = false;
      uiStore.closeDialogs();
    },
    pasteToParseDialog: async function (verbose = false) {
      const text = await useUiStore().pasteFromClipboard();
      if (this.decodeToken(text)) {
        const tokensStore = useTokensStore();
        const historyToken = tokensStore.tokenAlreadyInHistory(text);

        if (
          historyToken &&
          (historyToken.amount > 0 || historyToken.status === "paid")
        ) {
          if (verbose) notify("Token already in history.");
          return false;
        }
        this.receiveData.tokensBase64 = text;
        return true;
      } else {
        // notifyWarning("Invalid token");
        return false;
      }
    },
    toggleScanner: function () {
      const receiveStore = useReceiveTokensStore();
      const tokenStore = useTokensStore();
      const uiStore = useUiStore();
      if (this.scanningCard === false) {
        try {
          this.ndef = new window.NDEFReader();
          this.controller = new AbortController();
          const signal = this.controller.signal;
          this.ndef
            .scan({ signal })
            .then(() => {
              console.log("> Scan started");

              this.ndef.addEventListener("readingerror", () => {
                console.error("Cannot read data from the NFC tag.");
                notifyError("Cannot read data from the NFC tag.");
                this.controller.abort();
                this.scanningCard = false;
              });

              this.ndef.addEventListener(
                "reading",
                ({ message, serialNumber }) => {
                  try {
                    const record = message.records[0];
                    const recordType = record.recordType;
                    let tokenStr = "";
                    switch (recordType) {
                      case "text":
                        const text = new TextDecoder().decode(record.data);
                        if (!text.startsWith("cashu")) {
                          throw new Error(
                            "text does not contain a cashu token"
                          );
                        }
                        tokenStr = text;
                        break;
                      case "url":
                        const url = new TextDecoder().decode(record.data);
                        const i = url.indexOf("#token=cashu");
                        if (i === -1) {
                          throw new Error("URL does not contain a cashu token");
                        }
                        tokenStr = url.substring(i + 7);
                        break;
                      case "mime":
                        if (record.mediaType !== "application/octet-stream") {
                          throw new Error("binary data expected");
                        }
                        const data = new Uint8Array(record.data.buffer);
                        const prefix = String.fromCharCode(...data.slice(0, 4));
                        if (prefix !== "craw") {
                          throw new Error(
                            "binary data does not contain a cashu token"
                          );
                        }
                        const token = getDecodedTokenBinary(data);
                        tokenStr = getEncodedToken(token);
                        break;
                      default:
                        throw new Error(`unsupported recordType ${recordType}`);
                    }
                    const historyToken =
                      tokenStore.tokenAlreadyInHistory(tokenStr);
                    if (!historyToken || historyToken.status === "pending") {
                      receiveStore.receiveData.tokensBase64 = tokenStr;
                      receiveStore.showReceiveTokens = true;
                      uiStore.closeDialogs();
                    } else {
                      notify("Token already in history.");
                    }
                  } catch (err) {
                    console.error(`Something went wrong! ${err}`);
                    notifyError(`Something went wrong! ${err}`);
                  }
                  this.controller.abort();
                  this.scanningCard = false;
                }
              );
              this.scanningCard = true;
            })
            .catch((error) => {
              console.error(`Scan error: ${error.message}`);
              notifyError(`Scan error: ${error.message}`);
            });
        } catch (error) {
          console.error(`NFC error: ${error.message}`);
          notifyError(`NFC error: ${error.message}`);
        }
      } else {
        this.controller.abort();
        this.scanningCard = false;
      }
    },
  },
});
