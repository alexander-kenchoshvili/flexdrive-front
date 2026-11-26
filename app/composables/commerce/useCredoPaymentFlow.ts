import { useCommerceApi } from "~/composables/commerce/useCommerceApi";
import { credoApplicationPath, readCredoApplication, storeCredoApplication } from "~/utils/credoCheckout";
import type { CommerceCredoApplication, CommerceCredoAvailability } from "~/types/commerce";

export const useCredoPaymentFlow = (source: "cart" | "buy_now") => {
  const store = useGlobalStore();
  const { getCredoAvailability } = useCommerceApi();
  const availability = useAsyncData<CommerceCredoAvailability>(
    "commerce-credo-availability", () => getCredoAvailability(), {
      server: false, dedupe: "defer",
      default: (): CommerceCredoAvailability => ({ enabled: false, provider: "credo", currency: "GEL", offers: [], redirect_checkout: true }),
    },
  );
  const owner = computed(() => String(store.currentUser?.id ?? "guest"));
  const activeToken = ref<string | null>(null);
  const restore = () => { activeToken.value = readCredoApplication(source, owner.value); };
  onMounted(restore);
  watch(owner, () => { if (import.meta.client) restore(); });
  const openCredoApplication = async (application: CommerceCredoApplication, continueToBank = false) => {
    storeCredoApplication(source, owner.value, application.application_token);
    activeToken.value = application.application_token;
    await navigateTo({
      path: credoApplicationPath(application.application_token),
      query: continueToBank && application.redirect_url ? { continue: "1" } : {},
    });
  };
  return {
    credoPaymentEnabled: computed(() => availability.data.value?.enabled === true),
    credoPaymentLoading: availability.pending,
    activeCredoApplicationPath: computed(() => activeToken.value ? credoApplicationPath(activeToken.value) : null),
    openCredoApplication,
  };
};
