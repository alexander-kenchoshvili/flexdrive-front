<script setup lang="ts">
import type { BlogCategoryFacet } from "~/types/blog";

const props = withDefaults(
  defineProps<{
    categories?: BlogCategoryFacet[];
    selectedCategory?: string | null;
    disabled?: boolean;
  }>(),
  {
    categories: () => [],
    selectedCategory: null,
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: "update:selectedCategory", value: string | null): void;
}>();

const isActiveCategory = (name: string | null) =>
  (props.selectedCategory || null) === name;
</script>

<template>
  <div class="blog-category-chip-strip -mx-1 flex gap-2 overflow-x-auto px-1 pt-1 pb-3">
    <button
      type="button"
      :disabled="disabled"
      :class="[
        'shrink-0 rounded-[10px] border px-4 py-2 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60',
        isActiveCategory(null)
          ? 'border-accent-primary bg-accent-primary text-text-invert'
          : 'border-border-default bg-surface text-text-secondary hover:border-accent-primary hover:text-accent-primary',
      ]"
      @click="emit('update:selectedCategory', null)"
    >
      ყველა
    </button>

    <button
      v-for="category in categories"
      :key="category.name"
      type="button"
      :disabled="disabled"
      :class="[
        'shrink-0 rounded-[10px] border px-4 py-2 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60',
        isActiveCategory(category.name)
          ? 'border-accent-primary bg-accent-primary text-text-invert'
          : 'border-border-default bg-surface text-text-secondary hover:border-accent-primary hover:text-accent-primary',
      ]"
      @click="emit('update:selectedCategory', category.name)"
    >
      {{ category.name }}
    </button>
  </div>
</template>

<style scoped>
.blog-category-chip-strip {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--border-muted) var(--surface-2);
}

.blog-category-chip-strip::-webkit-scrollbar {
  height: 10px;
}

.blog-category-chip-strip::-webkit-scrollbar-track {
  background: var(--surface-2);
  border: 1px solid var(--border-default);
  border-radius: 999px;
}

.blog-category-chip-strip::-webkit-scrollbar-thumb {
  background: var(--border-muted);
  border: 2px solid var(--surface-2);
  border-radius: 999px;
}

@media (hover: hover) and (pointer: fine) {
  .blog-category-chip-strip::-webkit-scrollbar-thumb:hover {
    background: var(--accent-primary);
  }
}

.blog-category-chip-strip::-webkit-scrollbar-button {
  display: none;
  width: 0;
  height: 0;
}
</style>
