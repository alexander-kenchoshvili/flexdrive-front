import type { CatalogProductDetail } from "~/types/catalog";

export const productSchemaImage = (product: CatalogProductDetail | null | undefined) => {
  const images = [...(product?.images ?? [])].sort(
    (left, right) => Number(right.is_primary) - Number(left.is_primary),
  );
  const candidates = [
    product?.seo?.image,
    product?.primary_image?.desktop, product?.primary_image?.tablet, product?.primary_image?.mobile,
    ...images.flatMap((image) => [image.image.desktop, image.image.tablet, image.image.mobile]),
  ];
  return candidates.find((candidate) => {
    if (!candidate?.trim()) return false;
    try {
      return new URL(candidate, "https://placeholder.invalid").pathname !== "/images/catalog/fallback-product.png";
    } catch { return false; }
  })?.trim();
};
