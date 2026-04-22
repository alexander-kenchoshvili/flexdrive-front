import { normalizeSeoPath } from "~/utils/seoIndexing";

type BuildSingleViewPathInput = {
  contentType?: string | null;
  id?: number | string | null;
  slug?: string | null;
};

export type ParsedSingleViewPath = {
  contentType: string;
  id: number;
  slug: string;
};

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "");

export const buildSingleViewPath = ({
  contentType,
  id,
  slug,
}: BuildSingleViewPathInput) => {
  const normalizedContentType = trimSlashes(String(contentType || ""));
  const normalizedSlug = trimSlashes(String(slug || ""));
  const normalizedId = String(id || "").trim();

  if (!normalizedContentType || !normalizedId || !normalizedSlug) {
    return "/";
  }

  return `/${normalizedContentType}/${normalizedId}-${normalizedSlug}`;
};

export const parseSingleViewPath = (
  path: string,
): ParsedSingleViewPath | null => {
  const normalizedPath = normalizeSeoPath(path);
  const segments = normalizedPath.split("/").filter(Boolean);

  if (segments.length !== 2) {
    return null;
  }

  const contentType = segments[0];
  const singleViewSegment = segments[1];
  if (!contentType || !singleViewSegment) {
    return null;
  }

  const matches = singleViewSegment.match(/^(\d+)-(.+)$/);

  if (!contentType || !matches) {
    return null;
  }

  const id = Number(matches[1]);
  const slug = matches[2]?.trim();

  if (!Number.isInteger(id) || id <= 0 || !slug) {
    return null;
  }

  return {
    contentType,
    id,
    slug,
  };
};

export const buildCatalogCategoryPath = (slug: string) => {
  const normalizedSlug = trimSlashes(String(slug || ""));
  if (!normalizedSlug) {
    return "/catalog";
  }

  return `/catalog/category/${normalizedSlug}`;
};

export const getCatalogCategorySlugFromPath = (path: string) => {
  const normalizedPath = normalizeSeoPath(path);
  const matches = normalizedPath.match(/^\/catalog\/category\/([^/]+)$/);
  return matches?.[1] || null;
};

export const isCatalogCategoryPath = (path: string) =>
  Boolean(getCatalogCategorySlugFromPath(path));
