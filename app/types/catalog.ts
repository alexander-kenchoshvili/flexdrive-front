import type { SeoPayload } from "./page";

export type CatalogSort =
  | "recommended"
  | "newest"
  | "oldest"
  | "price_asc"
  | "price_desc"
  | "name_asc"
  | "name_desc";

export interface CatalogListParams {
  page?: number;
  page_size?: number;
  q?: string;
  category?: string | number;
  min_price?: number;
  max_price?: number;
  is_new?: boolean;
  is_featured?: boolean;
  in_stock?: boolean;
  on_sale?: boolean;
  ordering?: CatalogSort;
}

export interface CatalogImageAsset {
  desktop: string | null;
  tablet: string | null;
  mobile: string | null;
  alt_text?: string;
}

export interface CatalogCategoryRef {
  id: number;
  name: string;
  slug: string;
}

export interface CatalogProductListItem {
  id: number;
  name: string;
  slug: string;
  short_description: string;
  price: string;
  old_price: string | null;
  on_sale: boolean;
  is_new: boolean;
  is_featured: boolean;
  in_stock: boolean;
  category: CatalogCategoryRef;
  primary_image: CatalogImageAsset;
  seo?: SeoPayload | null;
}

export interface CatalogFacetCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface CatalogFacets {
  categories: CatalogFacetCategory[];
  price: {
    min: string | null;
    max: string | null;
  };
}

export interface CatalogListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  current_page: number;
  total_pages: number;
  page_size: number;
  results: CatalogProductListItem[];
  facets: CatalogFacets;
}

export interface CatalogCategoryItem {
  id: number;
  name: string;
  slug: string;
  parent: number | null;
  sort_order: number;
  product_count: number;
  seo?: SeoPayload | null;
}

export interface CatalogProductSpec {
  key: string;
  value: string;
  sort_order: number;
}

export interface CatalogProductImage {
  id: number;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
  image: CatalogImageAsset;
}

export interface CatalogProductDetail extends CatalogProductListItem {
  description: string;
  sku: string;
  stock_qty: number;
  status: string;
  images: CatalogProductImage[];
  specs: CatalogProductSpec[];
  related_products: CatalogProductListItem[];
  created_at: string;
  updated_at: string;
  seo?: SeoPayload | null;
}

export interface CatalogFilterCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface CatalogProductCardData {
  id: number;
  slug: string;
  name: string;
  subtitle?: string;
  category?: string;
  price: number;
  oldPrice?: number | null;
  image?: CatalogImageAsset | null;
  isNew?: boolean;
  inStock?: boolean;
  onSale?: boolean;
}

export interface CatalogProductSuggestion {
  id: number;
  slug: string;
  name: string;
  price: string;
  in_stock: boolean;
  category: CatalogCategoryRef;
  primary_image: CatalogImageAsset;
}
