import { defineStore } from "pinia";
import { ref } from "vue";
import { apiFetch } from "~/composables/apiFetch";
import type { FooterPayload } from "~/types/footer";

export const useFooter = defineStore("footer", () => {
  const footer = ref<FooterPayload | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchFooter = async () => {
    if (footer.value) return;

    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await apiFetch<FooterPayload>(
        "/pages/footer/",
      );

      if (fetchError.value) {
        error.value = fetchError.value.message || "Failed to load footer";
        return;
      }

      footer.value = data.value || null;
    } catch {
      error.value = "კავშირის შეცდომა";
    } finally {
      loading.value = false;
    }
  };

  return {
    footer,
    loading,
    error,
    fetchFooter,
  };
});
