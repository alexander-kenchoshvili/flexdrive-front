type DataLayerItem = Record<string, unknown>;

type AnalyticsWindow = Window & {
  dataLayer?: DataLayerItem[];
  __flexdriveGtmId?: string;
};

const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/;

const normalizeGtmId = (value: unknown) => {
  if (typeof value !== "string") return "";

  const normalizedValue = value.trim().toUpperCase();
  return GTM_ID_PATTERN.test(normalizedValue) ? normalizedValue : "";
};

export default defineNuxtPlugin({
  name: "google-tag-manager",
  setup() {
    const config = useRuntimeConfig();
    const gtmId = normalizeGtmId(config.public.gtmId);

    if (!gtmId) {
      return;
    }

    const analyticsWindow = window as AnalyticsWindow;

    if (analyticsWindow.__flexdriveGtmId === gtmId) {
      return;
    }

    analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
    analyticsWindow.dataLayer.push({
      "gtm.start": Date.now(),
      event: "gtm.js",
    });
    analyticsWindow.__flexdriveGtmId = gtmId;

    useHead({
      script: [
        {
          key: "google-tag-manager",
          src: `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`,
          async: true,
        },
      ],
    });
  },
});
