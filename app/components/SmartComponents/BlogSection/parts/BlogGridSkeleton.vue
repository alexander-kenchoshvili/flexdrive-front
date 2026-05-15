<script setup lang="ts">
import SkeletonBlock from "~/components/common/skeleton/SkeletonBlock.vue";
import SkeletonText from "~/components/common/skeleton/SkeletonText.vue";

type BlogGridSkeletonVariant = "section" | "list";

const props = withDefaults(
  defineProps<{
    variant?: BlogGridSkeletonVariant;
    cardsCount?: number;
  }>(),
  {
    variant: "section",
    cardsCount: 9,
  },
);

const listItems = computed(() =>
  Array.from({ length: props.cardsCount }, (_, index) => index + 1),
);

const sectionItems = computed(() => [1, 2, 3, 4]);
</script>

<template>
  <div
    v-if="variant === 'section'"
    class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
  >
    <div
      v-for="index in sectionItems"
      :key="`blog-section-skeleton-${index}`"
      class="rounded-lg border border-border-default bg-surface"
    >
      <SkeletonBlock class="aspect-[16/9]" radius="md" />
      <div class="space-y-3 p-4">
        <SkeletonText size="sm" width="w-32" />
        <SkeletonBlock class="h-6 w-4/5" radius="md" />
        <SkeletonBlock class="h-10" radius="md" />
        <SkeletonBlock class="h-10" radius="md" />
      </div>
    </div>
  </div>

  <div
    v-else
    class="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3"
  >
    <div
      v-for="index in listItems"
      :key="`blog-list-skeleton-${index}`"
      class="rounded-lg border border-border-default bg-surface"
    >
      <SkeletonBlock class="aspect-[16/9]" radius="md" />
      <div class="space-y-3 p-4">
        <SkeletonText size="sm" width="w-32" />
        <SkeletonBlock class="h-6 w-4/5" radius="md" />
        <SkeletonBlock class="h-10" radius="md" />
        <SkeletonBlock class="h-10" radius="md" />
      </div>
    </div>
  </div>
</template>
