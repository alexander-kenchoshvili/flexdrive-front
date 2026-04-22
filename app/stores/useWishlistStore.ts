import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useCommerceApi } from "~/composables/commerce/useCommerceApi";
import type { WishlistItem, WishlistResponse } from "~/types/commerce";

type WishlistLoadOptions = {
  headers?: Record<string, string>;
  force?: boolean;
};

const extractFirstErrorMessage = (payload: unknown): string | null => {
  if (!payload) return null;

  if (typeof payload === "string") {
    return payload;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const nestedMessage = extractFirstErrorMessage(item);
      if (nestedMessage) return nestedMessage;
    }
    return null;
  }

  if (typeof payload === "object") {
    for (const value of Object.values(payload as Record<string, unknown>)) {
      const nestedMessage = extractFirstErrorMessage(value);
      if (nestedMessage) return nestedMessage;
    }
  }

  return null;
};

const normalizeApiErrorMessage = (error: unknown, fallback: string) => {
  const normalizedError = error as
    | {
        data?: unknown;
        response?: {
          _data?: unknown;
          data?: unknown;
        };
        message?: string;
      }
    | undefined;

  return (
    extractFirstErrorMessage(normalizedError?.data) ||
    extractFirstErrorMessage(normalizedError?.response?._data) ||
    extractFirstErrorMessage(normalizedError?.response?.data) ||
    normalizedError?.message ||
    fallback
  );
};

export const useWishlistStore = defineStore("wishlist", () => {
  const wishlist = ref<WishlistResponse | null>(null);
  const loading = ref(false);
  const mutating = ref(false);
  const initialized = ref(false);
  const error = ref<string | null>(null);
  const pendingProductIds = ref<number[]>([]);

  const { getWishlist, addWishlistItem, deleteWishlistItem } = useCommerceApi();

  let pendingRequest: Promise<WishlistResponse | null> | null = null;

  const items = computed<WishlistItem[]>(() => wishlist.value?.results || []);
  const count = computed(() => wishlist.value?.count || 0);
  const productIds = computed(() => items.value.map((item) => item.product_id));

  const applyWishlist = (nextWishlist: WishlistResponse) => {
    wishlist.value = nextWishlist;
    initialized.value = true;
    error.value = null;
    return nextWishlist;
  };

  const isMutatingProduct = (productId: number) =>
    pendingProductIds.value.includes(productId);

  const markProductPending = (productId: number) => {
    if (!pendingProductIds.value.includes(productId)) {
      pendingProductIds.value = [...pendingProductIds.value, productId];
    }
  };

  const clearProductPending = (productId: number) => {
    pendingProductIds.value = pendingProductIds.value.filter((id) => id !== productId);
  };

  const waitForPendingRequest = async () => {
    if (!pendingRequest) return;

    try {
      await pendingRequest;
    } catch {
      // Ignore previous load errors before the next mutation.
    }
  };

  const executeLoad = async (options: WishlistLoadOptions = {}) => {
    loading.value = true;
    error.value = null;

    try {
      const nextWishlist = await getWishlist({ headers: options.headers });
      return applyWishlist(nextWishlist);
    } catch (loadError) {
      error.value = normalizeApiErrorMessage(
        loadError,
        "სასურველების ჩატვირთვა ვერ მოხერხდა.",
      );
      throw loadError;
    } finally {
      loading.value = false;
      pendingRequest = null;
    }
  };

  const runMutation = async (
    productId: number,
    mutation: () => Promise<WishlistResponse>,
    fallbackMessage: string,
  ) => {
    await waitForPendingRequest();
    mutating.value = true;
    markProductPending(productId);
    error.value = null;

    try {
      const nextWishlist = await mutation();
      return applyWishlist(nextWishlist);
    } catch (mutationError) {
      error.value = normalizeApiErrorMessage(mutationError, fallbackMessage);
      throw mutationError;
    } finally {
      clearProductPending(productId);
      mutating.value = pendingProductIds.value.length > 0;
    }
  };

  const ensureWishlistLoaded = async (options: WishlistLoadOptions = {}) => {
    if (initialized.value && !options.force) {
      return wishlist.value;
    }

    if (pendingRequest) {
      return pendingRequest;
    }

    pendingRequest = executeLoad(options);
    return pendingRequest;
  };

  const refreshWishlist = async (options: WishlistLoadOptions = {}) => {
    if (pendingRequest) {
      return pendingRequest;
    }

    pendingRequest = executeLoad(options);
    return pendingRequest;
  };

  const addItem = async (productId: number) =>
    runMutation(
      productId,
      () => addWishlistItem(productId),
      "პროდუქტის სასურველებში შენახვა ვერ მოხერხდა.",
    );

  const removeItem = async (productId: number) =>
    runMutation(
      productId,
      () => deleteWishlistItem(productId),
      "პროდუქტის სასურველებიდან წაშლა ვერ მოხერხდა.",
    );

  const hasProduct = (productId: number) => productIds.value.includes(productId);

  const toggleItem = async (productId: number) => {
    if (!initialized.value) {
      await ensureWishlistLoaded();
    }

    if (hasProduct(productId)) {
      return removeItem(productId);
    }

    return addItem(productId);
  };

  const reset = () => {
    wishlist.value = null;
    loading.value = false;
    mutating.value = false;
    initialized.value = false;
    error.value = null;
    pendingProductIds.value = [];
    pendingRequest = null;
  };

  return {
    wishlist,
    loading,
    mutating,
    initialized,
    error,
    items,
    count,
    productIds,
    ensureWishlistLoaded,
    refreshWishlist,
    addItem,
    removeItem,
    toggleItem,
    hasProduct,
    isMutatingProduct,
    reset,
  };
});
