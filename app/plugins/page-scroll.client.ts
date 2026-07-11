import {
  markPagePending,
  markPageReady,
} from "~/utils/pageScrollCoordinator";

export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter();
  const currentPath = () => router.currentRoute.value.fullPath;

  markPageReady(currentPath());

  nuxtApp.hook("page:start", () => {
    markPagePending(currentPath());
  });

  nuxtApp.hook("page:finish", () => {
    markPageReady(currentPath());
  });

  nuxtApp.hook("app:error", () => {
    markPageReady(currentPath());
  });
});
