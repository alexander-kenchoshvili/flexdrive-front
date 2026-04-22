export interface ImageAsset {
  desktop: string | null;
  mobile: string | null;
  tablet?: string | null;
}

export interface BlogMetaData {
  excerpt: string | null;
  read_time_minutes: number | null;
  author_name: string | null;
  author_role: string | null;
  category: string | null;
  tags: string[];
  status: string | null;
  published_at: string | null;
  is_featured: boolean;
  teaser_image: ImageAsset;
  cover_image: ImageAsset;
}

export interface SmartComponentConf {
  unicId: string;
  enabled: "0" | "1";
  componentName: string;
  useHeader: string;
  listLayout: string;
  singleLayout: string;
}

export interface CatalogCategoryLink {
  id: number;
  name: string;
  slug: string;
}

export interface ContentItemData {
  id: number;
  title: string | null;
  description: string | null;
  image: ImageAsset;
  slug: string | null;
  singlePageRoute: number | null;
  content_type: string | null;
  position?: number | null;
  icon_svg?: string | null;
  catalog_category?: CatalogCategoryLink | null;
  editor: string | null;
  created_at: string | null;
  blog_meta?: BlogMetaData | null;
  related_posts?: ContentItemData[] | null;
}

export interface ContentData {
  id: number;
  name: string;
  listcount: number;
  list: ContentItemData[];
}

export interface SmartComponentData {
  title?: string | null;
  subtitle?: string | null;
  buttonText?: string | null;
  image?: ImageAsset | null;
  contentData?: ContentData | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface HeroSectionData extends SmartComponentData {
  title: string | null;
  subtitle: string | null;
  buttonText: string | null;
  image: ImageAsset | null;
}

export interface SmartComponentPayload {
  conf: SmartComponentConf;
  data: SmartComponentData;
}

export type ComponentsMap = Record<string, SmartComponentPayload>;

export type SmartComponentRenderData = SmartComponentData & {
  conf: SmartComponentConf;
};

export interface SeoPayload {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  noindex?: boolean;
   canonical?: string | null;
}

export interface CurrentContentResponse {
  secondary: ComponentsMap;
  seo: SeoPayload;
  canonical_path?: string | null;
}
