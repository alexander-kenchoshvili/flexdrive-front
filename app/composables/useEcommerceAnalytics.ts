export type EcommerceAnalyticsItemInput = {
  id?: number | string | null;
  slug?: string | null;
  name?: string | null;
  sku?: string | null;
  manufacturerPartNumber?: string | null;
  category?: string | null;
  brand?: string | null;
  price?: number | string | null;
  quantity?: number | string | null;
};

type EcommerceEventName =
  | "view_item"
  | "add_to_cart"
  | "add_to_wishlist"
  | "view_cart"
  | "remove_from_cart"
  | "begin_checkout"
  | "add_payment_info"
  | "purchase";

type DataLayerItem = Record<string, unknown>;

type AnalyticsWindow = Window & {
  dataLayer?: DataLayerItem[];
};

const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/;
const CURRENCY = "GEL";
const PURCHASE_STORAGE_KEY = "flexdrive_ga4_tracked_purchases";
const MAX_STORED_PURCHASES = 100;

const normalizeGtmId = (value: unknown) => {
  if (typeof value !== "string") return "";

  const normalizedValue = value.trim().toUpperCase();
  return GTM_ID_PATTERN.test(normalizedValue) ? normalizedValue : "";
};

const normalizeText = (value: string | number | null | undefined) =>
  String(value ?? "").trim();

const toNumber = (value: number | string | null | undefined) => {
  const normalizedValue = Number(value ?? 0);
  return Number.isFinite(normalizedValue) ? normalizedValue : 0;
};

const toMoney = (value: number) => Math.round(value * 100) / 100;

const readTrackedPurchases = () => {
  if (!import.meta.client) return [];

  try {
    const rawValue = window.localStorage.getItem(PURCHASE_STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];

    return Array.isArray(parsedValue)
      ? parsedValue.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
};

const hasTrackedPurchase = (transactionId: string) =>
  readTrackedPurchases().includes(transactionId);

const clearTrackedPurchases = () => {
  if (!import.meta.client) return;

  try {
    window.localStorage.removeItem(PURCHASE_STORAGE_KEY);
  } catch {
    // Analytics storage cleanup must not affect the storefront.
  }
};

const rememberTrackedPurchase = (transactionId: string) => {
  if (!import.meta.client) return;

  try {
    const nextPurchases = [
      transactionId,
      ...readTrackedPurchases().filter((item) => item !== transactionId),
    ].slice(0, MAX_STORED_PURCHASES);

    window.localStorage.setItem(
      PURCHASE_STORAGE_KEY,
      JSON.stringify(nextPurchases),
    );
  } catch {
    // Analytics must never block the checkout success page.
  }
};

const buildItemId = (item: EcommerceAnalyticsItemInput) =>
  normalizeText(item.sku) ||
  normalizeText(item.manufacturerPartNumber) ||
  normalizeText(item.id) ||
  normalizeText(item.slug);

const buildPurchaseEventId = (transactionId: string) =>
  `purchase-${transactionId}`;

const buildDataLayerItem = (
  item: EcommerceAnalyticsItemInput,
  quantity = item.quantity,
) => {
  const itemId = buildItemId(item);
  const itemName = normalizeText(item.name);

  if (!itemId || !itemName) {
    return null;
  }

  const price = toMoney(toNumber(item.price));
  const normalizedQuantity = Math.max(1, Math.floor(toNumber(quantity)) || 1);

  return {
    item_id: itemId,
    item_name: itemName,
    ...(normalizeText(item.brand)
      ? { item_brand: normalizeText(item.brand) }
      : {}),
    ...(normalizeText(item.category)
      ? { item_category: normalizeText(item.category) }
      : {}),
    ...(normalizeText(item.slug) ? { item_slug: normalizeText(item.slug) } : {}),
    price,
    quantity: normalizedQuantity,
  };
};

export const useEcommerceAnalytics = () => {
  const config = useRuntimeConfig();
  const gtmId = normalizeGtmId(config.public.gtmId);
  const { trackingConsentGranted } = useCookieConsent();
  const isEnabled = import.meta.client && Boolean(gtmId);

  if (import.meta.client) {
    watch(
      trackingConsentGranted,
      (isGranted) => {
        if (!isGranted) {
          clearTrackedPurchases();
        }
      },
      { immediate: true },
    );
  }

  const pushAnalyticsEvent = (
    event: string,
    eventParams: DataLayerItem = {},
  ) => {
    if (!isEnabled || !trackingConsentGranted.value) {
      return false;
    }

    const analyticsWindow = window as AnalyticsWindow;
    analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
    analyticsWindow.dataLayer.push({
      event,
      ...eventParams,
    });

    return true;
  };

  const pushEcommerceEvent = (
    event: EcommerceEventName,
    items: EcommerceAnalyticsItemInput[],
    extraEcommerceParams: DataLayerItem = {},
  ) => {
    if (!isEnabled || !trackingConsentGranted.value) {
      return false;
    }

    const dataLayerItems = items
      .map((item) => buildDataLayerItem(item))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    if (!dataLayerItems.length) {
      return false;
    }

    const analyticsWindow = window as AnalyticsWindow;
    analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];

    const value = toMoney(
      dataLayerItems.reduce(
        (sum, item) =>
          sum +
          toNumber(item.price as number) *
            Math.max(1, Number(item.quantity) || 1),
        0,
      ),
    );

    analyticsWindow.dataLayer.push({ ecommerce: null });
    analyticsWindow.dataLayer.push({
      event,
      ecommerce: {
        currency: CURRENCY,
        value,
        ...extraEcommerceParams,
        items: dataLayerItems,
      },
    });

    return true;
  };

  const trackViewItem = (item: EcommerceAnalyticsItemInput) => {
    pushEcommerceEvent("view_item", [{ ...item, quantity: 1 }]);
  };

  const trackAddToCart = (
    item: EcommerceAnalyticsItemInput,
    quantity: number,
  ) => {
    pushEcommerceEvent("add_to_cart", [{ ...item, quantity }]);
  };

  const trackAddToWishlist = (item: EcommerceAnalyticsItemInput) => {
    pushEcommerceEvent("add_to_wishlist", [{ ...item, quantity: 1 }]);
  };

  const trackViewCart = (items: EcommerceAnalyticsItemInput[]) => {
    pushEcommerceEvent("view_cart", items);
  };

  const trackRemoveFromCart = (item: EcommerceAnalyticsItemInput) => {
    pushEcommerceEvent("remove_from_cart", [item]);
  };

  const trackBeginCheckout = (items: EcommerceAnalyticsItemInput[]) => {
    pushEcommerceEvent("begin_checkout", items);
  };

  const trackAddPaymentInfo = (
    items: EcommerceAnalyticsItemInput[],
    paymentType: string,
  ) => {
    pushEcommerceEvent("add_payment_info", items, {
      payment_type: normalizeText(paymentType),
    });
  };

  const trackSearch = (searchTerm: string) => {
    const normalizedSearchTerm = normalizeText(searchTerm);
    if (!normalizedSearchTerm) return false;

    return pushAnalyticsEvent("search", {
      search_term: normalizedSearchTerm,
    });
  };

  const trackPurchase = ({
    transactionId,
    items,
    value,
    paymentType,
  }: {
    transactionId: string;
    items: EcommerceAnalyticsItemInput[];
    value: number | string;
    paymentType?: string | null;
  }) => {
    const normalizedTransactionId = normalizeText(transactionId);

    if (!isEnabled || !trackingConsentGranted.value) {
      return;
    }

    if (
      !normalizedTransactionId ||
      hasTrackedPurchase(normalizedTransactionId)
    ) {
      return;
    }

    const eventSent = pushEcommerceEvent("purchase", items, {
      event_id: buildPurchaseEventId(normalizedTransactionId),
      transaction_id: normalizedTransactionId,
      value: toMoney(toNumber(value)),
      ...(normalizeText(paymentType)
        ? { payment_type: normalizeText(paymentType) }
        : {}),
    });

    if (eventSent) {
      rememberTrackedPurchase(normalizedTransactionId);
    }
  };

  return {
    trackViewItem,
    trackAddToCart,
    trackAddToWishlist,
    trackViewCart,
    trackRemoveFromCart,
    trackBeginCheckout,
    trackAddPaymentInfo,
    trackSearch,
    trackPurchase,
  };
};
