const IMMEDIATE_REFRESH_DELAY_MS = 250;
const MIN_REFRESH_LEAD_MS = 5_000;
const MAX_REFRESH_LEAD_MS = 60_000;

let scheduledRefreshTimer: ReturnType<typeof window.setTimeout> | null = null;
let visibilityListenersBound = false;

const parseExpiryTimestamp = (value: string | null | undefined) => {
  const timestamp = Date.parse(value || "");
  return Number.isFinite(timestamp) ? timestamp : null;
};

const getRefreshLeadMs = (msUntilExpiry: number) => {
  const proportionalLead = Math.floor(msUntilExpiry * 0.2);
  return Math.min(
    MAX_REFRESH_LEAD_MS,
    Math.max(MIN_REFRESH_LEAD_MS, proportionalLead),
  );
};

export default defineNuxtPlugin(() => {
  const globalStore = useGlobalStore();
  const { fetchAuthSession } = useAuthSession();
  const { refreshSessionProactively } = useTokenRefreshHandler();

  const clearScheduledRefresh = () => {
    if (scheduledRefreshTimer === null) {
      return;
    }

    window.clearTimeout(scheduledRefreshTimer);
    scheduledRefreshTimer = null;
  };

  const scheduleRefresh = (delayMs: number) => {
    clearScheduledRefresh();
    scheduledRefreshTimer = window.setTimeout(() => {
      void refreshSessionProactively();
    }, delayMs);
  };

  const reevaluateRefreshSchedule = async () => {
    if (!globalStore.authResolved || !globalStore.currentUser) {
      clearScheduledRefresh();
      return;
    }

    const session = globalStore.authSession;

    if (!session) {
      try {
        await fetchAuthSession();
      } catch {
        // Fall back to the existing reactive 401 handler if the sync check fails.
      }
      return;
    }

    if (!session.has_refresh) {
      clearScheduledRefresh();
      return;
    }

    const accessExpiryTimestamp = parseExpiryTimestamp(session.access_expires_at);

    if (!accessExpiryTimestamp) {
      scheduleRefresh(IMMEDIATE_REFRESH_DELAY_MS);
      return;
    }

    const msUntilExpiry = accessExpiryTimestamp - Date.now();
    const refreshLeadMs = getRefreshLeadMs(msUntilExpiry);

    if (msUntilExpiry <= refreshLeadMs) {
      scheduleRefresh(IMMEDIATE_REFRESH_DELAY_MS);
      return;
    }

    scheduleRefresh(Math.max(IMMEDIATE_REFRESH_DELAY_MS, msUntilExpiry - refreshLeadMs));
  };

  const handleVisibilityRecovery = () => {
    if (document.visibilityState !== "visible") {
      return;
    }

    void reevaluateRefreshSchedule();
  };

  if (!visibilityListenersBound) {
    window.addEventListener("focus", handleVisibilityRecovery);
    document.addEventListener("visibilitychange", handleVisibilityRecovery);
    visibilityListenersBound = true;
  }

  watch(
    () => [
      globalStore.authResolved,
      globalStore.currentUser?.id || null,
      globalStore.authSession?.has_access || false,
      globalStore.authSession?.has_refresh || false,
      globalStore.authSession?.access_expires_at || null,
      globalStore.authSession?.refresh_expires_at || null,
    ],
    () => {
      void reevaluateRefreshSchedule();
    },
    { immediate: true },
  );
});
