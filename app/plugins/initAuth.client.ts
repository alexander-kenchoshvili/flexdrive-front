import { useAuthBootstrap } from "~/composables/useAuthBootstrap";
import { buildLoginRedirectLocation, routeRequiresAuth } from "~/utils/authRouting";

export default defineNuxtPlugin(async () => {
  const globalStore = useGlobalStore();
  const { ensureAuthResolved } = useAuthBootstrap();

  await ensureAuthResolved();

  const route = useRoute();

  if (!globalStore.currentUser && routeRequiresAuth(route.meta.middleware)) {
    await navigateTo(buildLoginRedirectLocation(route.fullPath), {
      replace: true,
    });
  }
});
