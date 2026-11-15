import { setHeader } from "h3";
import { mustExcludeRequest } from "../utils/seoPolicy";

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("beforeResponse", (event) => {
    // A preview page or the shared starter hostname must never override this
    // with an index meta tag or an upstream response header.
    if (mustExcludeRequest(event, useRuntimeConfig(event))) {
      setHeader(event, "x-robots-tag", "noindex, nofollow");
    }
  });
});
