export default defineNuxtPlugin(async () => {
  const siteSettingsStore = useSiteSettings();
  await siteSettingsStore.fetchSiteSettings();
  useSeoDefaults();
});
