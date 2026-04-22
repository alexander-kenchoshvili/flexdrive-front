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


const categoryLabel = computed(() => sanitizeText(props.category) || "ბლოგი");
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
    <div class="relative aspect-[16/10] overflow-hidden md:aspect-[21/10]">
      <div
        class="absolute inset-0 bg-[linear-gradient(135deg,#ff7b2c_0%,#ff9f4b_52%,#ffc968_100%)]"
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

    <div class="px-5 py-8 md:px-8 md:py-10 lg:px-12">
      <span
        class="inline-flex min-h-9 items-center rounded-md bg-accent-primary px-3.5 py-1.5 text-xs font-bold text-text-invert"
      >
        {{ categoryLabel }}
      </span>

      <h1
        class="title-under-xs mt-5 text-[30px] font-extrabold leading-[1.18] text-text-primary md:text-[38px] lg:text-[46px]"
      >
        {{ title }}
      </h1>

      <div
        class="mt-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"
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
        class="subtitle-under-xs mt-6 max-w-3xl text-base leading-7 text-text-secondary lg:text-[17px]"
      >
        {{ excerptText }}
      </p>
    </div>
  </header>
</template>
