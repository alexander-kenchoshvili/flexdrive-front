<script setup lang="ts">
import BaseInput from "~/components/common/BaseInput.vue";
import type { BlogCategoryFacet } from "~/types/blog";
import BlogCategoryChips from "./BlogCategoryChips.vue";

const props = withDefaults(
  defineProps<{
    categories?: BlogCategoryFacet[];
    selectedCategory?: string | null;
    search?: string;
    disabled?: boolean;
  }>(),
  {
    categories: () => [],
    selectedCategory: null,
    search: "",
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: "update:selectedCategory", value: string | null): void;
  (e: "update:search", value: string): void;
}>();
</script>

<template>
  <div
    class="rounded-[20px] border border-border-default bg-surface p-4 md:p-6"
  >
    <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <BlogCategoryChips
        :categories="categories"
        :selected-category="selectedCategory"
        :disabled="disabled"
        @update:selected-category="emit('update:selectedCategory', $event)"
      />

      <BaseInput
        :model-value="search"
        prefix-icon="search"
        placeholder="ძებნა ბლოგში..."
        autocomplete="off"
        :disabled="disabled"
        class="w-full xl:max-w-[320px]"
        @update:model-value="emit('update:search', $event)"
      />
    </div>
  </div>
</template>
