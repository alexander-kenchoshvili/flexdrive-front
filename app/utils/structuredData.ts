type BreadcrumbStructuredDataItem = {
  label?: string | null;
  to?: string | null;
};

type OrganizationStructuredDataInput = {
  siteUrl: string;
  name: string;
  description?: string | null;
  image?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  sameAs?: Array<string | null | undefined>;
};

type BreadcrumbStructuredDataInput = {
  items: BreadcrumbStructuredDataItem[];
  siteUrl: string;
  currentPath?: string | null;
};

type ProductStructuredDataInput = {
  siteUrl: string;
  url: string;
  name: string;
  description?: string | null;
  image?: string | null;
  sku?: string | null;
  price?: number | null;
  currency?: string | null;
  inStock?: boolean | null;
  brandName?: string | null;
  category?: string | null;
};

type ArticleStructuredDataInput = {
  siteUrl: string;
  url: string;
  headline: string;
  description?: string | null;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  authorName?: string | null;
  articleSection?: string | null;
  publisherName?: string | null;
  publisherImage?: string | null;
};

const normalizeUrl = (value: string) => value.replace(/\/+$/, "");

export const toAbsoluteStructuredDataUrl = (
  siteUrl: string,
  pathOrUrl?: string | null,
) => {
  const rawValue = String(pathOrUrl || "").trim();
  if (!rawValue) return null;
  if (/^https?:\/\//i.test(rawValue)) {
    return rawValue;
  }

  const normalizedSiteUrl = normalizeUrl(siteUrl);
  const normalizedPath = rawValue.startsWith("/") ? rawValue : `/${rawValue}`;
  return `${normalizedSiteUrl}${normalizedPath}`;
};

export const buildOrganizationStructuredData = ({
  siteUrl,
  name,
  description,
  image,
  email,
  phone,
  city,
  sameAs = [],
}: OrganizationStructuredDataInput) => {
  const organization: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url: normalizeUrl(siteUrl),
  };

  if (description) {
    organization.description = description;
  }

  const absoluteImage = toAbsoluteStructuredDataUrl(siteUrl, image);
  if (absoluteImage) {
    organization.logo = absoluteImage;
    organization.image = absoluteImage;
  }

  const normalizedSameAs = sameAs.filter(
    (value): value is string => Boolean(String(value || "").trim()),
  );
  if (normalizedSameAs.length) {
    organization.sameAs = normalizedSameAs;
  }

  if (email || phone) {
    organization.contactPoint = [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        ...(email ? { email } : {}),
        ...(phone ? { telephone: phone } : {}),
      },
    ];
  }

  if (city) {
    organization.address = {
      "@type": "PostalAddress",
      addressLocality: city,
    };
  }

  return organization;
};

export const buildBreadcrumbStructuredData = ({
  items,
  siteUrl,
  currentPath,
}: BreadcrumbStructuredDataInput) => {
  const normalizedItems = items.filter((item) =>
    Boolean(String(item.label || "").trim()),
  );

  if (!normalizedItems.length) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: normalizedItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: String(item.label || "").trim(),
      item: toAbsoluteStructuredDataUrl(siteUrl, item.to || currentPath || "/"),
    })),
  };
};

export const buildProductStructuredData = ({
  siteUrl,
  url,
  name,
  description,
  image,
  sku,
  price,
  currency,
  inStock,
  brandName,
  category,
}: ProductStructuredDataInput) => {
  const product: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    url: toAbsoluteStructuredDataUrl(siteUrl, url),
  };

  if (description) {
    product.description = description;
  }

  const absoluteImage = toAbsoluteStructuredDataUrl(siteUrl, image);
  if (absoluteImage) {
    product.image = [absoluteImage];
  }

  if (sku) {
    product.sku = sku;
  }

  if (brandName) {
    product.brand = {
      "@type": "Brand",
      name: brandName,
    };
  }

  if (category) {
    product.category = category;
  }

  if (typeof price === "number" && Number.isFinite(price)) {
    product.offers = {
      "@type": "Offer",
      url: toAbsoluteStructuredDataUrl(siteUrl, url),
      priceCurrency: currency || "GEL",
      price: price.toFixed(2),
      availability:
        inStock === false
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
    };
  }

  return product;
};

export const buildArticleStructuredData = ({
  siteUrl,
  url,
  headline,
  description,
  image,
  datePublished,
  dateModified,
  authorName,
  articleSection,
  publisherName,
  publisherImage,
}: ArticleStructuredDataInput) => {
  const article: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    mainEntityOfPage: toAbsoluteStructuredDataUrl(siteUrl, url),
    url: toAbsoluteStructuredDataUrl(siteUrl, url),
  };

  if (description) {
    article.description = description;
  }

  const absoluteImage = toAbsoluteStructuredDataUrl(siteUrl, image);
  if (absoluteImage) {
    article.image = [absoluteImage];
  }

  if (datePublished) {
    article.datePublished = datePublished;
  }

  if (dateModified) {
    article.dateModified = dateModified;
  }

  if (authorName) {
    article.author = {
      "@type": "Person",
      name: authorName,
    };
  }

  if (articleSection) {
    article.articleSection = articleSection;
  }

  if (publisherName) {
    article.publisher = {
      "@type": "Organization",
      name: publisherName,
      ...(toAbsoluteStructuredDataUrl(siteUrl, publisherImage)
        ? {
            logo: {
              "@type": "ImageObject",
              url: toAbsoluteStructuredDataUrl(siteUrl, publisherImage),
            },
          }
        : {}),
    };
  }

  return article;
};
