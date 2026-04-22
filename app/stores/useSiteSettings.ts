import { defineStore } from "pinia";
import { ref } from "vue";
import { apiFetchRaw } from "~/composables/apiFetch";
import type { SiteSettingsPayload } from "~/types/siteSettings";

export const useSiteSettings = defineStore("site-settings", () => {
  const settings = ref<SiteSettingsPayload | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchSiteSettings = async () => {
    if (settings.value || loading.value) return settings.value;

    loading.value = true;
    error.value = null;

    try {
      settings.value = await apiFetchRaw<SiteSettingsPayload>(
        "/pages/site-settings/",
      );
    } catch (fetchError: unknown) {
      error.value =
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load site settings";
    } finally {
      loading.value = false;
    }

    return settings.value;
  };

  return {
    settings,
    loading,
    error,
    fetchSiteSettings,
  };
});
