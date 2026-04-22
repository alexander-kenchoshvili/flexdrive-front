import { createError, defineEventHandler, setHeader } from "h3";
import { isForcedNoindexPath } from "~/utils/seoIndexing";

type SitemapEntry = {
  loc: string;
  lastmod?: string | null;
};

type SitemapEntriesResponse = {
  entries: SitemapEntry[];
};

const normalizeUrl = (value: string) => value.replace(/\/+$/, "");

const normalizePath = (value: string) => {
  const parts = String(value || "").split("?");
  const rawPath = parts[0] || "/";
  const rawQuery = parts[1];
  const normalizedPath =
    `/${rawPath.replace(/^\/+/, "")}`.replace(/\/+$/, "") || "/";
  return rawQuery ? `${normalizedPath}?${rawQuery}` : normalizedPath;
};

const resolveEntryUrl = (siteUrl: string, loc: string) => {
  const rawLoc = String(loc || "").trim();
  if (!rawLoc) return null;

  const site = new URL(siteUrl);

  if (/^https?:\/\//i.test(rawLoc)) {
    const entryUrl = new URL(rawLoc);
    if (entryUrl.origin !== site.origin) {
      return null;
    }

    const normalizedPath = normalizePath(
      `${entryUrl.pathname}${entryUrl.search || ""}`,
    );
    return `${site.origin}${normalizedPath}`;
  }

  return `${site.origin}${normalizePath(rawLoc)}`;
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const buildSitemapXml = (entries: Array<{ loc: string; lastmod?: string | null }>) => {
  const urls = entries
    .map(({ loc, lastmod }) => {
      const lastmodTag = lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : "";
      return `<url><loc>${escapeXml(loc)}</loc>${lastmodTag}</url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
};

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const allowIndexing = Boolean(config.public.allowIndexing);
  const siteUrl = normalizeUrl(String(config.public.siteUrl || ""));

  setHeader(event, "content-type", "application/xml; charset=utf-8");

  if (!allowIndexing || !siteUrl) {
    return buildSitemapXml([]);
  }

  let payload: SitemapEntriesResponse;

  try {
    payload = await $fetch<SitemapEntriesResponse>("/pages/sitemap/", {
      baseURL: String(config.apiBaseUrl || ""),
    });
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to generate sitemap",
      cause: error,
    });
  }

  const seen = new Set<string>();
  const mappedEntries = (payload.entries || [])
    .map((entry) => {
      const absoluteUrl = resolveEntryUrl(siteUrl, entry.loc);
      if (!absoluteUrl) return null;

      const url = new URL(absoluteUrl);
      const normalizedPath = `${url.pathname}${url.search}`;

      if (isForcedNoindexPath(normalizedPath)) {
        return null;
      }

      if (seen.has(absoluteUrl)) {
        return null;
      }

      seen.add(absoluteUrl);
      return {
        loc: absoluteUrl,
        lastmod: entry.lastmod ? new Date(entry.lastmod).toISOString() : null,
      };
    });

  const entries = mappedEntries.filter(
    (entry): entry is { loc: string; lastmod: string | null } => entry !== null,
  );

  return buildSitemapXml(entries);
});
