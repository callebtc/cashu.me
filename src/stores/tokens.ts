import { useLocalStorage } from "@vueuse/core";
import { date } from "quasar";
import { defineStore } from "pinia";
import { Proof, Token } from "@cashu/cashu-ts";

/**
 * The tokens store handles everything related to tokens and proofs
 */

type HistoryToken = {
  status: "paid" | "pending";
  amount: number;
  date: string;
  token: string;
  mint: string;
  unit: string;
};

export const useTokensStore = defineStore("tokens", {
  state: () => ({
    historyTokens: useLocalStorage("cashu.historyTokens", [] as HistoryToken[]),
    proofs: useLocalStorage("cashu.proofs", [] as Proof[]),
  }),
  actions: {
    /**
     * @param {{amount: number, serializedProofs: string}}
     */
    addPaidToken({
      amount,
      serializedProofs,
      mint,
      unit,
    }: {
      amount: number;
      serializedProofs: string;
      mint: string;
      unit: string;
    }) {
      this.historyTokens.push({
        status: "paid",
        amount,
        date: currentDateStr(),
        token: serializedProofs,
        mint,
        unit,
      });
    },
    addPendingToken({
      amount,
      serializedProofs,
      mint,
      unit,
    }: {
      amount: number;
      serializedProofs: string;
      mint: string;
      unit: string;
    }) {
      this.historyTokens.push({
        status: "pending",
        amount,
        date: currentDateStr(),
        token: serializedProofs,
        mint,
        unit,
      });
    },
    setTokenPaid(token: string) {
      const index = this.historyTokens.findIndex((t) => t.token === token);
      if (index >= 0) {
        this.historyTokens[index].status = "paid";
      }
    },
  },
});

function currentDateStr() {
  return date.formatDate(new Date(), "YYYY-MM-DD HH:mm:ss");
}
