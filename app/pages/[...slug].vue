<script setup lang="ts">
import { storeToRefs } from "pinia";
import { resolveCmsCollectionSeoPolicy } from "~/utils/cmsCollectionSeo";
import { useIndexingPolicy } from "~/composables/useIndexingPolicy";

definePageMeta({
  key: false,
});

const globalStore = useGlobalStore();
const { pageSeo } = storeToRefs(globalStore);
const siteSettingsStore = useSiteSettings();
const { settings } = storeToRefs(siteSettingsStore);
const route = useRoute();
const config = useRuntimeConfig();

const normalizeUrl = (value: string) => value.replace(/\/+$/, "");

const toAbsoluteUrl = (siteUrl: string, pathOrUrl: string) => {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const normalizedSiteUrl = normalizeUrl(siteUrl);
  const normalizedPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${normalizedSiteUrl}${normalizedPath}`;
};

const siteUrl = computed(() =>
  normalizeUrl(String(config.public.siteUrl || "https://localhost:3000")),
);
const hasCollectionQuery = computed(() => Object.keys(route.query || {}).length > 0);
const siteName = computed(() =>
  String(settings.value?.site_name || config.public.siteName || "AutoMate"),
);
const collectionSeoPolicy = computed(() =>
  resolveCmsCollectionSeoPolicy(route.path || "/", route.query),
);
const canonicalPath = computed(
  () => {
    if (hasCollectionQuery.value) {
      return collectionSeoPolicy.value?.canonicalPath || route.path || "/";
    }

    return pageSeo.value?.canonical || route.path || "/";
  },
);
const canonicalUrl = computed(() =>
  toAbsoluteUrl(siteUrl.value, canonicalPath.value),
);
const { robots: defaultRobots } = useIndexingPolicy({
  pageNoindex: computed(() => Boolean(pageSeo.value?.noindex)),
});
const robots = computed(() => {
  if (defaultRobots.value.startsWith("noindex")) {
    return defaultRobots.value;
  }

  return collectionSeoPolicy.value?.robots || defaultRobots.value;
});

const seoTitle = computed(() => pageSeo.value?.title || undefined);
const seoDescription = computed(() => pageSeo.value?.description || undefined);
const seoImage = computed(() => {
  const image =
    pageSeo.value?.image ||
    settings.value?.default_seo_image ||
    String(config.public.defaultSeoImage || "");
  if (!image) return undefined;
  return toAbsoluteUrl(siteUrl.value, image);
});

useHead(() => ({
  link: [{ rel: "canonical", href: canonicalUrl.value }],
}));

useSeoMeta({
  title: () => seoTitle.value,
  description: () => seoDescription.value,
  robots: () => robots.value,
  ogSiteName: () => siteName.value,
  ogUrl: () => canonicalUrl.value,
  ogTitle: () => seoTitle.value,
  ogDescription: () => seoDescription.value,
  ogImage: () => seoImage.value,
  twitterTitle: () => seoTitle.value,
  twitterDescription: () => seoDescription.value,
  twitterImage: () => seoImage.value,
});
</script>

<template>
  <ComponentsLoader />
</template>
