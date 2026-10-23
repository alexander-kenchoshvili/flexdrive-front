import type {
  CatalogCategoryItem,
  CatalogListParams,
  CatalogListResponse,
  CatalogProductDetail,
  CatalogProductSuggestion,
  CatalogVehicleEngine,
  CatalogVehicleModel,
  CatalogVehicleYear,
} from "~/types/catalog";
import { apiFetchRaw } from "~/composables/apiFetch";
import { useCatalogVehicleMakes } from "~/composables/catalog/useCatalogVehicleMakes";

const BOOL_PARAM_KEYS: Array<keyof CatalogListParams> = [
  "is_new",
  "is_featured",
  "in_stock",
  "on_sale",
];

const NUMBER_PARAM_KEYS: Array<keyof CatalogListParams> = [
  "page",
  "page_size",
  "year",
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

const buildQuery = (
  params: Record<string, string | number | null | undefined> = {},
) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });

  return query.toString();
};

export const useCatalogApi = () => {
  const { getVehicleMakes } = useCatalogVehicleMakes();
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

  const getCatalogCategory = (slug: string) =>
    apiFetch<CatalogCategoryItem>(`/catalog/categories/${encodeURIComponent(slug)}/`);
  const getCatalogCategoryRaw = (slug: string) =>
    apiFetchRaw<CatalogCategoryItem>(`/catalog/categories/${encodeURIComponent(slug)}/`);

  const getCatalogCategories = async (includeEmpty = false) => {
    return apiFetch<CatalogCategoryItem[]>(includeEmpty ? "/catalog/categories/?include_empty=true" : "/catalog/categories/");
  };

  const getCatalogCategoriesRaw = async (includeEmpty = false) => {
    return apiFetchRaw<CatalogCategoryItem[]>(includeEmpty ? "/catalog/categories/?include_empty=true" : "/catalog/categories/");
  };

  const getVehicleModels = async (make: string | number) => {
    const query = buildQuery({ make });
    return apiFetchRaw<CatalogVehicleModel[]>(
      `/catalog/vehicles/models/?${query}`,
    );
  };

  const getVehicleYears = async (
    make: string | number,
    model?: string | number,
  ) => {
    const query = buildQuery({ make, model });
    return apiFetchRaw<CatalogVehicleYear[]>(
      `/catalog/vehicles/years/?${query}`,
    );
  };

  const getVehicleEngines = async (
    make: string | number,
    model: string | number,
    year: number,
  ) => {
    const query = buildQuery({ make, model, year });
    return apiFetchRaw<CatalogVehicleEngine[]>(
      `/catalog/vehicles/engines/?${query}`,
    );
  };

  const getCatalogProductSuggestions = async (query: string, filters: Pick<CatalogListParams, "make" | "model" | "year" | "categories"> = {}) => {
    const normalizedQuery = query.trim();
    const endpoint = normalizedQuery
      ? `/catalog/products/suggestions/?${buildListQuery({ ...filters, q: normalizedQuery })}`
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
    getCatalogCategory,
    getCatalogCategoryRaw,
    getCatalogCategoriesRaw,
    getVehicleMakes,
    getVehicleModels,
    getVehicleYears,
    getVehicleEngines,
    getCatalogProductSuggestions,
    getCatalogProduct,
  };
};
