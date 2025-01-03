<template>
  <div style="max-width: 800px; margin: 0 auto">
    <!-- Mints Selection -->
    <div class="q-px-xs text-left" on-left>
      <q-list padding>
        <q-item>
          <q-item-section>
            <q-item-label overline class="text-weight-bold">
              Mutlinut payment
            </q-item-label>
            <q-item-label caption>
              Select one or multiple mints to execute a payment from.
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <!-- List of mints with checkboxes -->
    <div class="q-pb-md q-px-xs text-left" on-left>
      <q-list padding>
        <div v-for="mint in mints" :key="mint.url">
          <q-item clickable class="q-pb-xs">
            <q-item-section avatar>
              <q-checkbox
                v-model="selectedMints"
                :val="mint.url"
                :color="selectedMints.includes(mint.url) ? 'primary' : 'grey'"
                class="cursor-pointer"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label
                lines="1"
                class="cursor-pointer"
                style="word-break: break-word"
              >
                {{ mint.nickname || mint.url }}
              </q-item-label>
              <q-item-label>
                <q-badge
                  v-for="unit in mintClass(mint).units"
                  :key="unit"
                  :color="selectedMints.includes(mint.url) ? 'primary' : 'grey'"
                  :label="
                    formatCurrency(mintClass(mint).unitBalance(unit), unit)
                  "
                  class="q-mx-xs q-mb-xs"
                />
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-separator spaced />
        </div>
        <!-- Total Selected Balance -->
        <q-item>
          <q-item-section>
            <q-item-label overline class="text-weight-bold">
              Total Selected Balance
            </q-item-label>
            <q-item-label caption>
              {{ formatCurrency(totalSelectedBalance, activeUnit) }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
      <!-- button to quote all selected mints -->
      <q-btn
        unelevated
        rounded
        color="primary"
        :disabled="selectedMints.length === 0"
        @click="quoteSelectedMints"
        label="Quote"
        :loading="quoteButtonLoading"
        class="q-px-lg"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { mapActions, mapState, mapWritableState } from "pinia";
import { useMintsStore, MintClass } from "src/stores/mints";
import { useWalletStore } from "src/stores/wallet";

export default defineComponent({
  name: "MultinutView",
  mixins: [windowMixin],
  data() {
    return {
      selectedMints: [],
    };
  },
  computed: {
    ...mapWritableState(useWalletStore, ["payInvoiceData"]),
    ...mapState(useMintsStore, ["mints", "activeUnit"]),
    totalSelectedBalance() {
      return this.selectedMints.reduce((total, mintUrl) => {
        const mint = this.mints.find((m) => m.url === mintUrl);
        if (mint) {
          const mintInstance = this.mintClass(mint);
          return total + mintInstance.unitBalance(this.activeUnit);
        }
        return total;
      }, 0);
    },
  },
  methods: {
    ...mapActions(useWalletStore, ["meltQuote", "melt"]),
    ...mapActions(useMintsStore, ["activateMintUrl"]),
    mintClass(mint) {
      return new MintClass(mint);
    },
    quoteSelectedMints: async function () {
      const totalQuoteAmount = this.payInvoiceData.meltQuote.response.amount;
      const nSelectedMints = this.selectedMints.length;
      const amountPerMint = totalQuoteAmount / nSelectedMints;
      let quotesArray = [];
      for (const mintUrl of this.selectedMints) {
        console.log(`Quoting mint: ${mintUrl}`);
        const mintWallet = useWalletStore().mintWallet(
          mintUrl,
          useMintsStore().activeUnit
        );
        // await this.activateMintUrl(mintUrl);
        this.payInvoiceData.input.amount = amountPerMint;
        const quote = await this.meltQuote(
          mintWallet,
          this.payInvoiceData.input.request,
          amountPerMint
        );
        console.log(quote);
        quotesArray.push(quote);
      }
      // for (let i = 0; i < nSelectedMints; i++) {
      //   console.log(`Paying mint: ${this.selectedMints[i]}`);
      //   await this.activateMintUrl(this.selectedMints[i]);
      //   this.payInvoiceData.meltQuote.response = quotesArray[i];
      //   await this.melt();
      // }
    },
  },
});
</script>
