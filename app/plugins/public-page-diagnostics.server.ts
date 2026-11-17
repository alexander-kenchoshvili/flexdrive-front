import { recordPublicPageFailure } from "~~/server/utils/publicPageDiagnostics";

export default defineNuxtPlugin({
  name: "public-page-diagnostics",
  enforce: "pre",
  setup(nuxtApp) {
    const event = useRequestEvent();
    nuxtApp.hook("app:error", (error) => recordPublicPageFailure(error, event));
  },
});
