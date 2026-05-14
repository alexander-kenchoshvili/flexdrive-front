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
    default-title="მიწოდების პირობები"
    anchor-prefix="delivery-section"
    icon-set="delivery"
    nav-label="მიწოდების სექციები"
    empty-text="მიწოდების სექციები ჯერ არ არის დამატებული."
  />
</template>
