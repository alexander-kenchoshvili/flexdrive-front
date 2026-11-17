import { recordPublicPageFailure } from "../utils/publicPageDiagnostics";

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("error", (error, context) => recordPublicPageFailure(error, context.event));
});
