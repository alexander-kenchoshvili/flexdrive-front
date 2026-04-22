import type { RouteLocationRaw } from "vue-router";
import type { AuthSessionState } from "~/types/auth";
import { secureFetchRaw } from "./secureFetch";

export const useAuth = () => {
  const globalStore = useGlobalStore();
  const cartStore = useCartStore();
  const wishlistStore = useWishlistStore();
  const { applyAuthSession, clearAuthSession } = useAuthSession();
  const baseURL = useApiBaseUrl();

  const resetState = () => {
    globalStore.currentUser = null;
    globalStore.authResolved = true;
    clearAuthSession();
    cartStore.reset();
    wishlistStore.reset();
  };

  const logout = async (
    options: {
      redirectTo?: RouteLocationRaw;
    } = {},
  ) => {
    try {
      await secureFetchRaw(`${baseURL}/accounts/logout/`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      resetState();
      await navigateTo(options.redirectTo || "/login");
    }
  };

  const refreshUserToken = async (
    options: {
      preserveSessionOnError?: boolean;
    } = {},
  ): Promise<AuthSessionState | null> => {
    try {
      const response = await secureFetchRaw<{ session?: AuthSessionState }>(
        `${baseURL}/accounts/token/refresh/`,
        {
          method: "POST",
        },
      );
      return applyAuthSession(response?.session);
    } catch (error) {
      console.error("Refresh token failed:", error);
      if (!options.preserveSessionOnError) {
        clearAuthSession();
      }
      return null;
    }
  };

  return { logout, resetState, refreshUserToken };
};
