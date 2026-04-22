import { defineStore } from "pinia";
import { ref } from "vue";
import { apiFetch } from "~/composables/apiFetch";

export interface MenuItem {
  id: number;
  name: string;
  slug: string;
  url: string | null;
  final_url: string;
  parent: number | null;
  order: number;
  show_in_menu: boolean;
}

export const useMenu = defineStore("menu", () => {
  const menu = ref<MenuItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchMenu = async () => {
    // თუ მენიუ უკვე გვაქვს, აღარ მოვითხოვოთ ხელახლა
    if (menu.value.length > 0) return;

    loading.value = true;
    error.value = null;

    try {
      // ვიყენებთ apiFetch-ს
      const { data, error: fetchError } = await apiFetch<MenuItem[]>(
        "/pages/menu/"
      );

      if (fetchError.value) {
        // აქ აღარ ვიყენებთ throw-ს! უბრალოდ ვწერთ ერორს სტრინგად
        error.value = fetchError.value.message || "Unauthorized";
        console.warn("Menu fetch status:", fetchError.value.statusCode);
        return;
      }

      menu.value = data.value || [];
    } catch (err: any) {
      // Nuxt 4-ისთვის უსაფრთხო ერორ ჰენდლინგი
      error.value = "კავშირის შეცდომა";
    } finally {
      loading.value = false;
    }
  };

  // ეს ფუნქცია აუცილებელია globalStore-ისთვის!
  function findMenuBySlug(slug: string) {
    return menu.value.find((item) => item.slug === slug) || null;
  }

  return {
    menu,
    loading,
    error,
    fetchMenu,
    findMenuBySlug,
  };
});
