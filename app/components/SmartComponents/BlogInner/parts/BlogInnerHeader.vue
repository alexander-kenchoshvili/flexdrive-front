<script setup lang="ts">
import { CalendarDaysIcon, ClockIcon } from "@heroicons/vue/24/outline";
import BasePicture from "~/components/common/BasePicture.vue";
import { sanitizeText } from "~/composables/helpers";
import type { ImageAsset } from "~/types/page";
import BlogAuthorInfo from "../../BlogSection/parts/BlogAuthorInfo.vue";
import { formatGeorgianDate } from "~/composables/formatGeorgianDate";

const props = defineProps<{
  title: string;
  category?: string | null;
  excerpt?: string | null;
  publishedAt?: string | null;
  readTimeMinutes?: number | null;
  authorName?: string | null;
  authorRole?: string | null;
  image?: ImageAsset | null;
}>();


const categoryLabel = computed(() => sanitizeText(props.category));
const excerptText = computed(() => sanitizeText(props.excerpt));
const formattedDate = computed(() => formatGeorgianDate(props.publishedAt));
const readTimeLabel = computed(() => {
  if (typeof props.readTimeMinutes !== "number" || props.readTimeMinutes <= 0) {
    return "";
  }

  return `${props.readTimeMinutes} წუთი`;
});
const hasHeroImage = computed(
  () => Boolean(props.image?.desktop || props.image?.tablet || props.image?.mobile),
);
</script>

<template>
  <header class="border-b border-border-default">
    <div class="relative aspect-[16/9] overflow-hidden md:aspect-[21/10]">
      <div
        class="absolute inset-0 border-b border-border-default bg-surface-2"
      />

      <BasePicture
        v-if="hasHeroImage"
        :data="image"
        :alt="title"
        class="relative z-[1] h-full w-full"
        fetchpriority="high"
        preset="hero"
      />
    </div>

    <div class="px-4 py-5 sm:px-5 sm:py-6 md:px-7 lg:px-9">
      <span
        v-if="categoryLabel"
        class="inline-flex min-h-8 items-center rounded-md border border-accent-primary/25 bg-accent-primary/10 px-3 py-1 text-xs font-bold text-accent-primary"
      >
        {{ categoryLabel }}
      </span>

      <h1
        class="title-under-xs mt-3 text-[25px] font-extrabold leading-[1.18] text-text-primary sm:text-[30px] md:text-[36px] lg:text-[40px]"
      >
        {{ title }}
      </h1>

      <div
        class="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
      >
        <BlogAuthorInfo
          :name="authorName"
          :role="authorRole"
        />

        <div class="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-text-muted">
          <div v-if="formattedDate" class="flex items-center gap-2">
            <CalendarDaysIcon class="h-4 w-4 shrink-0 text-accent-primary" aria-hidden="true" />
            <span>{{ formattedDate }}</span>
          </div>

          <div v-if="readTimeLabel" class="flex items-center gap-2">
            <ClockIcon class="h-4 w-4 shrink-0 text-accent-primary" aria-hidden="true" />
            <span>{{ readTimeLabel }}</span>
          </div>
        </div>
      </div>

      <p
        v-if="excerptText"
        class="subtitle-under-xs mt-4 max-w-3xl text-[14px] leading-6 text-text-secondary sm:text-base sm:leading-7"
      >
        {{ excerptText }}
      </p>
    </div>
  </header>
</template>
