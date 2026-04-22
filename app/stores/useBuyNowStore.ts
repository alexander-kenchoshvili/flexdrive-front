import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useCommerceApi } from "~/composables/commerce/useCommerceApi";
import {
  extractApiErrorPayload,
  normalizeApiErrorMessage,
} from "~/composables/commerce/errorUtils";
import type {
  CommerceBuyNowErrorCode,
  CommerceBuyNowIssue,
  CommerceBuyNowRecommendedAction,
  CommerceBuyNowSession,
  CommerceCheckoutSummaryItem,
} from "~/types/commerce";

type BuyNowLoadOptions = {
  headers?: Record<string, string>;
  force?: boolean;
};

type BuyNowStatePayload = {
  detail?: string;
  code?: CommerceBuyNowErrorCode;
  recommended_action?: CommerceBuyNowRecommendedAction;
  buy_now_issues?: unknown;
};

const BUY_NOW_INACTIVE_CODES: CommerceBuyNowErrorCode[] = [
  "buy_now_session_not_found",
  "buy_now_session_expired",
];

const extractBuyNowStatePayload = (error: unknown): BuyNowStatePayload | null => {
  const payload = extractApiErrorPayload(error);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  return payload as BuyNowStatePayload;
};

const mapCreateTimeBuyNowMessage = (error: unknown) => {
  const payload = extractApiErrorPayload(error);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return normalizeApiErrorMessage(
      error,
      "სწრაფი ყიდვის დაწყება ვერ მოხერხდა. გთხოვ, სცადო ხელახლა.",
    );
  }

  const normalizedPayload = payload as Record<string, unknown>;

  if ("product_id" in normalizedPayload) {
    return "პროდუქტი აღარ არის ხელმისაწვდომი. გადაამოწმე გვერდი და სცადე თავიდან.";
  }

  if ("quantity" in normalizedPayload) {
    return "არჩეული რაოდენობა აღემატება ხელმისაწვდომ მარაგს. შეასწორე რაოდენობა და სცადე თავიდან.";
  }

  return normalizeApiErrorMessage(
    error,
    "სწრაფი ყიდვის დაწყება ვერ მოხერხდა. გთხოვ, სცადო ხელახლა.",
  );
};

export const useBuyNowStore = defineStore("buy-now", () => {
  const session = ref<CommerceBuyNowSession | null>(null);
  const loading = ref(false);
  const mutating = ref(false);
  const initialized = ref(false);
  const error = ref<string | null>(null);
  const errorCode = ref<CommerceBuyNowErrorCode | null>(null);
  const recommendedAction = ref<CommerceBuyNowRecommendedAction | null>(null);
  const returnToProduct = ref<string | null>(null);

  const {
    createBuyNowSession,
    getBuyNowSession,
    deleteBuyNowSession,
    confirmBuyNowSession,
  } = useCommerceApi();

  let pendingRequest: Promise<CommerceBuyNowSession | null> | null = null;

  const summaryItems = computed<CommerceCheckoutSummaryItem[]>(() => {
    if (!session.value) return [];

    return [
      {
        id: `buy-now-${session.value.id}`,
        product_id: session.value.product_id,
        slug: session.value.slug,
        name: session.value.name,
        sku: session.value.sku,
        price: session.value.price,
        price_snapshot: session.value.price_snapshot,
        quantity: session.value.quantity,
        line_total: session.value.line_total,
        price_changed: session.value.price_changed,
        price_change_direction: session.value.price_change_direction,
        primary_image: session.value.primary_image,
      },
    ];
  });

  const itemCount = computed(() => (session.value ? 1 : 0));
  const total = computed(() => session.value?.total || "0.00");
  const subtotal = computed(() => session.value?.subtotal || "0.00");
  const issues = computed<CommerceBuyNowIssue[]>(() => session.value?.issues || []);
  const hasSession = computed(() => Boolean(session.value));
  const requiresConfirmation = computed(
    () => Boolean(session.value?.requires_confirmation),
  );
  const isCheckoutAvailable = computed(
    () => Boolean(session.value?.is_checkout_available),
  );
  const hasBlockingIssues = computed(() =>
    issues.value.some((issue) =>
      ["out_of_stock", "unavailable"].includes(issue.issue_type),
    ),
  );
  const confirmationLabel = computed(
    () => "განახლებული მონაცემების დადასტურება",
  );
  const resolvedReturnToProduct = computed(() => {
    if (returnToProduct.value) {
      return returnToProduct.value;
    }

    if (session.value?.slug) {
      return `/catalog/${session.value.slug}`;
    }

    return "/catalog";
  });
  const hasInactiveState = computed(
    () => errorCode.value !== null && BUY_NOW_INACTIVE_CODES.includes(errorCode.value),
  );

  const clearErrorState = () => {
    error.value = null;
    errorCode.value = null;
    recommendedAction.value = null;
  };

  const setReturnToProduct = (path: string | null | undefined) => {
    if (!path) return;
    returnToProduct.value = path;
  };

  const applySession = (nextSession: CommerceBuyNowSession) => {
    session.value = nextSession;
    initialized.value = true;
    clearErrorState();
    return nextSession;
  };

  const applyStateError = (
    errorPayload: BuyNowStatePayload | null,
    fallback: string,
  ) => {
    session.value = null;
    initialized.value = true;
    error.value = errorPayload?.detail || fallback;
    errorCode.value = errorPayload?.code || null;
    recommendedAction.value = errorPayload?.recommended_action || null;
  };

  const waitForPendingRequest = async () => {
    if (!pendingRequest) return;

    try {
      await pendingRequest;
    } catch {
      // Ignore previous load errors before running the next mutation.
    }
  };

  const executeLoad = async (options: BuyNowLoadOptions = {}) => {
    loading.value = true;
    clearErrorState();

    try {
      const nextSession = await getBuyNowSession({ headers: options.headers });
      return applySession(nextSession);
    } catch (loadError) {
      const statePayload = extractBuyNowStatePayload(loadError);

      if (statePayload?.code && BUY_NOW_INACTIVE_CODES.includes(statePayload.code)) {
        applyStateError(
          statePayload,
          "სწრაფი ყიდვის სესია აღარ არის აქტიური. დაბრუნდი პროდუქტის გვერდზე და დაიწყე თავიდან.",
        );
      } else {
        error.value = normalizeApiErrorMessage(
          loadError,
          "სწრაფი ყიდვის სესიის ჩატვირთვა ვერ მოხერხდა.",
        );
        initialized.value = true;
      }

      throw loadError;
    } finally {
      loading.value = false;
      pendingRequest = null;
    }
  };

  const runMutation = async <T>(
    mutation: () => Promise<T>,
    fallbackMessage: string,
    onSuccess?: (value: T) => T,
  ) => {
    await waitForPendingRequest();
    mutating.value = true;
    clearErrorState();

    try {
      const result = await mutation();
      return onSuccess ? onSuccess(result) : result;
    } catch (mutationError) {
      const statePayload = extractBuyNowStatePayload(mutationError);
      if (statePayload?.code && BUY_NOW_INACTIVE_CODES.includes(statePayload.code)) {
        applyStateError(
          statePayload,
          "სწრაფი ყიდვის სესია აღარ არის აქტიური. დაბრუნდი პროდუქტის გვერდზე და დაიწყე თავიდან.",
        );
      } else {
        error.value = normalizeApiErrorMessage(mutationError, fallbackMessage);
      }
      throw mutationError;
    } finally {
      mutating.value = false;
    }
  };

  const ensureSessionLoaded = async (options: BuyNowLoadOptions = {}) => {
    if (initialized.value && !options.force) {
      return session.value;
    }

    if (pendingRequest) {
      return pendingRequest;
    }

    pendingRequest = executeLoad(options);
    return pendingRequest;
  };

  const refreshSession = async (options: BuyNowLoadOptions = {}) => {
    if (pendingRequest) {
      return pendingRequest;
    }

    pendingRequest = executeLoad(options);
    return pendingRequest;
  };

  const start = async (
    productId: number,
    quantity: number,
    options?: { returnToProduct?: string | null },
  ) => {
    const normalizedQuantity = Math.max(1, Math.floor(quantity) || 1);
    setReturnToProduct(options?.returnToProduct);

    try {
      return await runMutation(
        () =>
          createBuyNowSession({
            product_id: productId,
            quantity: normalizedQuantity,
          }),
        "სწრაფი ყიდვის დაწყება ვერ მოხერხდა. გთხოვ, სცადო ხელახლა.",
        applySession,
      );
    } catch (caughtError) {
      if (!extractBuyNowStatePayload(caughtError)?.code) {
        error.value = mapCreateTimeBuyNowMessage(caughtError);
      }
      throw caughtError;
    }
  };

  const confirmSession = async () => {
    return runMutation(
      () => confirmBuyNowSession(),
      "განახლებული მონაცემების დადასტურება ვერ მოხერხდა.",
      applySession,
    );
  };

  const removeSession = async () => {
    await runMutation(
      () => deleteBuyNowSession(),
      "სწრაფი ყიდვის სესიის გაუქმება ვერ მოხერხდა.",
    );

    session.value = null;
    initialized.value = true;
    clearErrorState();
  };

  const clear = () => {
    session.value = null;
    loading.value = false;
    mutating.value = false;
    initialized.value = false;
    error.value = null;
    errorCode.value = null;
    recommendedAction.value = null;
    returnToProduct.value = null;
    pendingRequest = null;
  };

  return {
    session,
    loading,
    mutating,
    initialized,
    error,
    errorCode,
    recommendedAction,
    returnToProduct,
    summaryItems,
    itemCount,
    total,
    subtotal,
    issues,
    hasSession,
    requiresConfirmation,
    isCheckoutAvailable,
    hasBlockingIssues,
    confirmationLabel,
    resolvedReturnToProduct,
    hasInactiveState,
    clearErrorState,
    setReturnToProduct,
    ensureSessionLoaded,
    refreshSession,
    start,
    confirmSession,
    removeSession,
    clear,
  };
});
