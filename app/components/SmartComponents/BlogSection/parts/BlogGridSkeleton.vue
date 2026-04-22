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

const regularSectionItems = computed(() => [1, 2, 3, 4]);
</script>

<template>
  <div
    v-if="variant === 'section'"
    class="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
  >
    <div
      class="rounded-[20px] border border-border-default bg-surface lg:col-span-2"
    >
      <SkeletonBlock class="aspect-[21/11] lg:aspect-[21/9]" radius="md" />
      <div class="space-y-4 p-6">
        <SkeletonText size="sm" width="w-40" />
        <SkeletonBlock class="h-8 w-4/5" radius="md" />
        <SkeletonBlock class="h-20" radius="md" />
      </div>
    </div>

    <div
      v-for="index in regularSectionItems"
      :key="`blog-section-skeleton-${index}`"
      class="rounded-[20px] border border-border-default bg-surface"
    >
      <SkeletonBlock class="aspect-[16/10]" radius="md" />
      <div class="space-y-4 p-6">
        <SkeletonText size="sm" width="w-32" />
        <SkeletonBlock class="h-7 w-4/5" radius="md" />
        <SkeletonBlock class="h-16" radius="md" />
      </div>
    </div>
  </div>

  <div
    v-else
    class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
  >
    <div
      v-for="index in listItems"
      :key="`blog-list-skeleton-${index}`"
      class="rounded-[20px] border border-border-default bg-surface"
    >
      <SkeletonBlock class="aspect-[16/10]" radius="md" />
      <div class="space-y-4 p-6">
        <SkeletonText size="sm" width="w-32" />
        <SkeletonBlock class="h-7 w-4/5" radius="md" />
        <SkeletonBlock class="h-16" radius="md" />
      </div>
    </div>
  </div>
</template>
