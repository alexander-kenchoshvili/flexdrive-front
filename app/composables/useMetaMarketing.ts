import { normalizeSearchAnalyticsTerm } from "~/utils/searchAnalytics";
import { isBusinessPath } from "~/utils/businessRouting";
import { isProductionTrackingHost } from "~/utils/trackingHost";
import type { CatalogVinResult } from "~/types/catalog";

type MetaParams = Record<string, string | number>;
type PixelWindow = Window & {
  fbq?: (command: "track", event: "Search" | "Contact", params: MetaParams) => void;
};

// GTM owns Pixel initialization. This is the sole owner of Search/Contact events;
// do not add another GTM tag for the same action (it would double-count).
export const useMetaMarketing = () => {
  const { trackingConsentGranted } = useCookieConsent();
  const { user } = useBusinessAuth();
  const gtmId = String(useRuntimeConfig().public.gtmId || "").trim().toUpperCase();
  let pending: { event: "Search" | "Contact"; params: MetaParams; expires: number }[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;

  const allowed = () => {
    if (!import.meta.client || !trackingConsentGranted.value || user.value ||
        !/^GTM-[A-Z0-9]+$/.test(gtmId) ||
        !isProductionTrackingHost(window.location.hostname) ||
        isBusinessPath(window.location.pathname)) return false;
    try { return localStorage.getItem("flexdrive-internal-traffic") !== "1"; }
    catch { return true; }
  };
  const clear = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    pending = [];
  };
  const flush = () => {
    timer = undefined;
    if (!allowed()) { clear(); return; }
    pending = pending.filter((item) => item.expires > Date.now());
    const pixel = (window as PixelWindow).fbq;
    if (typeof pixel === "function") {
      const batch = pending;
      pending = [];
      for (const item of batch) {
        try { pixel("track", item.event, item.params); }
        catch { /* Marketing must never interrupt search or retry an uncertain send. */ }
      }
    }
    // A first search may finish before the consent-loaded GTM base tag. Wait
    // briefly for its existing fbq queue; never load a second Pixel or replay
    // old searches after later consent, and never wait on the search itself.
    if (pending.length) timer = setTimeout(flush, 250);
  };

  watch(trackingConsentGranted, (granted) => { if (!granted) clear(); }, { flush: "sync" });
  onScopeDispose(clear);

  const send = (event: "Search" | "Contact", params: MetaParams) => {
    if (!allowed()) return;
    pending.push({ event, params, expires: Date.now() + 10000 });
    pending = pending.slice(-10);
    if (timer === undefined) flush();
  };

  const trackVinSearch = (result: CatalogVinResult) => {
    if (!allowed() || !("vehicle" in result)) return;
    const make = result.vehicle.make.trim().replace(/\s+/g, " ");
    const model = result.vehicle.model.trim().replace(/\s+/g, " ");
    const year = result.vehicle.year;
    if (!make || !model || make.length > 120 || model.length > 120 ||
        !Number.isInteger(year) || year < 1981 || year > new Date().getFullYear() + 2) return;
    // Deliberately construct an allowlist: no raw VIN, lookup token, free text,
    // session identifier, customer identity or speculative product IDs/value.
    send("Search", {
      search_string: `${make} ${model} ${year}`, search_type: "vin",
      vehicle_make: make, vehicle_model: model, vehicle_year: year,
      vin_outcome: result.status,
    });
  };
  const trackPartSearch = (term: string, count: number) => {
    if (!Number.isSafeInteger(count) || count < 0) return;
    const safeTerm = normalizeSearchAnalyticsTerm(term)
      .replace(/\b[A-HJ-NPR-Z0-9]{17}\b/gi, "[vin]")
      .replace(/(?:\d[\s()+-]*){9,}/g, "[number]");
    if (!safeTerm) return;
    send("Search", {
      search_type: "part", search_result_count: count,
      search_outcome: count === 0 ? "no_results" : "results",
      ...(/\[(?:email|phone|vin|number)\]/i.test(safeTerm) ? {} : { search_string: safeTerm }),
    });
  };
  const trackContact = () => send("Contact", { contact_method: "website_form" });
  return { trackVinSearch, trackPartSearch, trackContact };
};
