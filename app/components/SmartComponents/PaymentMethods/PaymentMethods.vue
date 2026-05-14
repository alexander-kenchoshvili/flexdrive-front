<script setup lang="ts">
import LegalSmartPage from "~/components/common/LegalSmartPage.vue";
import type { LegalPageData } from "~/composables/useLegalPageSections";

defineProps<{
  data?: LegalPageData;
}>();
</script>

<template>
  <LegalSmartPage
    :data="data"
    default-title="გადახდის მეთოდები"
    anchor-prefix="payment-methods-section"
    icon-set="payment"
    nav-label="გადახდის მეთოდების სექციები"
    empty-text="გადახდის მეთოდების სექციები ჯერ არ არის დამატებული."
  />
</template>
