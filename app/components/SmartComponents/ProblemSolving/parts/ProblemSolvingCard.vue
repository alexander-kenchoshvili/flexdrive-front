<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";

import BaseButton from "~/components/common/BaseButton.vue";
import { sanitizeText } from "~/composables/helpers";
import type { CatalogCategoryLink } from "~/types/page";
import { buildCatalogCategoryPath } from "~/utils/routePaths";

type ProblemSolvingCardData = {
  id: number;
  title: string;
  description: string;
  iconSvg: string;
  position: number;
  category: CatalogCategoryLink | null | undefined;
};

const props = defineProps<{
  item: ProblemSolvingCardData;
  index: number;
}>();

const numberLabel = computed(() => String(props.index + 1).padStart(2, "0"));
const title = computed(() => sanitizeText(props.item.title));
const description = computed(() => sanitizeText(props.item.description));
const category = computed(() => props.item.category ?? null);
const destination = computed<RouteLocationRaw | null>(() => {
  const categorySlug = category.value?.slug;
  if (!categorySlug) return null;

  return buildCatalogCategoryPath(categorySlug);
});
const linkLabel = computed(() => {
  const titleValue = title.value || "კატეგორია";
  const categoryName = sanitizeText(category.value?.name);
  if (categoryName) {
    return `${titleValue} - გადადი ${categoryName} კატეგორიაზე`;
  }
  return `${titleValue} - გადადი კატალოგზე`;
});
</script>

<template>
  <article
    :class="[
      'group relative overflow-hidden rounded-[20px] border bg-surface p-5 shadow-[0_20px_48px_-40px_var(--shadow-color)] transition-all duration-200 transform-gpu will-change-transform md:p-6',
      destination
        ? 'cursor-pointer border-border-default hover:-translate-y-1 hover:border-accent-primary hover:shadow-[0_28px_60px_-38px_var(--shadow-color)] focus-within:-translate-y-1 focus-within:border-accent-primary focus-within:shadow-[0_28px_60px_-38px_var(--shadow-color)]'
        : 'border-border-default/80',
    ]"
  >
    <NuxtLink
      v-if="destination"
      :to="destination"
      :aria-label="linkLabel"
      class="absolute inset-0 z-30 rounded-[20px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
    />

    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,107,53,0.12),transparent_48%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
    />

    <span
      class="absolute right-5 top-5 text-[11px] font-bold tracking-[0.18em] text-border-muted transition-colors duration-200 group-hover:text-accent-primary/40 group-focus-within:text-accent-primary/40 md:right-6 md:top-6"
    >
      {{ numberLabel }}
    </span>

    <div class="relative z-20 flex min-h-full gap-4 md:flex-col">
      <span
        class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border-default bg-surface-2 text-accent-primary transition-colors duration-200 group-hover:border-accent-primary/30 group-hover:bg-[#fff1ea] group-focus-within:border-accent-primary/30 group-focus-within:bg-[#fff1ea] dark:group-hover:bg-surface-2 dark:group-focus-within:bg-surface-2"
      >
        <span
          v-if="item.iconSvg"
          class="problem-solving-icon block h-8 w-8"
          v-html="item.iconSvg"
        />
      </span>

      <div class="flex min-w-0 flex-1 flex-col">
        <h3 class="text-lg font-bold leading-7 text-text-primary">
          {{ title }}
        </h3>

        <p
          v-if="description"
          class="mt-2 flex-1 text-sm leading-6 text-text-secondary"
        >
          {{ description }}
        </p>

        <BaseButton
          v-if="destination"
          type="button"
          variant="accent-outline"
          tabindex="-1"
          aria-hidden="true"
          size="sm"
          class="pointer-events-none relative z-20 mt-5 self-start !rounded-xl !px-4 upper"
        >
          ნახე პროდუქტები
          <template #right>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path
                d="M5 12h14M12 5l7 7-7 7"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </template>
        </BaseButton>

        <BaseButton
          v-else
          type="button"
          variant="secondary"
          size="sm"
          :disabled="true"
          class="relative z-20 mt-5 self-start !rounded-xl !px-4"
        >
          კატეგორია არ არის მითითებული
        </BaseButton>
      </div>
    </div>

    <span
      class="absolute bottom-0 left-0 h-[3px] w-full origin-left scale-x-0 bg-accent-primary transition-transform duration-200 group-hover:scale-x-100 group-focus-within:scale-x-100"
    />
  </article>
</template>

<style scoped>
.problem-solving-icon :deep(svg) {
  width: 32px !important;
  height: 32px !important;
  display: block;
}
</style>
