export const DEFAULT_SOCIAL_IMAGE = {
  path: "/images/social/flexdrive-og-modern-v1.jpg",
  width: 1200,
  height: 630,
  type: "image/jpeg",
  alt: "FlexDrive — ავტონაწილები ონლაინ",
} as const;

// The bundled banner is the common preview; only products/articles supply photos.
export const resolveSocialImage = (
  siteUrl: string,
  image?: string | null,
  alt?: string | null,
) => {
  const base = `${siteUrl.replace(/\/+$/, "")}/`;
  const fallback = new URL(DEFAULT_SOCIAL_IMAGE.path, base).href;
  let url = fallback;
  if (image?.trim()) {
    try {
      const candidate = new URL(image.trim(), base);
      if (["https:", "http:"].includes(candidate.protocol)) url = candidate.href;
    } catch { /* Keep the common preview when a saved image URL is invalid. */ }
  }
  const isDefault = url === fallback;
  return {
    url,
    width: isDefault ? DEFAULT_SOCIAL_IMAGE.width : null,
    height: isDefault ? DEFAULT_SOCIAL_IMAGE.height : null,
    type: isDefault ? DEFAULT_SOCIAL_IMAGE.type : null,
    alt: isDefault ? DEFAULT_SOCIAL_IMAGE.alt : alt?.trim() || null,
  };
};
