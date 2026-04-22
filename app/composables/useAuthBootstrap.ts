import { secureFetchRaw } from "./secureFetch";

let authBootstrapPromise: Promise<void> | null = null;

export const useAuthBootstrap = () => {
  const globalStore = useGlobalStore();
  const { handle401Error } = useTokenRefreshHandler();

  const ensureAuthResolved = async () => {
    if (import.meta.server || globalStore.authResolved) {
      return;
    }

    if (authBootstrapPromise) {
      return authBootstrapPromise;
    }

    authBootstrapPromise = (async () => {
      if (globalStore.currentUser) {
        globalStore.authResolved = true;
        return;
      }

      try {
        const user = await secureFetchRaw("/accounts/me/");
        globalStore.currentUser = user;
      } catch (error: any) {
        if (error?.response?.status === 401) {
          const refreshed = await handle401Error();
          if (!refreshed) {
            globalStore.currentUser = null;
          }
        } else {
          globalStore.currentUser = null;
        }
      } finally {
        globalStore.authResolved = true;
      }
    })();

    try {
      await authBootstrapPromise;
    } finally {
      authBootstrapPromise = null;
    }
  };

  return { ensureAuthResolved };
};
