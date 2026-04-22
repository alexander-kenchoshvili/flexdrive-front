<script setup lang="ts">
import { ClockIcon } from "@heroicons/vue/24/outline";
import BasePicture from "~/components/common/BasePicture.vue";
import { sanitizeText } from "~/composables/helpers";
import { getSingleViewUrl } from "~/composables/getSingleViewUrl";
import type { BlogListItem } from "~/types/blog";
import BlogAuthorInfo from "./BlogAuthorInfo.vue";
import BlogCardMetaRow from "./BlogCardMetaRow.vue";

type BlogCardVariant = "featured" | "default";

const props = withDefaults(
  defineProps<{
    post: BlogListItem;
    variant?: BlogCardVariant;
  }>(),
  {
    variant: "default",
  },
);

const isFeatured = computed(() => props.variant === "featured");
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

const imageWrapperClasses = computed(() =>
  isFeatured.value ? "aspect-[16/10] lg:aspect-[21/9]" : "aspect-[16/10]",
);
</script>

<template>
  <NuxtLink
    :to="postUrl"
    class="blog-card-root group flex h-full flex-col overflow-hidden rounded-[20px] border border-border-default bg-surface"
  >
    <div
      class="relative overflow-hidden"
      :class="imageWrapperClasses"
    >
      <div
        class="absolute inset-0 bg-[linear-gradient(135deg,#ff7b2c_0%,#ff9f4b_52%,#ffc968_100%)]"
      />

      <BasePicture
        v-if="pictureData"
        :data="pictureData"
        :alt="sanitizeText(post.title) || categoryLabel"
        preset="blog"
        class="relative z-[1] h-full w-full transition-transform duration-500 group-hover:scale-[1.04]"
      />

      <span
        class="absolute left-4 top-4 z-[2] inline-flex min-h-8 items-center rounded-md bg-accent-primary px-3 py-1 text-xs font-bold text-text-invert"
      >
        {{ categoryLabel }}
      </span>

      <span
        v-if="readTimeLabel"
        class="absolute bottom-4 right-4 z-[2] inline-flex min-h-9 items-center gap-1.5 rounded-md bg-black/70 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm"
      >
        <ClockIcon class="h-4 w-4 shrink-0" aria-hidden="true" />
        {{ readTimeLabel }}
      </span>
    </div>

    <div class="flex flex-1 flex-col p-5 md:p-6">
      <BlogCardMetaRow :published-at="post.blog_meta?.published_at" />

      <h3
        :class="[
          'blog-card-title upper mt-4 font-bold leading-[1.35] text-text-primary transition-colors duration-200 group-hover:text-accent-primary',
          isFeatured ? 'text-[21px] lg:text-[28px]' : 'text-[21px]',
        ]"
      >
        {{ post.title }}
      </h3>

      <p
        v-if="excerpt"
        :class="[
          'blog-card-excerpt mt-4 text-text-secondary',
          isFeatured ? 'is-featured text-sm leading-6 lg:text-[17px] lg:leading-7' : 'text-sm leading-6 md:text-[15px]',
        ]"
      >
        {{ excerpt }}
      </p>

      <div
        class="mt-5 flex items-center justify-between gap-4 border-t border-border-default pt-4"
      >
        <BlogAuthorInfo
          :name="post.blog_meta?.author_name"
          :role="post.blog_meta?.author_role"
        />

        <span
          class="shrink-0 text-sm font-semibold text-accent-primary transition-transform duration-200 group-hover:translate-x-1"
        >
          სრულად
        </span>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
.blog-card-root {
  transition:
    transform 220ms ease,
    border-color 220ms ease,
    box-shadow 220ms ease;
}

@media (hover: hover) and (pointer: fine) {
  .blog-card-root:hover {
    transform: translateY(-8px);
    border-color: var(--accent-primary);
    box-shadow: 0 24px 48px -24px var(--shadow-color);
  }
}

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
  -webkit-line-clamp: 3;
  min-block-size: calc(3 * 1lh);
}

.blog-card-excerpt.is-featured {
  -webkit-line-clamp: 3;
}

@media (min-width: 1024px) {
  .blog-card-excerpt.is-featured {
    -webkit-line-clamp: 4;
  }
}
</style>
