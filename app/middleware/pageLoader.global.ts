import { createError } from "h3";
import type { LocationQueryRaw } from "vue-router";
import { apiFetchRaw } from "~/composables/apiFetch";
import type { CatalogCategoryItem } from "~/types/catalog";
import {
  resolveHttpStatusCode,
  resolveHttpStatusMessage,
} from "~/utils/httpError";
import {
  buildCatalogCategoryPath,
  getCatalogCategorySlugFromPath,
} from "~/utils/routePaths";
import { normalizeSeoPath } from "~/utils/seoIndexing";

const firstQueryValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value[0] ?? undefined;
  }

  return typeof value === "string" ? value : undefined;
};

const withoutCategoryQuery = (query: LocationQueryRaw) => {
  const nextQuery: LocationQueryRaw = { ...query };
  delete nextQuery.category;
  return nextQuery;
};

const resolveCatalogCategorySlug = async (value: string) => {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) {
    return null;
  }

  if (!/^\d+$/.test(normalizedValue)) {
    return normalizedValue;
  }

  try {
    const categories = await apiFetchRaw<CatalogCategoryItem[]>(
      "/catalog/categories/",
    );
    const matchedCategory = categories.find(
      (category) => category.id === Number(normalizedValue),
    );

    return matchedCategory?.slug || null;
  } catch {
    return null;
  }
};

const throwRouteLoadError = (error: unknown) => {
  const statusCode = resolveHttpStatusCode(error) ?? 500;
  const statusMessage =
    resolveHttpStatusMessage(error) ||
    (statusCode === 404
      ? "გვერდი ვერ მოიძებნა"
      : "გვერდის ჩატვირთვა ვერ მოხერხდა");

  throw createError({
    cause: error,
    statusCode,
    statusMessage,
  });
};

const isCatalogCollectionPath = (path: string) => {
  const normalizedPath = normalizeSeoPath(path);
  return (
    normalizedPath === "/catalog" ||
    Boolean(getCatalogCategorySlugFromPath(normalizedPath))
  );
};

export default defineNuxtRouteMiddleware(async (to, from) => {
  const store = useGlobalStore();
  const skipCmsLoader = Boolean(to.meta?.skipCmsLoader);
  const normalizedPath = normalizeSeoPath(to.path || "/");

  if (normalizedPath === "/catalog") {
    const legacyCategory = firstQueryValue(to.query.category);

    if (legacyCategory) {
      const categorySlug = await resolveCatalogCategorySlug(legacyCategory);

      if (categorySlug) {
        return navigateTo(
          {
            path: buildCatalogCategoryPath(categorySlug),
            query: withoutCategoryQuery(to.query),
          },
          {
            redirectCode: 301,
            replace: true,
          },
        );
      }
    }
  }

  if (skipCmsLoader) {
    const segments = normalizedPath.split("/");
    const slug = segments[1] || "main";

    store.resetPageState();
    store.setCurrentMenu(slug);
    return;
  }

  if (
    import.meta.client &&
    from &&
    isCatalogCollectionPath(from.path || "/") &&
    isCatalogCollectionPath(to.path || "/")
  ) {
    return;
  }

  if (import.meta.client && from && to.path === from.path) {
    return;
  }

  store.isComponentsLoad = false;

  const loadPage = async () => {
    try {
      await store.initPage(to.path);
    } catch (error) {
      throwRouteLoadError(error);
    }
  };

  if (import.meta.server) {
    await loadPage();
  }

  if (import.meta.client && !store.isComponentsLoad) {
    await loadPage();
  }

  if (
    store.canonicalPath &&
    normalizeSeoPath(store.canonicalPath) !== normalizedPath
  ) {
    return navigateTo(
      {
        path: store.canonicalPath,
        query: to.query,
      },
      {
        redirectCode: 301,
        replace: true,
      },
    );
  }
});
