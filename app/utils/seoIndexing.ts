const ALWAYS_NOINDEX_EXACT_PATHS = new Set([
  "/cart",
  "/forgot-password",
  "/login",
  "/register",
  "/resend-activation",
  "/order-status",
  "/__preview",
]);

const ALWAYS_NOINDEX_PREFIXES = [
  "/business",
  "/activate",
  "/checkout",
  "/profile",
  "/reset-password",
  "/wishlist",
  "/auth",
  "/manager-fd",
];

type ResolveRobotsValueInput = {
  allowIndexing: boolean;
  path: string;
  pageNoindex?: boolean | null;
};

type BuildRobotsTxtInput = {
  allowIndexing: boolean;
  sitemapUrl?: string | null;
};

// Runtime environment values may arrive as strings. Unknown values fail closed.
export const indexingEnabled = (value: unknown) => value === true
  || (typeof value === "string" && ["true", "1", "yes", "on"].includes(value.trim().toLowerCase()));

export const isCanonicalIndexingHost = (siteUrl: string, host: string) => {
  try {
    const site = new URL(siteUrl);
    if (site.protocol !== "https:" || site.username || site.password
      || site.pathname !== "/" || site.search || site.hash) return false;
    if (!host || /[\s/@\\?#]/.test(host)) return false;
    const request = new URL(`https://${host}`);
    return request.host === site.host && site.hostname !== "localhost"
      && !site.hostname.endsWith(".localhost") && !site.hostname.startsWith("127.");
  } catch {
    return false;
  }
};

export const normalizeSeoPath = (value: string) => {
  const withoutQuery = (value || "/").split("?")[0] || "/";
  const sanitized = withoutQuery.replace(/\/+$/, "");
  return sanitized || "/";
};

export const isForcedNoindexPath = (path: string) => {
  const normalizedPath = normalizeSeoPath(path);

  if (ALWAYS_NOINDEX_EXACT_PATHS.has(normalizedPath)) {
    return true;
  }

  return ALWAYS_NOINDEX_PREFIXES.some(
    (prefix) =>
      normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`),
  );
};

export const resolveRobotsValue = ({
  allowIndexing,
  path,
  pageNoindex = false,
}: ResolveRobotsValueInput) => {
  if (!allowIndexing || pageNoindex || isForcedNoindexPath(path)) {
    return "noindex, nofollow";
  }

  return "index, follow";
};

export const buildRobotsTxt = ({
  allowIndexing,
  sitemapUrl,
}: BuildRobotsTxtInput) => {
  const lines: string[] = [];

  if (!allowIndexing) {
    lines.push("User-agent: *");
    lines.push("Disallow: /");
    // Permit Facebook link previews for public blogs before search indexing opens.
    lines.push("");
    lines.push("User-agent: facebookexternalhit");
    lines.push("Allow: /blogs/");
    lines.push("Disallow: /");
    return lines.join("\n");
  }

  lines.push("User-agent: *");
  lines.push("Allow: /");
  lines.push("Disallow: /business");

  if (sitemapUrl) {
    lines.push(`Sitemap: ${sitemapUrl}`);
  }

  return lines.join("\n");
};
