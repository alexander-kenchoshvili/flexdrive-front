import { useAuthBootstrap } from "~/composables/useAuthBootstrap";
import { buildLoginRedirectLocation } from "~/utils/authRouting";

export default defineNuxtRouteMiddleware(async (to) => {
  const globalStore = useGlobalStore();

  if (import.meta.server) {
    if (globalStore.authResolved && !globalStore.currentUser) {
      return navigateTo(buildLoginRedirectLocation(to.fullPath), {
        replace: true,
      });
    }

    return;
  }

  const { ensureAuthResolved } = useAuthBootstrap();
  await ensureAuthResolved();

  if (!globalStore.currentUser) {
    return navigateTo(buildLoginRedirectLocation(to.fullPath), {
      replace: true,
    });
  }
});
