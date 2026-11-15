import { getRequestHeader, getRequestURL, type H3Event } from "h3";
import { indexingEnabled, isCanonicalIndexingHost, isForcedNoindexPath } from "../../app/utils/seoIndexing";

type SeoConfig = { public: { allowIndexing?: unknown; siteUrl?: unknown } };

export const canIndexRequest = (event: H3Event, config: SeoConfig) =>
  indexingEnabled(config.public.allowIndexing)
  && isCanonicalIndexingHost(String(config.public.siteUrl || ""), getRequestHeader(event, "host") || "")
  && event.context.storefrontPreviewOnly !== true;

export const mustExcludeRequest = (event: H3Event, config: SeoConfig) =>
  !canIndexRequest(event, config)
  || isForcedNoindexPath(getRequestURL(event, { xForwardedHost: false }).pathname);
