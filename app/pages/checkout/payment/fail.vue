<script setup lang="ts">
import CardPaymentResultPage from "~/components/commerce/CardPaymentResultPage.vue";

definePageMeta({
  skipCmsLoader: true,
});
</script>

<template>
  <CardPaymentResultPage hint="fail" />
</template>
