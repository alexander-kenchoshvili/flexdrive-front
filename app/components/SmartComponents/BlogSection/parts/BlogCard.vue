<script setup lang="ts">
import { ClockIcon } from "@heroicons/vue/24/outline";
import BasePicture from "~/components/common/BasePicture.vue";
import { sanitizeText } from "~/composables/helpers";
import { getSingleViewUrl } from "~/composables/getSingleViewUrl";
import type { BlogListItem } from "~/types/blog";
import BlogAuthorInfo from "./BlogAuthorInfo.vue";
import BlogCardMetaRow from "./BlogCardMetaRow.vue";

const props = defineProps<{
  post: BlogListItem;
}>();

const postUrl = computed(() => getSingleViewUrl(props.post));

const categoryLabel = computed(
  () => sanitizeText(props.post.blog_meta?.category) || "ბლოგი",
);

const excerpt = computed(
  () =>
    sanitizeText(props.post.blog_meta?.excerpt) ||
    sanitizeText(props.post.description),
);

const readTimeLabel = computed(() => {
  const readTime = props.post.blog_meta?.read_time_minutes;
  if (typeof readTime !== "number" || readTime <= 0) return "";
  return `${readTime} წთ`;
});

const pictureData = computed(() => {
  const teaserImage = props.post.blog_meta?.teaser_image;
  const image = teaserImage?.desktop || teaserImage?.tablet || teaserImage?.mobile
    ? teaserImage
    : props.post.image;
  if (!image) return null;

  if (!image.desktop && !image.tablet && !image.mobile) {
    return null;
  }

  return image;
});
</script>

<template>
  <NuxtLink
    :to="postUrl"
    class="group flex h-full flex-col overflow-hidden rounded-lg border border-border-default bg-surface transition-colors duration-200 hover:border-accent-primary"
  >
    <div class="relative aspect-[16/9] overflow-hidden">
      <div
        class="absolute inset-0 bg-surface-2"
      />

      <BasePicture
        v-if="pictureData"
        :data="pictureData"
        :alt="sanitizeText(post.title) || categoryLabel"
        preset="blog"
        class="relative z-[1] h-full w-full transition-transform duration-500 group-hover:scale-[1.04]"
      />

      <span
        class="absolute left-3 top-3 z-[2] inline-flex min-h-7 items-center rounded-md bg-accent-primary px-2.5 py-1 text-[11px] font-bold text-text-invert"
      >
        {{ categoryLabel }}
      </span>

      <span
        v-if="readTimeLabel"
        class="absolute bottom-3 right-3 z-[2] inline-flex min-h-8 items-center gap-1.5 rounded-md bg-black/70 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm"
      >
        <ClockIcon class="h-4 w-4 shrink-0" aria-hidden="true" />
        {{ readTimeLabel }}
      </span>
    </div>

    <div class="flex flex-1 flex-col p-4">
      <BlogCardMetaRow :published-at="post.blog_meta?.published_at" />

      <h3
        class="blog-card-title upper mt-3 text-[16px] font-bold leading-[1.42] text-text-primary transition-colors duration-200 group-hover:text-accent-primary"
      >
        {{ post.title }}
      </h3>

      <p
        v-if="excerpt"
        class="blog-card-excerpt mt-2 pb-1 text-[13px] leading-5 text-text-secondary"
      >
        {{ excerpt }}
      </p>

      <div class="mt-auto border-t border-border-default pt-3">
        <BlogAuthorInfo
          :name="post.blog_meta?.author_name"
          :role="post.blog_meta?.author_role"
        />
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
.blog-card-title,
.blog-card-excerpt {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
}

.blog-card-title {
  -webkit-line-clamp: 2;
  min-block-size: calc(2 * 1lh);
}

.blog-card-excerpt {
  -webkit-line-clamp: 2;
  min-block-size: calc(2 * 1lh);
}
</style>
