import type { Ref } from "vue";
import { isProductionTrackingHost } from "~/utils/trackingHost";

type Stage = "opened" | "quoted" | "quote_error" | "submitted" | "form_invalid"
  | "price_changed" | "stock_changed" | "submit_unconfirmed";
type Quote = { quote_token: string; service_slug?: string; customer_delivery_price: string };

export const useCheckoutProgress = (
  source: "cart" | "buy_now",
  ready: Readonly<Ref<boolean>>,
  basket: Readonly<Ref<string>>,
  quote: Readonly<Ref<Quote | null | undefined>>,
  quoteError: Readonly<Ref<string | null | undefined>>,
) => {
  const { analyticsConsentGranted } = useCookieConsent();
  const { user } = useBusinessAuth();
  const fetchApi = $fetch.create({
    baseURL: useApiBaseUrl(), credentials: "include", cache: "no-store", retry: 0,
    timeout: 3500, onResponseError() {},
  });
  const sent = new Map<string, number>();
  let pending = Promise.resolve();

  const allowed = () => {
    if (!import.meta.client || !analyticsConsentGranted.value || user.value ||
        !isProductionTrackingHost(window.location.hostname)) return false;
    try { return localStorage.getItem("flexdrive-internal-traffic") !== "1"; }
    catch { return true; }
  };
  const csrfToken = () => document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/)?.[1] || "";

  // Observations are optional and never awaited by checkout or bank navigation.
  const record = (stage: Stage, currentQuote?: Quote) => {
    if (!ready.value || !basket.value || !allowed()) return;
    const expectedBasket = basket.value;
    const key = JSON.stringify([expectedBasket, stage, currentQuote?.service_slug, currentQuote?.customer_delivery_price]);
    const now = Date.now();
    if (now - (sent.get(key) || 0) < 60_000) return;
    if (sent.size >= 60) sent.clear();
    sent.set(key, now);
    pending = pending.then(async () => {
      if (!allowed() || (basket.value && basket.value !== expectedBasket)) return;
      if (!csrfToken()) await fetchApi("/accounts/session/");
      if (!allowed() || (basket.value && basket.value !== expectedBasket)) return;
      await fetchApi("/business/checkout-progress/", {
        method: "POST",
        keepalive: true,
        headers: { "X-CSRFToken": csrfToken() },
        body: {
          source, stage, analytics_consent: true,
          ...(currentQuote ? { quote_token: currentQuote.quote_token } : {}),
        },
      });
    }).catch(() => { sent.delete(key); });
  };

  watch([ready, basket, analyticsConsentGranted], ([active, _, consent]) => {
    if (active && consent) record("opened");
  }, { immediate: true });
  watch([ready, basket, quote, quoteError, analyticsConsentGranted], ([active, _, value, error, consent]) => {
    if (!active || !consent) return;
    if (value?.quote_token) record("quoted", value);
    else if (error) record("quote_error");
  }, { immediate: true });
  return { record };
};
