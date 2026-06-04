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
  make?: string | number;
  model?: string | number;
  year?: number;
  engine?: string | number;
  brand?: string | number;
  placement?: string;
  side?: string;
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

export interface CatalogBrandRef {
  id: number;
  name: string;
  slug: string;
}

export type CatalogCompatibilityMatchType =
  | "universal"
  | "engine"
  | "vehicle_year"
  | "none";

export interface CatalogProductCompatibility {
  matched: boolean;
  match_type: CatalogCompatibilityMatchType;
  notes: string;
}

export interface CatalogProductListItem {
  id: number;
  name: string;
  slug: string;
  sku: string;
  manufacturer_part_number: string;
  short_description: string;
  price: string;
  old_price: string | null;
  on_sale: boolean;
  price_available: boolean;
  purchasable: boolean;
  is_new: boolean;
  is_featured: boolean;
  is_universal_fitment: boolean;
  in_stock: boolean;
  brand: CatalogBrandRef | null;
  category: CatalogCategoryRef;
  placement: string;
  placement_label?: string;
  side: string;
  side_label?: string;
  primary_image: CatalogImageAsset;
  compatibility: CatalogProductCompatibility | null;
  seo?: SeoPayload | null;
}

export interface CatalogFacetCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface CatalogFacetBrand {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface CatalogFacetOption {
  value: string;
  label: string;
  count: number;
}

export interface CatalogFacets {
  categories: CatalogFacetCategory[];
  brands?: CatalogFacetBrand[];
  placements?: CatalogFacetOption[];
  sides?: CatalogFacetOption[];
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
  image?: CatalogImageAsset | null;
  seo?: SeoPayload | null;
}

export interface CatalogVehicleMake {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
}

export interface CatalogVehicleModel {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
  make: CatalogVehicleMake;
}

export interface CatalogVehicleEngine {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
}

export interface CatalogVehicleYear {
  year: number;
}

export interface CatalogVehicleSelection {
  make: string;
  model: string;
  year: string;
  engine: string;
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
  sku?: string;
  manufacturerPartNumber?: string;
  subtitle?: string;
  category?: string;
  brand?: string;
  placement?: string;
  side?: string;
  price: number;
  priceAvailable?: boolean;
  purchasable?: boolean;
  oldPrice?: number | null;
  image?: CatalogImageAsset | null;
  isNew?: boolean;
  inStock?: boolean;
  onSale?: boolean;
  isUniversalFitment?: boolean;
  compatibility?: CatalogProductCompatibility | null;
}

export interface CatalogProductSuggestion {
  id: number;
  slug: string;
  name: string;
  sku: string;
  manufacturer_part_number: string;
  price: string;
  price_available?: boolean;
  purchasable?: boolean;
  in_stock: boolean;
  brand: CatalogBrandRef | null;
  category: CatalogCategoryRef;
  primary_image: CatalogImageAsset;
  fitment_summary: string;
}
