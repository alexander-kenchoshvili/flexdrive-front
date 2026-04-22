import type {
  CatalogCategoryItem,
  CatalogListParams,
  CatalogListResponse,
  CatalogProductDetail,
  CatalogProductSuggestion,
} from "~/types/catalog";
import { apiFetchRaw } from "~/composables/apiFetch";

const BOOL_PARAM_KEYS: Array<keyof CatalogListParams> = [
  "is_new",
  "is_featured",
  "in_stock",
  "on_sale",
];

const NUMBER_PARAM_KEYS: Array<keyof CatalogListParams> = [
  "page",
  "page_size",
  "min_price",
  "max_price",
];

const toQueryValue = (value: unknown): string => {
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
};

const buildListQuery = (params: CatalogListParams = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([rawKey, rawValue]) => {
    if (rawValue === undefined || rawValue === null || rawValue === "") return;
    const key = rawKey as keyof CatalogListParams;

    if (BOOL_PARAM_KEYS.includes(key) && typeof rawValue !== "boolean") return;
    if (NUMBER_PARAM_KEYS.includes(key) && typeof rawValue !== "number") return;

    query.set(rawKey, toQueryValue(rawValue));
  });

  return query.toString();
};

export const useCatalogApi = () => {
  const getCatalogProducts = async (params: CatalogListParams = {}) => {
    const query = buildListQuery(params);
    const endpoint = query ? `/catalog/products/?${query}` : "/catalog/products/";
    return apiFetch<CatalogListResponse>(endpoint);
  };

  const getCatalogProductsRaw = async (params: CatalogListParams = {}) => {
    const query = buildListQuery(params);
    const endpoint = query ? `/catalog/products/?${query}` : "/catalog/products/";
    return apiFetchRaw<CatalogListResponse>(endpoint);
  };

  const getCatalogCategories = async () => {
    return apiFetch<CatalogCategoryItem[]>("/catalog/categories/");
  };

  const getCatalogCategoriesRaw = async () => {
    return apiFetchRaw<CatalogCategoryItem[]>("/catalog/categories/");
  };

  const getCatalogProductSuggestions = async (query: string) => {
    const normalizedQuery = query.trim();
    const endpoint = normalizedQuery
      ? `/catalog/products/suggestions/?q=${encodeURIComponent(normalizedQuery)}`
      : "/catalog/products/suggestions/";

    return apiFetchRaw<CatalogProductSuggestion[]>(endpoint);
  };

  const getCatalogProduct = async (slug: string) => {
    return apiFetch<CatalogProductDetail>(`/catalog/products/${slug}/`);
  };

  return {
    getCatalogProducts,
    getCatalogProductsRaw,
    getCatalogCategories,
    getCatalogCategoriesRaw,
    getCatalogProductSuggestions,
    getCatalogProduct,
  };
};
