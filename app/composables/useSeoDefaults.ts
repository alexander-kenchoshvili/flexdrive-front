import { storeToRefs } from "pinia";
import { useIndexingPolicy } from "~/composables/useIndexingPolicy";

const normalizeUrl = (value: string) => value.replace(/\/+$/, "");

const toAbsoluteUrl = (siteUrl: string, pathOrUrl: string) => {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const normalizedSiteUrl = normalizeUrl(siteUrl);
  const normalizedPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${normalizedSiteUrl}${normalizedPath}`;
};

export const useSeoDefaults = () => {
  const route = useRoute();
  const config = useRuntimeConfig();
  const { robots } = useIndexingPolicy();
  const siteSettingsStore = useSiteSettings();
  const { settings } = storeToRefs(siteSettingsStore);

  const siteUrl = normalizeUrl(
    String(config.public.siteUrl || "https://localhost:3000"),
  );
  const fallbackSiteName = String(config.public.siteName || "AutoMate");
  const fallbackDefaultTitle = String(
    config.public.defaultSeoTitle || fallbackSiteName,
  );
  const fallbackDefaultDescription = String(
    config.public.defaultSeoDescription ||
      "იპოვეთ ხარისხიანი ავტომობილის აქსესუარები ყოველდღიური გამოყენებისა და გაუმჯობესებისთვის.",
  );
  const fallbackDefaultImage = String(
    config.public.defaultSeoImage || "/favicon.ico",
  );

  const siteName = computed(
    () => String(settings.value?.site_name || fallbackSiteName),
  );
  const defaultTitle = computed(
    () =>
      String(
        settings.value?.default_seo_title || fallbackDefaultTitle || siteName.value,
      ),
  );
  const defaultDescription = computed(
    () =>
      String(
        settings.value?.default_seo_description || fallbackDefaultDescription,
      ),
  );
  const defaultImage = computed(
    () => String(settings.value?.default_seo_image || fallbackDefaultImage),
  );

  const canonicalUrl = computed(() => toAbsoluteUrl(siteUrl, route.path || "/"));
  const ogImageUrl = computed(() => toAbsoluteUrl(siteUrl, defaultImage.value));

  useHead(() => ({
    titleTemplate: (titleChunk) => {
      if (!titleChunk) {
        return defaultTitle.value;
      }
      return `${titleChunk} | ${siteName.value}`;
    },
    link: [{ rel: "canonical", href: canonicalUrl.value }],
    meta: [{ name: "theme-color", content: "#FF6B35" }],
  }));

  useSeoMeta({
    title: () => defaultTitle.value,
    description: () => defaultDescription.value,
    robots: () => robots.value,
    ogType: "website",
    ogSiteName: () => siteName.value,
    ogLocale: "ka_GE",
    ogTitle: () => defaultTitle.value,
    ogDescription: () => defaultDescription.value,
    ogImage: () => ogImageUrl.value,
    ogUrl: () => canonicalUrl.value,
    twitterCard: "summary_large_image",
    twitterTitle: () => defaultTitle.value,
    twitterDescription: () => defaultDescription.value,
    twitterImage: () => ogImageUrl.value,
  });
};
