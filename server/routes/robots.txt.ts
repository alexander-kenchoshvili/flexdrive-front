import { defineEventHandler, setHeader } from "h3";
import { buildRobotsTxt } from "../../app/utils/seoIndexing";
import { canIndexRequest } from "../utils/seoPolicy";

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);
  const allowIndexing = canIndexRequest(event, config);
  const siteUrl = String(config.public.siteUrl || "").replace(/\/+$/, "");
  setHeader(event, "content-type", "text/plain; charset=utf-8");
  // A closed store and every noncanonical hostname expose no crawlable paths.
  if (!allowIndexing) return "User-agent: *\nDisallow: /\n";
  return buildRobotsTxt({ allowIndexing, sitemapUrl: `${siteUrl}/sitemap.xml` });
});
