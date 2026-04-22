import type { BlogMetaData, ContentItemData } from "./page";

export type BlogPlacement = "home" | "list";
export type BlogSort = "newest" | "oldest" | "read_time_asc" | "read_time_desc";
export type BlogOrdering = BlogSort | "featured";

export interface BlogListParams {
  placement?: BlogPlacement;
  page?: number;
  category?: string;
  search?: string;
  ordering?: BlogSort;
  tag?: string;
}

export type BlogListItem = ContentItemData & {
  blog_meta?: BlogMetaData | null;
};

export interface BlogCategoryFacet {
  name: string;
  count: number;
}

export interface BlogListFilters {
  category: string | null;
  search: string | null;
  tag: string | null;
}

export interface BlogListFacets {
  categories: BlogCategoryFacet[];
}

export interface BlogListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  current_page: number;
  total_pages: number;
  page_size: number;
  placement: BlogPlacement;
  ordering: BlogOrdering;
  filters: BlogListFilters;
  facets: BlogListFacets;
  results: BlogListItem[];
}
