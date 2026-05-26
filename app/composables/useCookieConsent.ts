export type CookieConsentPreferences = {
  version: 1;
  preferences: boolean;
  functionality: boolean;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

export type CookieConsentDraft = Pick<
  CookieConsentPreferences,
  "preferences" | "functionality" | "analytics" | "marketing"
>;

export const COOKIE_CONSENT_NAME = "flexdrive_cookie_consent";
export const COOKIE_CONSENT_VERSION = 1;

const COOKIE_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

const isCookieConsentPreferences = (
  value: unknown,
): value is CookieConsentPreferences => {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<CookieConsentPreferences>;

  return (
    candidate.version === COOKIE_CONSENT_VERSION &&
    (typeof candidate.preferences === "boolean" ||
      candidate.preferences === undefined) &&
    (typeof candidate.functionality === "boolean" ||
      candidate.functionality === undefined) &&
    typeof candidate.analytics === "boolean" &&
    typeof candidate.marketing === "boolean" &&
    typeof candidate.updatedAt === "string"
  );
};

export const useCookieConsent = () => {
  const consentCookie = useCookie<CookieConsentPreferences | null>(
    COOKIE_CONSENT_NAME,
    {
      default: () => null,
      maxAge: COOKIE_CONSENT_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      watch: "shallow",
    },
  );

  const isPreferencesOpen = useState(
    "flexdrive-cookie-consent-preferences-open",
    () => false,
  );

  const consent = computed<CookieConsentPreferences | null>(() => {
    if (!isCookieConsentPreferences(consentCookie.value)) {
      return null;
    }

    return {
      ...consentCookie.value,
      preferences: consentCookie.value.preferences === true,
      functionality: consentCookie.value.functionality === true,
    };
  });

  const hasConsentDecision = computed(() => Boolean(consent.value));
  const preferencesConsentGranted = computed(
    () => consent.value?.preferences === true,
  );
  const functionalityConsentGranted = computed(
    () => consent.value?.functionality === true,
  );
  const analyticsConsentGranted = computed(
    () => consent.value?.analytics === true,
  );
  const marketingConsentGranted = computed(
    () => consent.value?.marketing === true,
  );
  const trackingConsentGranted = computed(
    () => analyticsConsentGranted.value && marketingConsentGranted.value,
  );
  const shouldShowCookieBanner = computed(
    () => !hasConsentDecision.value || isPreferencesOpen.value,
  );

  const saveConsent = ({
    preferences,
    functionality,
    analytics,
    marketing,
  }: CookieConsentDraft) => {
    consentCookie.value = {
      version: COOKIE_CONSENT_VERSION,
      preferences,
      functionality,
      analytics,
      marketing,
      updatedAt: new Date().toISOString(),
    };
    isPreferencesOpen.value = false;
  };

  const acceptAllCookies = () => {
    saveConsent({
      preferences: true,
      functionality: true,
      analytics: true,
      marketing: true,
    });
  };

  const rejectOptionalCookies = () => {
    saveConsent({
      preferences: false,
      functionality: false,
      analytics: false,
      marketing: false,
    });
  };

  const openCookiePreferences = () => {
    isPreferencesOpen.value = true;
  };

  const closeCookiePreferences = () => {
    if (hasConsentDecision.value) {
      isPreferencesOpen.value = false;
    }
  };

  return {
    consent,
    hasConsentDecision,
    preferencesConsentGranted,
    functionalityConsentGranted,
    analyticsConsentGranted,
    marketingConsentGranted,
    trackingConsentGranted,
    shouldShowCookieBanner,
    saveConsent,
    acceptAllCookies,
    rejectOptionalCookies,
    openCookiePreferences,
    closeCookiePreferences,
  };
};
