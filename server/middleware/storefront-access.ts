import { defineEventHandler } from "h3";
import { guardStorefrontRequest } from "../utils/storefrontAccess";

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);
  return guardStorefrontRequest(event, {
    enabled: config.storefrontAccessGuardEnabled,
    apiBaseUrl: String(config.apiBaseUrl || ""),
    production: !import.meta.dev,
  });
});
