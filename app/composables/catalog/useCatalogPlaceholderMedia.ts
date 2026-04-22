import type { CatalogImageAsset, CatalogProductImage } from "~/types/catalog";

const sharedCardPlaceholder: CatalogImageAsset = {
  desktop: "/images/catalog/fallback-product.jpg",
  tablet: "/images/catalog/fallback-product.jpg",
  mobile: "/images/catalog/fallback-product.jpg",
};

const sharedGalleryPlaceholders: CatalogProductImage[] = [
  {
    id: -1,
    alt_text: "Catalog gallery placeholder 1",
    is_primary: true,
    sort_order: 0,
    image: {
      desktop: "/images/catalog/fallback-1.jpg",
      tablet: "/images/catalog/fallback-1.jpg",
      mobile: "/images/catalog/fallback-1.jpg",
    },
  },
  {
    id: -2,
    alt_text: "Catalog gallery placeholder 2",
    is_primary: false,
    sort_order: 1,
    image: {
      desktop: "/images/catalog/fallback-2.jpg",
      tablet: "/images/catalog/fallback-2.jpg",
      mobile: "/images/catalog/fallback-2.jpg",
    },
  },
  {
    id: -3,
    alt_text: "Catalog gallery placeholder 3",
    is_primary: false,
    sort_order: 2,
    image: {
      desktop: "/images/catalog/fallback-3.jpg",
      tablet: "/images/catalog/fallback-3.jpg",
      mobile: "/images/catalog/fallback-3.jpg",
    },
  },
];

export const useCatalogPlaceholderMedia = () => ({
  cardPlaceholderImage: sharedCardPlaceholder,
  galleryPlaceholderImages: sharedGalleryPlaceholders,
});
