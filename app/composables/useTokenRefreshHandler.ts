import { useAuth } from "./useAuth";
import { secureFetchRaw } from "./secureFetch";
import type { AuthSessionState } from "~/types/auth";

let isRefreshing = false;
let refreshPromise: Promise<AuthSessionState | null> | null = null;

export const useTokenRefreshHandler = () => {
  const { refreshUserToken, resetState } = useAuth();
  const { fetchAuthSession } = useAuthSession();
  const globalStore = useGlobalStore();

  const syncCurrentUser = async (resetOnFailure = true) => {
    try {
      const userRetry = await secureFetchRaw("/accounts/me/");
      globalStore.currentUser = userRetry;
      return true;
    } catch {
      if (resetOnFailure) {
        resetState();
      }
      return false;
    }
  };

  const resolveSessionStatus = async () => {
    let session: AuthSessionState | null = null;
    try {
      session = await fetchAuthSession();
    } catch {
      session = null;
    }

    return session;
  };

  const runTokenRefresh = async (
    options: {
      preserveSessionOnError?: boolean;
    } = {},
  ) => {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshUserToken(options);
    }

    try {
      return await refreshPromise;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  };

  const refreshAuthenticatedSession = async (): Promise<boolean> => {
    if (import.meta.server) {
      return false;
    }

    const session = await resolveSessionStatus();
    if (!session?.has_refresh) {
      resetState();
      return false;
    }

    const refreshedSession = await runTokenRefresh();
    if (refreshedSession?.has_access) {
      return syncCurrentUser();
    }

    resetState();
    return false;
  };

  const refreshSessionProactively = async (): Promise<boolean> => {
    if (import.meta.server) {
      return false;
    }

    const session = await resolveSessionStatus();
    if (!session) {
      return false;
    }

    if (!session.has_refresh) {
      resetState();
      return false;
    }

    const refreshedSession = await runTokenRefresh({
      preserveSessionOnError: true,
    });

    if (!refreshedSession?.has_access) {
      return false;
    }

    return syncCurrentUser(false);
  };

  return {
    handle401Error: refreshAuthenticatedSession,
    refreshAuthenticatedSession,
    refreshSessionProactively,
  };
};
