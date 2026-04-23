export type CloudinaryImagePreset =
  | "default"
  | "hero"
  | "card"
  | "detail"
  | "thumb"
  | "search"
  | "blog";

export type CloudinaryImageWidths = {
  mobile: number;
  tablet: number;
  desktop: number;
};

const CLOUDINARY_HOSTNAME = "res.cloudinary.com";

const PRESET_WIDTHS: Record<CloudinaryImagePreset, CloudinaryImageWidths> = {
  default: {
    mobile: 640,
    tablet: 960,
    desktop: 1440,
  },
  hero: {
    mobile: 640,
    tablet: 960,
    desktop: 1440,
  },
  card: {
    mobile: 420,
    tablet: 520,
    desktop: 640,
  },
  detail: {
    mobile: 720,
    tablet: 1080,
    desktop: 1440,
  },
  thumb: {
    mobile: 160,
    tablet: 200,
    desktop: 240,
  },
  search: {
    mobile: 160,
    tablet: 160,
    desktop: 160,
  },
  blog: {
    mobile: 640,
    tablet: 960,
    desktop: 1440,
  },
};

const buildCloudinaryTransform = (width: number) =>
  [`f_auto`, `q_auto`, `c_limit`, `w_${width}`].join(",");

export const isCloudinaryAssetUrl = (source: string | null | undefined) => {
  if (!source) return false;

  try {
    const parsed = new URL(source);
    return parsed.hostname === CLOUDINARY_HOSTNAME;
  } catch {
    return false;
  }
};

export const getCloudinaryPresetWidths = (
  preset: CloudinaryImagePreset,
  overrides?: Partial<CloudinaryImageWidths>,
): CloudinaryImageWidths => ({
  ...PRESET_WIDTHS[preset],
  ...overrides,
});

export const buildOptimizedCloudinaryUrl = (
  source: string | null | undefined,
  width: number,
) => {
  if (!source || !isCloudinaryAssetUrl(source)) {
    return source || "";
  }

  try {
    const parsed = new URL(source);
    const marker = "/upload/";
    const uploadIndex = parsed.pathname.indexOf(marker);

    if (uploadIndex === -1) {
      return source;
    }

    const prefix = parsed.pathname.slice(0, uploadIndex + marker.length);
    const suffix = parsed.pathname.slice(uploadIndex + marker.length);

    parsed.pathname = `${prefix}${buildCloudinaryTransform(width)}/${suffix}`;

    return parsed.toString();
  } catch {
    return source;
  }
};
