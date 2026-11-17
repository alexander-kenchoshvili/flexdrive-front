import { secureFetchRaw } from "~/composables/secureFetch";
import { isProductionTrackingHost } from "~/utils/trackingHost";
import type { CatalogListParams } from "~/types/catalog";

type Interest = Pick<CatalogListParams, "make" | "model" | "year" | "variant"> & { lookup_token?: string; result_count?: number };
type Visit = { id: string; last: number; seen: Record<string, boolean> };
const STORAGE_KEY = "flexdrive-vehicle-interest-visit";
const INTERNAL_KEY = "flexdrive-internal-traffic";
const MAX_IDLE_MS = 30 * 60 * 1000;

export const useVehicleInterestTracking = () => {
  // Capture Nuxt context synchronously at setup, before any VIN/API await.
  const { analyticsConsentGranted } = useCookieConsent();
  const visit = useState<Visit | null>("vehicle-interest-visit", () => null);
  const { user } = useBusinessAuth();
  const forget = () => {
    visit.value = null;
    if (import.meta.client) { try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* No storage required. */ } }
  };
  watch(analyticsConsentGranted, (allowed) => { if (!allowed) forget(); }, { immediate: true });
  const capture = async (input: Interest) => {
    if (!import.meta.client || !analyticsConsentGranted.value || user.value || !isProductionTrackingHost(window.location.hostname)) return;
    if (!input.lookup_token && (!input.make || !input.model)) return;
    try { if (localStorage.getItem(INTERNAL_KEY) === "1") return; } catch { /* Staff state above remains available. */ }
    const now = Date.now();
    if (!visit.value) {
      try {
        const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
        if (saved && typeof saved.id === "string" && /^[0-9a-f-]{36}$/i.test(saved.id) && typeof saved.last === "number" && now - saved.last < MAX_IDLE_MS && now >= saved.last) {
          visit.value = { id: saved.id, last: saved.last, seen: {} };
        }
      } catch { /* In-memory collection still works. */ }
    }
    if (!visit.value || now - visit.value.last >= MAX_IDLE_MS) {
      if (!globalThis.crypto?.randomUUID) return;
      visit.value = { id: globalThis.crypto.randomUUID(), last: now, seen: {} };
    }
    const current = visit.value;
    current.last = now;
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ id: current.id, last: now })); } catch { /* Memory only. */ }
    const vehicle = input.lookup_token ? { lookup_token: input.lookup_token } : {
      make: String(input.make), model: String(input.model),
      ...(input.year ? { year: input.year } : {}), ...(input.variant ? { variant: input.variant } : {}),
    };
    const count = Number.isSafeInteger(input.result_count) && input.result_count! >= 0 ? input.result_count : undefined;
    const key = JSON.stringify([vehicle, count === 0]);
    if (current.seen[key]) return;
    current.seen[key] = true;
    try {
      await secureFetchRaw("/catalog/vehicles/interest/", {
        method: "POST", retry: 0, timeout: 5000,
        body: { ...vehicle, ...(count !== undefined ? { result_count: count } : {}),
          session_id: current.id, analytics_consent: true },
      });
    } catch { current.seen[key] = false; /* Analytics must never interrupt shopping. */ }
  };
  return { capture };
};
