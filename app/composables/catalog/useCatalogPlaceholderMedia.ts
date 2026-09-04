import type { CatalogImageAsset, CatalogProductImage } from "~/types/catalog";

const sharedCardPlaceholder: CatalogImageAsset = {
  desktop: "/images/catalog/fallback-product.png",
  tablet: "/images/catalog/fallback-product.png",
  mobile: "/images/catalog/fallback-product.png",
};

const sharedGalleryPlaceholders: CatalogProductImage[] = [
  {
    id: -1,
    alt_text: "Catalog product placeholder",
    is_primary: true,
    sort_order: 0,
    image: sharedCardPlaceholder,
  },
];

export const useCatalogPlaceholderMedia = () => ({
  cardPlaceholderImage: sharedCardPlaceholder,
  galleryPlaceholderImages: sharedGalleryPlaceholders,
});
