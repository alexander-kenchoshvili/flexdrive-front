import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useCommerceApi } from "~/composables/commerce/useCommerceApi";
import type { CommerceCart, CommerceCheckoutCartIssue } from "~/types/commerce";

type CartLoadOptions = {
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
    const normalizedPayload = payload as Record<string, unknown>;
    const priorityKeys = [
      "detail",
      "quantity",
      "product_id",
      "payment_method",
      "non_field_errors",
      "message",
    ];
    const keys = [...priorityKeys, ...Object.keys(normalizedPayload)];
    const seen = new Set<string>();

    for (const key of keys) {
      if (seen.has(key) || !(key in normalizedPayload)) continue;
      seen.add(key);

      const nestedMessage = extractFirstErrorMessage(normalizedPayload[key]);
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

export const useCartStore = defineStore("cart", () => {
  const cart = ref<CommerceCart | null>(null);
  const loading = ref(false);
  const mutating = ref(false);
  const initialized = ref(false);
  const error = ref<string | null>(null);
  const availabilityAttention = ref<CommerceCheckoutCartIssue[]>([]);

  const { getCart, addCartItem, confirmCartPrices, updateCartItem, deleteCartItem } =
    useCommerceApi();

  let pendingRequest: Promise<CommerceCart | null> | null = null;

  const items = computed(() => cart.value?.items || []);
  const itemCount = computed(() => cart.value?.item_count || 0);
  const lineItemCount = computed(() => items.value.length);
  const subtotal = computed(() => cart.value?.subtotal || "0.00");
  const total = computed(() => cart.value?.total || "0.00");
  const hasPriceChanges = computed(() => Boolean(cart.value?.has_price_changes));
  const priceChangeCount = computed(() => cart.value?.price_change_count || 0);
  const priceChangeMessage = computed(() => cart.value?.price_change_message || null);
  const hasAvailabilityAttention = computed(
    () => availabilityAttention.value.length > 0,
  );
  const firstAvailabilityAttentionItemId = computed(
    () => availabilityAttention.value[0]?.cart_item_id || null,
  );
  const priceConfirmationLabel = computed(() =>
    priceChangeCount.value === 1
      ? "განახლებული ფასის დადასტურება"
      : "განახლებული ფასების დადასტურება",
  );
  const isEmpty = computed(() => initialized.value && items.value.length === 0);

  const clearAvailabilityAttention = () => {
    availabilityAttention.value = [];
  };

  const setAvailabilityAttention = (issues: CommerceCheckoutCartIssue[]) => {
    const dedupedIssues = new Map<number, CommerceCheckoutCartIssue>();

    for (const issue of issues) {
      dedupedIssues.set(issue.cart_item_id, issue);
    }

    availabilityAttention.value = [...dedupedIssues.values()];
  };

  const getAvailabilityAttention = (itemId: number) =>
    availabilityAttention.value.find((issue) => issue.cart_item_id === itemId) || null;

  const applyCart = (nextCart: CommerceCart) => {
    cart.value = nextCart;
    initialized.value = true;
    error.value = null;
    if (availabilityAttention.value.length) {
      const cartItemIds = new Set(nextCart.items.map((item) => item.id));
      availabilityAttention.value = availabilityAttention.value.filter((issue) =>
        cartItemIds.has(issue.cart_item_id),
      );
    }
    return nextCart;
  };

  const waitForPendingRequest = async () => {
    if (!pendingRequest) return;

    try {
      await pendingRequest;
    } catch {
      // Ignore previous load errors before running the next mutation.
    }
  };

  const executeLoad = async (options: CartLoadOptions = {}) => {
    loading.value = true;
    error.value = null;

    try {
      const nextCart = await getCart({ headers: options.headers });
      return applyCart(nextCart);
    } catch (loadError) {
      error.value = normalizeApiErrorMessage(
        loadError,
        "კალათის ჩატვირთვა ვერ მოხერხდა.",
      );
      throw loadError;
    } finally {
      loading.value = false;
      pendingRequest = null;
    }
  };

  const runMutation = async (
    mutation: () => Promise<CommerceCart>,
    fallbackMessage: string,
  ) => {
    await waitForPendingRequest();
    mutating.value = true;
    error.value = null;

    try {
      const nextCart = await mutation();
      return applyCart(nextCart);
    } catch (mutationError) {
      error.value = normalizeApiErrorMessage(mutationError, fallbackMessage);
      throw mutationError;
    } finally {
      mutating.value = false;
    }
  };

  const findItem = (itemId: number) =>
    items.value.find((item) => item.id === itemId) || null;

  const ensureCartLoaded = async (options: CartLoadOptions = {}) => {
    if (initialized.value && !options.force) {
      return cart.value;
    }

    if (pendingRequest) {
      return pendingRequest;
    }

    pendingRequest = executeLoad(options);
    return pendingRequest;
  };

  const refreshCart = async (options: CartLoadOptions = {}) => {
    if (pendingRequest) {
      return pendingRequest;
    }

    pendingRequest = executeLoad(options);
    return pendingRequest;
  };

  const addItem = async (productId: number, quantity = 1) => {
    const normalizedQuantity = Math.max(1, Math.floor(quantity) || 1);
    return runMutation(
      () => addCartItem({ product_id: productId, quantity: normalizedQuantity }),
      "პროდუქტის კალათაში დამატება ვერ მოხერხდა.",
    );
  };

  const confirmPrices = async () => {
    return runMutation(
      () => confirmCartPrices(),
      "ფასების განახლების დადასტურება ვერ მოხერხდა.",
    );
  };

  const setQuantity = async (itemId: number, quantity: number) => {
    const normalizedQuantity = Math.max(1, Math.floor(quantity) || 1);
    return runMutation(
      () => updateCartItem(itemId, { quantity: normalizedQuantity }),
      "რაოდენობის განახლება ვერ მოხერხდა.",
    );
  };

  const increment = async (itemId: number) => {
    const item = findItem(itemId);
    if (!item) return cart.value;

    if (item.quantity >= item.stock_qty) {
      error.value = "არჩეული რაოდენობა აჭარბებს მიმდინარე მარაგს.";
      return cart.value;
    }

    return setQuantity(itemId, item.quantity + 1);
  };

  const decrement = async (itemId: number) => {
    const item = findItem(itemId);
    if (!item) return cart.value;

    if (item.quantity <= 1) {
      return removeItem(itemId);
    }

    return setQuantity(itemId, item.quantity - 1);
  };

  const removeItem = async (itemId: number) => {
    return runMutation(
      () => deleteCartItem(itemId),
      "პროდუქტის წაშლა ვერ მოხერხდა.",
    );
  };

  const reset = () => {
    cart.value = null;
    loading.value = false;
    mutating.value = false;
    initialized.value = false;
    error.value = null;
    pendingRequest = null;
    clearAvailabilityAttention();
  };

  return {
    cart,
    loading,
    mutating,
    initialized,
    error,
    items,
    itemCount,
    lineItemCount,
    subtotal,
    total,
    hasPriceChanges,
    priceChangeCount,
    priceChangeMessage,
    availabilityAttention,
    hasAvailabilityAttention,
    firstAvailabilityAttentionItemId,
    priceConfirmationLabel,
    isEmpty,
    getAvailabilityAttention,
    setAvailabilityAttention,
    clearAvailabilityAttention,
    ensureCartLoaded,
    refreshCart,
    addItem,
    confirmPrices,
    setQuantity,
    increment,
    decrement,
    removeItem,
    reset,
  };
});
