<script setup lang="ts">
import { storeToRefs } from "pinia";
import AppBreadcrumbs from "~/components/common/AppBreadcrumbs.vue";
import { sanitizeText } from "~/composables/helpers";
import { useSiteSettings } from "~/stores/useSiteSettings";
import type {
  ContentItemData,
  ImageAsset,
  SmartComponentRenderData,
} from "~/types/page";
import {
  buildArticleStructuredData,
  buildBreadcrumbStructuredData,
} from "~/utils/structuredData";
import BaseRichText from "~/components/common/BaseRichText.vue";
import BlogAuthorBox from "./parts/BlogAuthorBox.vue";
import BlogInnerHeader from "./parts/BlogInnerHeader.vue";
import BlogRelatedPosts from "./parts/BlogRelatedPosts.vue";
import BlogShareRow from "./parts/BlogShareRow.vue";

type BlogInnerData = SmartComponentRenderData & Partial<ContentItemData>;

const props = defineProps<{
  data?: BlogInnerData;
}>();

const route = useRoute();
const config = useRuntimeConfig();
const siteSettingsStore = useSiteSettings();
const { settings } = storeToRefs(siteSettingsStore);

const article = computed(() => props.data ?? ({} as BlogInnerData));
const articleTitle = computed(
  () => sanitizeText(article.value.title) || "ბლოგი",
);
const articleExcerpt = computed(
  () =>
    sanitizeText(article.value.blog_meta?.excerpt) ||
    sanitizeText(article.value.description),
);
const articleCategory = computed(
  () => sanitizeText(article.value.blog_meta?.category) || "ბლოგი",
);
const authorName = computed(
  () => sanitizeText(article.value.blog_meta?.author_name) || "AutoMate",
);
const authorRole = computed(
  () => sanitizeText(article.value.blog_meta?.author_role) || "რედაქცია",
);
const relatedPosts = computed<ContentItemData[]>(
  () => article.value.related_posts ?? [],
);
const hasRelatedPosts = computed(() => relatedPosts.value.length > 0);

const heroImage = computed<ImageAsset | null>(() => {
  const coverImage = article.value.blog_meta?.cover_image;

  if (coverImage?.desktop || coverImage?.tablet || coverImage?.mobile) {
    return coverImage;
  }

  const teaserImage = article.value.blog_meta?.teaser_image;
  if (teaserImage?.desktop || teaserImage?.tablet || teaserImage?.mobile) {
    return teaserImage;
  }

  const image = article.value.image;
  if (image?.desktop || image?.tablet || image?.mobile) {
    return image;
  }

  return null;
});

const siteUrl = computed(() =>
  String(config.public.siteUrl || "https://localhost:3000").replace(/\/+$/, ""),
);
const shareUrl = computed(() => `${siteUrl.value}${route.path || ""}`);
const siteName = computed(
  () => settings.value?.site_name || config.public.siteName || "AutoMate",
);
const publisherImage = computed(
  () =>
    settings.value?.default_seo_image || config.public.defaultSeoImage || null,
);
const heroImageUrl = computed(
  () =>
    heroImage.value?.desktop ||
    heroImage.value?.tablet ||
    heroImage.value?.mobile ||
    null,
);

const breadcrumbItems = computed(() => [
  { label: "მთავარი", to: "/" },
  { label: "ბლოგი", to: "/blogs" },
  { label: articleTitle.value },
]);
const breadcrumbSchema = computed(() =>
  buildBreadcrumbStructuredData({
    items: breadcrumbItems.value,
    siteUrl: siteUrl.value,
    currentPath: route.path || "/blogs",
  }),
);
const articleSchema = computed(() =>
  buildArticleStructuredData({
    siteUrl: siteUrl.value,
    url: route.path || "/blogs",
    headline: articleTitle.value,
    description: articleExcerpt.value,
    image: heroImageUrl.value,
    datePublished: article.value.blog_meta?.published_at || null,
    dateModified:
      article.value.updated_at || article.value.blog_meta?.published_at || null,
    authorName: authorName.value,
    articleSection: articleCategory.value,
    publisherName: siteName.value,
    publisherImage: publisherImage.value,
  }),
);

useHead(() => ({
  script: [
    ...(breadcrumbSchema.value
      ? [
          {
            key: "blog-inner-breadcrumb-schema",
            type: "application/ld+json",
            children: JSON.stringify(breadcrumbSchema.value),
          },
        ]
      : []),
    ...(articleSchema.value
      ? [
          {
            key: "article-schema",
            type: "application/ld+json",
            children: JSON.stringify(articleSchema.value),
          },
        ]
      : []),
  ],
}));
</script>

<template>
  <section class="py-8 md:py-10">
    <div class="container-fluid">
      <AppBreadcrumbs :items="breadcrumbItems" />

      <div
        class="mt-6 grid gap-8 lg:items-start"
        :class="
          hasRelatedPosts
            ? 'lg:grid-cols-[minmax(0,1fr)_320px]'
            : 'lg:grid-cols-1'
        "
      >
        <article
          class="overflow-hidden rounded-[24px] border border-border-default bg-surface shadow-[0_24px_60px_-38px_var(--shadow-color)]"
        >
          <BlogInnerHeader
            :title="articleTitle"
            :category="articleCategory"
            :excerpt="articleExcerpt"
            :published-at="article.blog_meta?.published_at"
            :read-time-minutes="article.blog_meta?.read_time_minutes"
            :author-name="authorName"
            :author-role="authorRole"
            :image="heroImage"
          />

          <div class="px-5 pb-8 pt-8 md:px-8 md:pb-10 lg:px-12 lg:pb-12">
            <BaseRichText
              :html="article.editor"
              empty-text="სტატიის ტექსტი ჯერ არ არის დამატებული."
            />

            <BlogShareRow class="mt-10" :title="articleTitle" :url="shareUrl" />

            <BlogAuthorBox
              class="mt-10"
              :name="authorName"
              :role="authorRole"
            />
          </div>
        </article>

        <aside v-if="hasRelatedPosts" class="lg:sticky lg:top-40 lg:self-start">
          <BlogRelatedPosts :posts="relatedPosts" />
        </aside>
      </div>
    </div>
  </section>
</template>
