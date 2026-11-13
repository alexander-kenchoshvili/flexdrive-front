import { setHeader } from "h3";
import { guardEnabled, preventStorefrontCaching } from "../utils/storefrontAccess";

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("beforeResponse", (event) => {
    if (guardEnabled(useRuntimeConfig(event).storefrontAccessGuardEnabled)) {
      // Apply after SSR/proxy handlers too; upstream headers cannot undo privacy.
      preventStorefrontCaching(event);
      if (event.context.storefrontPreviewOnly === true) setHeader(event, "x-robots-tag", "noindex, nofollow");
    }
  });
});
