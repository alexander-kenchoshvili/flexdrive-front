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
    default-title="კონფიდენციალურობის პოლიტიკა"
    anchor-prefix="privacy-section"
    icon-set="privacy"
    nav-label="კონფიდენციალურობის სექციები"
    empty-text="კონფიდენციალურობის სექციები ჯერ არ არის დამატებული."
  />
</template>
