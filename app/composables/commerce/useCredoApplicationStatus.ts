import type { Ref } from "vue";
import { useCommerceApi } from "~/composables/commerce/useCommerceApi";
import { isCredoToken } from "~/utils/credoCheckout";
import type { CommerceCredoApplication } from "~/types/commerce";

const settled = new Set(["ready_to_ship", "funding_completed", "rejected", "cancelled", "start_failed", "review"]);
export const useCredoApplicationStatus = (token: Ref<string>) => {
  const { getCredoApplicationStatus } = useCommerceApi();
  const application = ref<CommerceCredoApplication | null>(null);
  const pending = ref(false);
  const error = ref<string | null>(null);
  let mounted = false;
  let generation = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const refresh = async () => {
    if (!mounted || pending.value) return;
    clearTimeout(timer);
    if (!isCredoToken(token.value)) { error.value = "განაცხადის ბმული არასწორია."; return; }
    const readGeneration = generation;
    pending.value = true;
    try {
      const result = await getCredoApplicationStatus(token.value);
      if (!mounted || generation !== readGeneration) return;
      application.value = result;
      error.value = null;
    } catch {
      if (!mounted || generation !== readGeneration) return;
      error.value = "სტატუსის განახლება ვერ მოხერხდა. სცადეთ ხელახლა იმავე ბრაუზერით ან ანგარიშით.";
    } finally {
      if (mounted && generation === readGeneration) {
        pending.value = false;
        if (!application.value || !settled.has(application.value.stage)) {
          timer = setTimeout(() => {
            if (typeof document === "undefined" || !document.hidden) void refresh();
            else timer = setTimeout(() => void refresh(), 8000);
          }, 8000);
        }
      }
    }
  };
  const refreshOnReturn = () => {
    if (typeof document === "undefined" || !document.hidden) void refresh();
  };
  onMounted(() => {
    mounted = true;
    if (typeof window !== "undefined") window.addEventListener("focus", refreshOnReturn);
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", refreshOnReturn);
    void refresh();
  });
  watch(token, () => {
    generation++; clearTimeout(timer); pending.value = false;
    application.value = null; error.value = null; void refresh();
  });
  onUnmounted(() => {
    mounted = false; generation++; clearTimeout(timer);
    if (typeof window !== "undefined") window.removeEventListener("focus", refreshOnReturn);
    if (typeof document !== "undefined") document.removeEventListener("visibilitychange", refreshOnReturn);
  });
  return { application, pending, error, refresh };
};
