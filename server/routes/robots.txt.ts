import { defineEventHandler, setHeader } from "h3";

const buildRobotsTxt = ({
  allowIndexing,
  sitemapUrl,
}: {
  allowIndexing: boolean;
  sitemapUrl?: string | null;
}) => {
  const lines = ["User-agent: *"];

  if (!allowIndexing) {
    lines.push("Disallow: /");
    return lines.join("\n");
  }

  lines.push("Allow: /");

  if (sitemapUrl) {
    lines.push(`Sitemap: ${sitemapUrl}`);
  }

  return lines.join("\n");
};

const normalizeUrl = (value: string) => value.replace(/\/+$/, "");

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);
  const allowIndexing = Boolean(config.public.allowIndexing);
  const siteUrl = normalizeUrl(String(config.public.siteUrl || ""));
  const sitemapUrl = allowIndexing && siteUrl ? `${siteUrl}/sitemap.xml` : null;

  setHeader(event, "content-type", "text/plain; charset=utf-8");

  return buildRobotsTxt({
    allowIndexing,
    sitemapUrl,
  });
});
