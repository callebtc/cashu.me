<template>
  <div></div>
</template>

<script>
import { defineComponent, ref } from "vue";
import handler from "src/js/embedded.ts";

export default defineComponent({
  name: "EmbeddedLayout",
  mounted() {
    if (!handler.isEmbedded) {
      this.$router.push("/")
      return;
    }
    handler.registerHandler("ping", (payload) => {
      handler.ready();
    });
    handler.registerHandler("request-funds", (payload) => {
      this.$router.push(`embedded/request-funds/${payload.asset}/${payload.amount}`)
    });
  },
});
</script>
