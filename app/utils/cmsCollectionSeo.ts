import type { LocationQuery, LocationQueryValue } from "vue-router";
import {
  getCatalogCategorySlugFromPath,
} from "~/utils/routePaths";
import { normalizeSeoPath } from "~/utils/seoIndexing";

type CmsCollectionSeoPolicy = {
  canonicalPath: string;
  robots?: "index, follow" | "noindex, follow";
};

const firstQueryValue = (
  value: LocationQueryValue | LocationQueryValue[] | undefined,
) => {
  if (Array.isArray(value)) {
    return value[0] ?? undefined;
  }

  return value ?? undefined;
};

const normalizeQuery = (query: LocationQuery) => {
  const normalized: Record<string, string> = {};

  Object.entries(query).forEach(([key, value]) => {
    const parsedValue = firstQueryValue(value);
    if (parsedValue === undefined || parsedValue === "") {
      return;
    }

    normalized[key] = String(parsedValue);
  });

  return normalized;
};

const toPositivePage = (value: string | undefined) => {
  if (!value) return null;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 1) {
    return null;
  }

  return parsed;
};

const buildCanonicalPathWithPage = (path: string, page: number | null) => {
  if (!page) {
    return path;
  }

  return `${path}?page=${page}`;
};

const resolveCollectionPolicy = (
  path: string,
  query: Record<string, string>,
): CmsCollectionSeoPolicy => {
  const { page, ...otherQuery } = query;
  const currentPage = toPositivePage(page);
  const hasOtherQuery = Object.keys(otherQuery).length > 0;

  if (hasOtherQuery) {
    return {
      canonicalPath: path,
      robots: "noindex, follow",
    };
  }

  return {
    canonicalPath: buildCanonicalPathWithPage(path, currentPage),
    robots: "index, follow",
  };
};

export const resolveCmsCollectionSeoPolicy = (
  path: string,
  query: LocationQuery,
): CmsCollectionSeoPolicy | null => {
  const normalizedPath = normalizeSeoPath(path);
  const normalizedQuery = normalizeQuery(query);

  if (
    normalizedPath === "/catalog" ||
    getCatalogCategorySlugFromPath(normalizedPath)
  ) {
    return resolveCollectionPolicy(normalizedPath, normalizedQuery);
  }

  if (normalizedPath === "/blogs") {
    return resolveCollectionPolicy(normalizedPath, normalizedQuery);
  }

  return null;
};
