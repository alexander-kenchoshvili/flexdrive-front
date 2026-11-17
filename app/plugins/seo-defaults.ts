import type { Pinia } from "pinia";

export default defineNuxtPlugin(async (nuxtApp) => {
  const siteSettingsStore = useSiteSettings(nuxtApp.$pinia as Pinia);
  await siteSettingsStore.fetchSiteSettings();
  useSeoDefaults(siteSettingsStore);
});
