import { extractApiErrorPayload } from "~/composables/commerce/errorUtils";
import { useCommerceApi } from "~/composables/commerce/useCommerceApi";
import type {
  CommerceCardPayment,
  CommerceCardPaymentAvailability,
  CommerceCardPaymentErrorPayload,
} from "~/types/commerce";

export type CardPaymentCheckoutSource = "cart" | "buy_now";

export type CardPaymentReturnContext = {
  source: CardPaymentCheckoutSource;
  returnTo: string;
  createdAt: string;
};

const PAYMENT_CONTEXT_PREFIX = "flexdrive_card_payment_context:";

const disabledAvailability = (): CommerceCardPaymentAvailability => ({
  enabled: false,
  payment_method: "card",
  provider: "bog",
  currency: "GEL",
  capture: "automatic",
  redirect_checkout: true,
});

const sanitizeLocalPath = (value: string | null | undefined, fallback: string) => {
  const normalized = String(value || "").trim();
  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return fallback;
  }
  return normalized;
};

export const useCardPaymentFlow = () => {
  const { getCardPaymentAvailability } = useCommerceApi();

  const availabilityState = useAsyncData<CommerceCardPaymentAvailability>(
    "commerce-card-payment-availability",
    () => getCardPaymentAvailability(),
    {
      default: disabledAvailability,
      dedupe: "defer",
    },
  );

  const cardPaymentEnabled = computed(
    () => Boolean(availabilityState.data.value?.enabled),
  );

  const storeReturnContext = (
    paymentToken: string,
    context: Omit<CardPaymentReturnContext, "createdAt">,
  ) => {
    if (!import.meta.client || !paymentToken) return;

    const fallback =
      context.source === "buy_now" ? "/buy-now/checkout" : "/checkout";
    const payload: CardPaymentReturnContext = {
      source: context.source,
      returnTo: sanitizeLocalPath(context.returnTo, fallback),
      createdAt: new Date().toISOString(),
    };

    try {
      window.sessionStorage.setItem(
        `${PAYMENT_CONTEXT_PREFIX}${paymentToken}`,
        JSON.stringify(payload),
      );
    } catch {
      // Recovery context is helpful but must never block provider redirect.
    }
  };

  const readReturnContext = (
    paymentToken: string,
  ): CardPaymentReturnContext | null => {
    if (!import.meta.client || !paymentToken) return null;

    try {
      const rawValue = window.sessionStorage.getItem(
        `${PAYMENT_CONTEXT_PREFIX}${paymentToken}`,
      );
      if (!rawValue) return null;

      const parsed = JSON.parse(rawValue) as Partial<CardPaymentReturnContext>;
      if (parsed.source !== "cart" && parsed.source !== "buy_now") {
        return null;
      }

      const fallback =
        parsed.source === "buy_now" ? "/buy-now/checkout" : "/checkout";
      return {
        source: parsed.source,
        returnTo: sanitizeLocalPath(parsed.returnTo, fallback),
        createdAt: String(parsed.createdAt || ""),
      };
    } catch {
      return null;
    }
  };

  const clearReturnContext = (paymentToken: string) => {
    if (!import.meta.client || !paymentToken) return;

    try {
      window.sessionStorage.removeItem(
        `${PAYMENT_CONTEXT_PREFIX}${paymentToken}`,
      );
    } catch {
      // Session cleanup must never affect the payment result screen.
    }
  };

  const extractPaymentError = (
    error: unknown,
  ): CommerceCardPaymentErrorPayload | null => {
    const payload = extractApiErrorPayload(error);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return null;
    }
    return payload as CommerceCardPaymentErrorPayload;
  };

  const redirectToProvider = (payment: CommerceCardPayment) => {
    if (!import.meta.client || !payment.redirect_url) {
      throw new Error("BOG redirect URL is unavailable.");
    }

    const redirectUrl = new URL(payment.redirect_url);
    if (redirectUrl.protocol !== "https:") {
      throw new Error("BOG redirect URL must use HTTPS.");
    }

    window.location.assign(redirectUrl.toString());
  };

  return {
    availability: availabilityState.data,
    availabilityPending: availabilityState.pending,
    availabilityError: availabilityState.error,
    refreshAvailability: availabilityState.refresh,
    cardPaymentEnabled,
    storeReturnContext,
    readReturnContext,
    clearReturnContext,
    extractPaymentError,
    redirectToProvider,
  };
};
