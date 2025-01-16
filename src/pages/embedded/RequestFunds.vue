<template>
  <div>
    <h1>Request Funds</h1>
    <p>
      You are requesting funds for the asset: <strong>{{ asset }}</strong> with
      the amount: <strong>{{ amount }}</strong>.
    </p>
    <button @click="approve">Approve</button>
    <button @click="cancel">Cancel</button>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import handler from "src/js/embedded.ts";
import { registerBroadcastChannel } from "src/js/broadcast_channel.ts"

export default defineComponent({
  name: "RequestFunds",
  data() {
    return {
      asset: null, // Asset from the route parameters
      amount: null, // Amount from the route parameters
    };
  },
  created() {
    registerBroadcastChannel(this.$router);
  },
  mounted() {
    if (!handler.isEmbedded) {
      this.$router.push("/");
      return;
    }

    // Extract route parameters
    const { asset, amount } = this.$route.params;

    if (!asset || !amount) {
      console.error("RequestFunds: Missing required route parameters.");
      handler.makeHidden();
      this.$router.push("/embedded");
      return;
    }

    this.asset = asset;
    this.amount = amount;

    // Call makeVisible to inform the parent window
    try {
      handler.makeVisible();
      console.log("RequestFunds: Made the wallet visible to proceed.");
    } catch (error) {
      console.error("RequestFunds: Error making wallet visible", error);
    }
  },
  methods: {
    approve() {
      handler.sendProofs(["proofs 1", "proofs 2"])
      handler.makeHidden();
      this.$router.push("/embedded");
    },
    cancel() {
      console.log("Transaction canceled. Redirecting to embedded layout.");
      handler.makeHidden();
      this.$router.push("/embedded");
    },
  },
});
</script>

<style scoped>
h1 {
  font-size: 24px;
}

p {
  font-size: 18px;
  margin-bottom: 16px;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  margin-right: 8px;
  cursor: pointer;
}
</style>
