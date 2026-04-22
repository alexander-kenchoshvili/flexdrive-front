const ALWAYS_NOINDEX_EXACT_PATHS = new Set([
  "/cart",
  "/forgot-password",
  "/login",
  "/register",
  "/resend-activation",
]);

const ALWAYS_NOINDEX_PREFIXES = [
  "/activate",
  "/checkout",
  "/profile",
  "/reset-password",
  "/wishlist",
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
