type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  __flexdriveGtmId?: string;
};

const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/;
type ConsentValue = "granted" | "denied";

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

    const {
      preferencesConsentGranted,
      functionalityConsentGranted,
      trackingConsentGranted,
    } = useCookieConsent();
    const gtmScriptEnabled = ref(analyticsWindow.__flexdriveGtmId === gtmId);

    const ensureDataLayer = () => {
      analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
      analyticsWindow.gtag =
        analyticsWindow.gtag ||
        ((...args: unknown[]) => {
          analyticsWindow.dataLayer?.push(args);
        });
    };

    const resolveConsentValue = (isGranted: boolean): ConsentValue =>
      isGranted ? "granted" : "denied";

    const consentState = computed<Record<string, ConsentValue>>(() => {
      const trackingConsent = resolveConsentValue(trackingConsentGranted.value);

      return {
        ad_storage: trackingConsent,
        analytics_storage: trackingConsent,
        ad_user_data: trackingConsent,
        ad_personalization: trackingConsent,
        functionality_storage: resolveConsentValue(
          functionalityConsentGranted.value,
        ),
        personalization_storage: resolveConsentValue(
          preferencesConsentGranted.value,
        ),
        security_storage: "granted",
      };
    });

    const applyGoogleConsent = (command: "default" | "update") => {
      ensureDataLayer();
      analyticsWindow.gtag?.("consent", command, consentState.value);
    };

    useHead(() => ({
      script: gtmScriptEnabled.value
        ? [
            {
              key: "google-tag-manager",
              src: `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`,
              async: true,
            },
          ]
        : [],
    }));

    const loadGtm = () => {
      ensureDataLayer();

      if (analyticsWindow.__flexdriveGtmId === gtmId) {
        gtmScriptEnabled.value = true;
        return;
      }

      analyticsWindow.dataLayer.push({
        "gtm.start": Date.now(),
        event: "gtm.js",
      });
      analyticsWindow.__flexdriveGtmId = gtmId;
      gtmScriptEnabled.value = true;
    };

    applyGoogleConsent("default");

    if (trackingConsentGranted.value) {
      loadGtm();
    }

    watch(
      consentState,
      () => {
        applyGoogleConsent("update");

        if (trackingConsentGranted.value) {
          loadGtm();
        }
      },
    );
  },
});
