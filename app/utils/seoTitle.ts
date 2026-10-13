const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const formatSeoTitle = (value: string | null | undefined, siteName: string) => {
  const title = String(value || "").trim();
  const brand = String(siteName || "").trim();
  if (!brand) return title;
  if (!title) return brand;

  const escaped = escapeRegex(brand);
  const suffix = new RegExp(`(?:\\s*[|–—-]\\s*${escaped})+$`, "i");
  const base = title.replace(suffix, "").trim();
  if (!base) return brand;

  const existing = new RegExp(`(^|[^\\p{L}\\p{N}_])${escaped}(?=$|[^\\p{L}\\p{N}_])`, "iu");
  return existing.test(base) ? base : `${base} | ${brand}`;
};
