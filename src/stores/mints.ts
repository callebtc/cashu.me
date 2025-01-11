import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";
import { useWorkersStore } from "./workers";
import { notifyApiError, notifyError, notifySuccess } from "src/js/notify";
import {
  CashuMint,
  MintKeys,
  MintAllKeysets,
  MintActiveKeys,
  Proof,
  SerializedBlindedSignature,
  MintKeyset,
  GetInfoResponse,
} from "@cashu/cashu-ts";
import { useUiStore } from "./ui";
export type Mint = {
  url: string;
  keys: MintKeys[];
  keysets: MintKeyset[];
  nickname?: string;
  info?: GetInfoResponse;
  // initialize api: new CashuMint(url) on activation
};

export class MintClass {
  mint: Mint;
  constructor(mint: Mint) {
    this.mint = mint;
  }
  get api() {
    return new CashuMint(this.mint.url);
  }
  get proofs() {
    const mintStore = useMintsStore();
    return mintStore.proofs.filter((p) =>
      this.mint.keysets.map((k) => k.id).includes(p.id)
    );
  }
  // get balance() {
  //   const proofs = this.proofs;
  //   return proofs.reduce((sum, p) => sum + p.amount, 0);
  // }

  get allBalances() {
    // return an object with all balances for each unit
    const balances: Record<string, number> = {};
    this.units.forEach((unit) => {
      balances[unit] = this.unitBalance(unit);
    });
    return balances;
  }

  get keysets() {
    return this.mint.keysets.filter((k) => k.active);
  }

  get units() {
    return this.mint.keysets
      .map((k) => k.unit)
      .filter((value, index, self) => self.indexOf(value) === index);
  }

  unitKeysets(unit: string): MintKeyset[] {
    return this.mint.keysets.filter((k) => k.unit === unit);
  }

  unitProofs(unit: string) {
    const unitKeysets = this.unitKeysets(unit);
    return this.proofs.filter((p) =>
      unitKeysets.map((k) => k.id).includes(p.id)
    );
  }

  unitBalance(unit: string) {
    const proofs = this.unitProofs(unit);
    return proofs.reduce((sum, p) => sum + p.amount, 0);
  }
}

// type that extends type Proof with reserved boolean
export type WalletProof = Proof & { reserved: boolean; quote?: string };

export type Balances = {
  [unit: string]: number;
};

type BlindSignatureAudit = {
  signature: SerializedBlindedSignature;
  amount: number;
  secret: Uint8Array;
  id: string;
  r: string;
};

export const useMintsStore = defineStore("mints", {
  state: () => {
    return {
      activeUnit: useLocalStorage<string>("cashu.activeUnit", "sat"),
      activeMintUrl: useLocalStorage<string>("cashu.activeMintUrl", ""),
      addMintData: {
        url: "",
        nickname: "",
      },
      mints: useLocalStorage("cashu.mints", [] as Mint[]),
      proofs: useLocalStorage("cashu.proofs", [] as WalletProof[]),
      blindSignatures: useLocalStorage(
        "cashu.blindSignatures",
        [] as BlindSignatureAudit[]
      ),
      // balances: useLocalStorage("cashu.balances", {} as Balances),
      showAddMintDialog: false,
      addMintBlocking: false,
      showRemoveMintDialog: false,
      showMintInfoDialog: false,
      showMintInfoData: {} as Mint,
    };
  },
  getters: {
    multiMints({ activeUnit }) {
      return this.mints.filter((m) => {
        try {
          const nut15 = m.info?.nuts[15];
          /*
          const viableMint = nut15?.methods.find(
            (m) => m.method === "bolt11" && m.unit === activeUnit
          );
          */
          if (nut15) return true;
          else return false;
        } catch (e) {
          console.error(`${e}`);
          return false;
        }
      });
    },
    activeProofs({ activeMintUrl, activeUnit }): WalletProof[] {
      const unitKeysets = this.mints
        .find((m) => m.url === activeMintUrl)
        ?.keysets?.filter((k) => k.unit === activeUnit);
      if (!unitKeysets) {
        return [];
      }
      return this.proofs.filter((p) =>
        unitKeysets.map((k) => k.id).includes(p.id)
      );
    },
    activeBalance({ activeUnit }): number {
      const allUnitKeysets = this.mints
        .map((m) => m.keysets)
        .flat()
        .filter((k) => k.unit === activeUnit);
      const balance = this.proofs
        .filter((p) => allUnitKeysets.map((k) => k.id).includes(p.id))
        .reduce((sum, p) => sum + p.amount, 0);
      return balance;
    },
    activeKeysets({ activeMintUrl, activeUnit }): MintKeyset[] {
      const unitKeysets = this.mints
        .find((m) => m.url === activeMintUrl)
        ?.keysets?.filter((k) => k.unit === activeUnit);
      if (!unitKeysets) {
        return [];
      }
      return unitKeysets;
    },
    activeKeys({ activeMintUrl, activeUnit }): MintKeys[] {
      const unitKeys = this.mints
        .find((m) => m.url === activeMintUrl)
        ?.keys?.filter((k) => k.unit === activeUnit);
      if (!unitKeys) {
        return [];
      }
      return unitKeys;
    },
    activeInfo({ activeMintUrl }): GetInfoResponse {
      return (
        this.mints.find((m) => m.url === activeMintUrl)?.info ||
        ({} as GetInfoResponse)
      );
    },
    activeUnitLabel({ activeUnit }): string {
      if (activeUnit == "sat") {
        return "SAT";
      } else if (activeUnit == "usd") {
        return "USD";
      } else if (activeUnit == "eur") {
        return "EUR";
      } else if (activeUnit == "msat") {
        return "mSAT";
      } else {
        return activeUnit;
      }
    },
    activeUnitCurrencyMultiplyer({ activeUnit }): number {
      if (activeUnit == "usd") {
        return 100;
      } else if (activeUnit == "eur") {
        return 100;
      } else {
        return 1;
      }
    },
  },
  actions: {
    activeMint() {
      const mint = this.mints.find((m) => m.url === this.activeMintUrl);
      if (mint) {
        return new MintClass(mint);
      } else {
        if (this.mints.length) {
          console.error(
            "No active mint. This should not happen. switching to first one."
          );
          this.activateMintUrl(this.mints[0].url, false, true);
          return new MintClass(this.mints[0]);
        }
        throw new Error("No active mint");
      }
    },
    mintUnitProofs(mint: Mint, unit: string): WalletProof[] {
      const unitKeysets = mint.keysets.filter((k) => k.unit === unit);
      return this.proofs.filter((p) =>
        unitKeysets.map((k) => k.id).includes(p.id)
      );
    },
    activeMintBalance() {
      // return balance of active mint in active unit
      return this.activeMint().unitBalance(this.activeUnit);
    },
    toggleUnit: function () {
      const units = this.activeMint().units;
      this.activeUnit =
        units[(units.indexOf(this.activeUnit) + 1) % units.length];
      return this.activeUnit;
    },
    proofsToWalletProofs(proofs: Proof[], quote?: string): WalletProof[] {
      return proofs.map((p) => {
        return {
          ...p,
          reserved: false,
          quote: quote,
        } as WalletProof;
      });
    },
    addProofs(proofs: Proof[], quote?: string) {
      const walletProofs = this.proofsToWalletProofs(proofs);
      // do not store DLEQ proofs
      walletProofs.forEach((p) => {
        if (!p.dleq) {
          return;
        }
        if (!p.dleqValid) {
          notifyError("Invalid DLEQ, mint might be tagging you!");
        }
        delete p.dleq;
        delete p.dleqValid;
      });

      this.proofs = this.proofs.concat(walletProofs);
    },
    removeProofs(proofs: Proof[]) {
      const walletProofs = this.proofsToWalletProofs(proofs);
      // remove walletProofs with the same secret from this.proofs
      this.proofs = this.proofs.filter((p) => {
        return !walletProofs.some((wp) => {
          return wp.secret === p.secret;
        });
      });
    },
    appendBlindSignatures(
      signature: SerializedBlindedSignature,
      amount: number,
      secret: Uint8Array,
      r: Uint8Array
    ) {
      const audit: BlindSignatureAudit = {
        signature: signature,
        amount: amount,
        secret: secret,
        id: signature.id,
        r: Buffer.from(r).toString("hex"),
      };
      this.blindSignatures.push(audit);
    },
    toggleActiveUnitForMint(mint: Mint) {
      // method to set the active unit to one that is supported by `mint`
      const mintClass = new MintClass(mint);
      if (
        !this.activeUnit ||
        mintClass.allBalances[this.activeUnit] == undefined
      ) {
        this.activeUnit = mintClass.units[0];
      }
    },
    updateMint(oldMint: Mint, newMint: Mint) {
      const index = this.mints.findIndex((m) => m.url === oldMint.url);
      this.mints[index] = newMint;
    },
    getKeysForKeyset: async function (keyset_id: string): Promise<MintKeys> {
      const mint = this.mints.find((m) => m.url === this.activeMintUrl);
      if (mint) {
        const keys = mint.keys?.find((k) => k.id === keyset_id);
        if (keys) {
          return keys;
        } else {
          throw new Error("Keys not found");
        }
      } else {
        throw new Error("Mint not found");
      }
    },
    addMint: async function (
      addMintData: { url: string; nickname?: string },
      verbose = false
    ): Promise<Mint> {
      let url = addMintData.url;
      this.addMintBlocking = true;
      try {
        // sanitize url
        const sanitizeUrl = (url: string): string => {
          let cleanedUrl = url.trim().replace(/\/+$/, "");
          if (!/^[a-z]+:\/\//.test(cleanedUrl)) {
            // Check for any protocol followed by "://"
            cleanedUrl = "https://" + cleanedUrl;
          }
          return cleanedUrl;
        };
        url = sanitizeUrl(url);

        const mintToAdd: Mint = {
          url: url,
          keys: [],
          keysets: [],
          nickname: addMintData.nickname,
        };

        // we have no mints at all
        if (this.mints.length === 0) {
          this.mints = [mintToAdd];
        } else if (this.mints.filter((m) => m.url === url).length === 0) {
          // we don't have this mint yet
          // add mint to this.mints so it can be activated in
          this.mints.push(mintToAdd);
        } else {
          // we already have this mint
          if (verbose) {
            notifySuccess("Mint already added");
          }
          return mintToAdd;
        }
        await this.activateMint(mintToAdd, false, true);
        if (verbose) {
          await notifySuccess("Mint added");
        }
        return mintToAdd;
      } catch (error) {
        // activation failed, we remove the mint again from local storage
        this.mints = this.mints.filter((m) => m.url !== url);
        throw error;
      } finally {
        this.showAddMintDialog = false;
        this.addMintBlocking = false;
      }
    },
    activateMintUrl: async function (
      url: string,
      verbose = false,
      force = false,
      unit: string | undefined = undefined
    ) {
      const mint = this.mints.filter((m) => m.url === url)[0];
      if (mint) {
        await this.activateMint(mint, verbose, force);
        if (unit) {
          await this.activateUnit(unit, verbose);
        }
      } else {
        notifyError("Mint not found", "Mint activation failed");
      }
    },
    activateUnit: async function (unit: string, verbose = false) {
      if (unit === this.activeUnit) {
        return;
      }
      const uIStore = useUiStore();
      await uIStore.lockMutex();
      const mint = this.mints.find((m) => m.url === this.activeMintUrl);
      if (!mint) {
        notifyError("No active mint", "Unit activation failed");
        return;
      }
      const mintClass = new MintClass(mint);
      if (mintClass.units.includes(unit)) {
        this.activeUnit = unit;
      } else {
        notifyError("Unit not supported by mint", "Unit activation failed");
      }
      await uIStore.unlockMutex();
      const worker = useWorkersStore();
      worker.clearAllWorkers();
    },
    activateMint: async function (mint: Mint, verbose = false, force = false) {
      if (mint.url === this.activeMintUrl && !force) {
        return;
      }
      const workers = useWorkersStore();
      const uIStore = useUiStore();
      // we need to stop workers because they will reset the activeMint again
      workers.clearAllWorkers();

      // create new mint.api instance because we can't store it in local storage
      let previousUrl = this.activeMintUrl;
      await uIStore.lockMutex();
      try {
        this.activeMintUrl = mint.url;
        console.log("### this.activeMintUrl", this.activeMintUrl);
        mint.info = await this.fetchMintInfo(mint);
        console.log("### activateMint: Mint info: ", mint.info);
        mint = await this.fetchMintKeys(mint);
        this.toggleActiveUnitForMint(mint);
        if (verbose) {
          await notifySuccess("Mint activated.");
        }
        console.log("### activateMint: Mint activated: ", this.activeMintUrl);
      } catch (error: any) {
        // restore previous values because the activation errored
        // this.activeMintUrl = previousUrl;
        let err_msg = "Could not connect to mint.";
        if (error.message.length) {
          err_msg = err_msg + ` ${error.message}.`;
        }
        await notifyError(err_msg, "Mint activation failed");
        throw error;
      } finally {
        await uIStore.unlockMutex();
      }
    },
    fetchMintInfo: async function (mint: Mint) {
      try {
        const mintClass = new MintClass(mint);
        const data = await mintClass.api.getInfo();
        return data;
      } catch (error: any) {
        console.error(error);
        try {
          // notifyApiError(error, "Could not get mint info");
        } catch {}
        throw error;
      }
    },
    fetchMintKeys: async function (mint: Mint): Promise<Mint> {
      try {
        const mintClass = new MintClass(mint);
        const keysets = await this.fetchMintKeysets(mint);
        if (keysets.length > 0) {
          // store keysets in mint and update local storage
          // TODO: do not overwrite anykeyset, but append new keysets and update existing ones
          this.mints.filter((m) => m.url === mint.url)[0].keysets = keysets;
        }

        // if we do not have any keys yet, fetch them
        if (mint.keys.length === 0 || mint.keys.length == undefined) {
          const keys = await mintClass.api.getKeys();
          // store keys in mint and update local storage
          this.mints.filter((m) => m.url === mint.url)[0].keys = keys.keysets;
        }
        // reload mint from local storage
        mint = this.mints.filter((m) => m.url === mint.url)[0];

        // for each keyset we do not have keys for, fetch keys
        for (const keyset of keysets) {
          if (!mint.keys.find((k) => k.id === keyset.id)) {
            const keys = await mintClass.api.getKeys(keyset.id);
            // store keys in mint and update local storage
            this.mints
              .filter((m) => m.url === mint.url)[0]
              .keys.push(keys.keysets[0]);
          }
        }

        // const keys = await mintClass.api.getKeys();
        // // store keys in mint and update local storage
        // // TODO: Do not overwrite existing keysets, only add new ones
        // this.mints.filter((m) => m.url === mint.url)[0].keys = keys.keysets;

        // return the mint with keys set
        return this.mints.filter((m) => m.url === mint.url)[0];
      } catch (error: any) {
        console.error(error);
        try {
          // notifyApiError(error, "Could not get mint keys");
        } catch {}
        throw error;
      }
    },
    fetchMintKeysets: async function (mint: Mint) {
      // attention: this function overwrites this.keysets
      try {
        const mintClass = new MintClass(mint);
        const data = await mintClass.api.getKeySets();
        return data.keysets;
      } catch (error: any) {
        console.error(error);
        try {
          // notifyApiError(error, "Could not get mint keysets");
        } catch {}
        throw error;
      }
    },
    removeMint: async function (url: string) {
      this.mints = this.mints.filter((m) => m.url !== url);
      if (url === this.activeMintUrl) {
        this.activeMintUrl = "";
      }
      // todo: we always reset to the first mint, improve this
      if (this.mints.length > 0) {
        await this.activateMint(this.mints[0], false);
      }
      notifySuccess("Mint removed");
    },
    restoreFromBackup: function (backup: any) {
      if (!backup) {
        notifyError("Unrecognized Backup Format!");
      } else {
        const keys = Object.keys(backup);
        keys.forEach((key) => {
          localStorage.setItem(key, backup[key]);
        });
        notifySuccess("Backup restored");
        window.location.reload();
      }
    },
    assertMintError: function (response: { error?: any }, verbose = true) {
      if (response.error != null) {
        if (verbose) {
          notifyError(response.error, "Mint error");
        }
        throw new Error(`Mint error: ${response.error}`);
      }
    },
    proofsForMintAndUnit: function (
      unit: string,
      mint: MintClass
    ): WalletProof[] {
      const unitKeysets = this.mints
        .find((m) => m.url === mint.mint.url)
        ?.keysets?.filter((k) => k.unit === unit);
      if (!unitKeysets) {
        return [];
      }
      return this.proofs.filter((p) =>
        unitKeysets.map((k) => k.id).includes(p.id)
      );
    },
    // getBalance: function () {
    //   const mint = this.mints.find((m) => m.url === this.activeMintUrl);
    //   if (mint) {
    //     return mint.balance;
    //   }
    //   return null
    // }
  },
});
