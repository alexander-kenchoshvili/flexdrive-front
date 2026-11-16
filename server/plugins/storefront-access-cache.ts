import {
  getRequestURL, getResponseHeader, getResponseStatus, removeResponseHeader, setHeader,
  type H3Event,
} from "h3";
import { getAsset } from "#nitro-internal-virtual/public-assets";
import { guardEnabled, preventStorefrontCaching } from "../utils/storefrontAccess";

const isImmutableBuildAsset = (event: H3Event) => {
  if (!["GET", "HEAD"].includes(event.method)) return false;
  if (![200, 304].includes(getResponseStatus(event))) return false;
  if (getResponseHeader(event, "set-cookie")) return false;

  const path = getRequestURL(event, { xForwardedHost: false }).pathname;
  // Nuxt's current Vite build uses eight-character content hashes. Exclude
  // mutable build metadata, payloads, source maps and arbitrary static files.
  if (!/^\/_nuxt\/(?:[^/]+\.)?[A-Za-z0-9_-]{8}\.(?:css|m?js)$/.test(path)) return false;
  const asset = getAsset(path);
  if (!asset) return false;
  const expectedType = path.endsWith(".css") ? "text/css" : /^(?:text|application)\/(?:java|ecma)script$/;
  const type = asset.type.split(";")[0]?.trim().toLowerCase() || "";
  if (typeof expectedType === "string" ? type !== expectedType : !expectedType.test(type)) return false;
  // Only the actual static response is eligible, never a holding/error page
  // returned at an asset-looking URL. Nitro's conditional 304 has no MIME header.
  return getResponseStatus(event) === 304
    || String(getResponseHeader(event, "content-type") || "").split(";")[0]?.trim().toLowerCase() === type;
};

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("beforeResponse", (event) => {
    if (guardEnabled(useRuntimeConfig(event).storefrontAccessGuardEnabled)) {
      if (isImmutableBuildAsset(event)) {
        setHeader(event, "cache-control", "public, max-age=31536000, immutable");
        removeResponseHeader(event, "pragma");
        removeResponseHeader(event, "expires");
        return;
      }
      // Apply after SSR/proxy handlers too; upstream headers cannot undo privacy.
      preventStorefrontCaching(event);
      if (event.context.storefrontPreviewOnly === true) setHeader(event, "x-robots-tag", "noindex, nofollow");
    }
  });
});
