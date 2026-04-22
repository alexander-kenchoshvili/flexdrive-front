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
    class="rounded-[20px] border border-border-default bg-surface p-5 shadow-[0_24px_60px_-38px_var(--shadow-color)] md:p-6"
  >
    <h2 class="text-xl font-extrabold text-text-primary">მსგავსი სტატიები</h2>

    <div class="mt-5 space-y-4">
      <NuxtLink
        v-for="post in posts"
        :key="post.id"
        :to="getPostUrl(post)"
        class="group flex gap-4 rounded-[16px] border border-transparent p-2 transition-colors duration-200 hover:border-border-default hover:bg-surface-2"
      >
        <div class="relative h-20 w-20 shrink-0 overflow-hidden rounded-[14px]">
          <div
            class="absolute inset-0 bg-[linear-gradient(135deg,#ff7b2c_0%,#ff9f4b_52%,#ffc968_100%)]"
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
            class="mt-1 text-sm font-bold leading-6 text-text-primary transition-colors duration-200 group-hover:text-accent-primary"
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
