import { isBusinessPath } from "~/utils/businessRouting";
import { isProductionTrackingHost } from "~/utils/trackingHost";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: (command: "consent", action: "grant" | "revoke") => void;
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
    if (isBusinessPath(window.location.pathname)) return;
    if (!isProductionTrackingHost(window.location.hostname)) return;
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
        (function gtag() {
          // Google recognises gtag commands as Arguments, not ordinary arrays.
          // eslint-disable-next-line prefer-rest-params
          analyticsWindow.dataLayer?.push(arguments);
        });
      return analyticsWindow.dataLayer;
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

    const applyMetaConsent = () => {
      // Google's Consent Mode does not revoke an already loaded Meta Pixel.
      analyticsWindow.fbq?.(
        "consent",
        trackingConsentGranted.value ? "grant" : "revoke",
      );
    };

    useHead(() => ({
      script: gtmScriptEnabled.value
        ? [
            {
              key: "google-tag-manager",
              src: `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`,
              async: true,
              onload: applyMetaConsent,
            },
          ]
        : [],
    }));

    const loadGtm = () => {
      const dataLayer = ensureDataLayer();

      if (analyticsWindow.__flexdriveGtmId === gtmId) {
        gtmScriptEnabled.value = true;
        return;
      }

      dataLayer.push({
        "gtm.start": Date.now(),
        event: "gtm.js",
      });
      analyticsWindow.__flexdriveGtmId = gtmId;
      gtmScriptEnabled.value = true;
    };

    applyGoogleConsent("default");
    applyMetaConsent();

    if (trackingConsentGranted.value) {
      loadGtm();
    }

    watch(
      consentState,
      () => {
        applyGoogleConsent("update");
        applyMetaConsent();

        if (trackingConsentGranted.value) {
          loadGtm();
        }
      },
    );
  },
});
