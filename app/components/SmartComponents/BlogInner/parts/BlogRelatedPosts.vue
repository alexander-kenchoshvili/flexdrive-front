<script setup lang="ts">
import { ClockIcon } from "@heroicons/vue/24/outline";
import BasePicture from "~/components/common/BasePicture.vue";
import { formatGeorgianDate } from "~/composables/formatGeorgianDate";
import { sanitizeText } from "~/composables/helpers";
import { getSingleViewUrl } from "~/composables/getSingleViewUrl";
import type { ContentItemData, ImageAsset } from "~/types/page";

const props = defineProps<{
  posts: ContentItemData[];
}>();

const getPostUrl = (post: ContentItemData) => getSingleViewUrl(post);

const getPostImage = (post: ContentItemData): ImageAsset | null => {
  const teaserImage = post.blog_meta?.teaser_image;
  if (teaserImage?.desktop || teaserImage?.tablet || teaserImage?.mobile) {
    return teaserImage;
  }

  if (post.image?.desktop || post.image?.tablet || post.image?.mobile) {
    return post.image;
  }

  return null;
};

const getReadTimeLabel = (post: ContentItemData) => {
  const value = post.blog_meta?.read_time_minutes;
  if (typeof value !== "number" || value <= 0) return "";
  return `${value} წუთი`;
};
</script>

<template>
  <section
    class="rounded-lg border border-border-default bg-surface p-4 shadow-[0_18px_44px_-38px_var(--shadow-color)] md:p-5"
  >
    <h2 class="text-[18px] font-extrabold leading-7 text-text-primary">
      მსგავსი სტატიები
    </h2>

    <div class="mt-4 space-y-3">
      <NuxtLink
        v-for="post in posts"
        :key="post.id"
        :to="getPostUrl(post)"
        class="group flex gap-3 rounded-lg border border-transparent p-2 transition-colors duration-200 hover:border-border-default hover:bg-surface-2"
      >
        <div class="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-border-default bg-surface-2">
          <div
            class="absolute inset-0 bg-surface-2"
          />

          <BasePicture
            v-if="getPostImage(post)"
            :data="getPostImage(post)"
            :alt="sanitizeText(post.title) || 'Blog post'"
            class="relative z-[1] h-full w-full"
            preset="thumb"
            lazy
          />
        </div>

        <div class="min-w-0 flex-1">
          <p
            v-if="post.blog_meta?.category"
            class="text-xs font-semibold uppercase tracking-[0.08em] text-accent-primary"
          >
            {{ post.blog_meta?.category }}
          </p>

          <h3
            class="mt-1 text-[14px] font-bold leading-[22px] text-text-primary transition-colors duration-200 group-hover:text-accent-primary"
          >
            {{ post.title }}
          </h3>

          <div
            class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted"
          >
            <span v-if="post.blog_meta?.published_at">
              {{ formatGeorgianDate(post.blog_meta?.published_at) }}
            </span>

            <span
              v-if="getReadTimeLabel(post)"
              class="inline-flex items-center gap-1"
            >
              <ClockIcon
                class="h-3.5 w-3.5 shrink-0 text-accent-primary"
                aria-hidden="true"
              />
              {{ getReadTimeLabel(post) }}
            </span>
          </div>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>
