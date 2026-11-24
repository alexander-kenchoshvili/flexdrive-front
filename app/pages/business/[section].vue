<script setup lang="ts">
import { BUSINESS_SECTIONS } from "~/utils/businessRouting";

definePageMeta({ layout: "business", middleware: "business-auth", skipCmsLoader: true, key: (route) => route.path });
const route = useRoute();
const section = computed(() => BUSINESS_SECTIONS.find((item) => item.key === route.params.section));
if (!section.value || section.value.key === "overview") {
  throw createError({ statusCode: 404, statusMessage: "გვერდი ვერ მოიძებნა" });
}
useSeoMeta({ title: () => `${section.value?.label || "ბიზნესპანელი"} — FlexDrive`, robots: "noindex, nofollow" });
</script>

<template>
  <BusinessReport v-if="section && (section.key === 'sales' || section.key === 'finance')" :key="`report:${section.key}`" :section="section.key" />
  <BusinessSocial v-else-if="section?.key === 'social'" key="social" />
  <BusinessDiagnostics v-else-if="section?.key === 'diagnostics'" key="diagnostics" />
  <BusinessCarts v-else-if="section?.key === 'carts'" key="carts" />
  <BusinessGoogleSearch v-else-if="section?.key === 'google-search'" key="google-search" />
  <BusinessVehicleDemand v-else-if="section?.key === 'vehicle-demand'" key="vehicle-demand" />
  <BusinessCheckout v-else-if="section?.key === 'checkout'" key="checkout" />
  <BusinessOperations v-else-if="section?.key === 'operations'" key="operations" />
  <BusinessUsers v-else-if="section?.key === 'users'" key="users" />
  <BusinessMarketing v-else-if="section?.key === 'marketing'" key="marketing" />
  <BusinessFoundation v-else-if="section" :key="`foundation:${section.key}`" :section="section.key" />
</template>
