<script setup lang="ts">
import BaseSelect from "~/components/common/BaseSelect.vue";
import BaseButton from "~/components/common/BaseButton.vue";
import type { BaseSelectOption } from "~/components/common/BaseSelect.vue";

const props = defineProps<{
  make: string;
  model: string;
  year: string;
  selectedCategories: string[];
  categoryOptions: BaseSelectOption[];
  makeOptions: BaseSelectOption[];
  modelOptions: BaseSelectOption[];
  yearOptions: BaseSelectOption[];
  categoriesPending: boolean;
  makesPending: boolean;
  vehiclePending: boolean;
  error: string;
  canSubmit: boolean;
}>();
const emit = defineEmits<{
  (e: "make", value: string): void;
  (e: "model", value: string): void;
  (e: "year", value: string): void;
  (e: "categories", value: string[]): void;
  (e: "search" | "clear" | "retry"): void;
}>();
const selectedOptions = computed(() => props.selectedCategories.map((value) => ({
  value,
  label: props.categoryOptions.find((option) => String(option.value) === value)?.label || value,
})));
</script>

<template>
  <section aria-label="ძიების ფილტრები" class="min-w-0">
    <div class="header-search-filter-grid grid min-w-0 grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <BaseSelect
        :model-value="make"
        :options="makeOptions"
        label="მარკა"
        placeholder="ყველა მარკა"
        empty-text="მარკები ვერ მოიძებნა"
        inline-options
        :disabled="makesPending"
        @update:model-value="emit('make', String($event || ''))"
      />
      <BaseSelect
        :model-value="model"
        :options="modelOptions"
        label="მოდელი"
        placeholder="ყველა მოდელი"
        empty-text="მოდელები ვერ მოიძებნა"
        inline-options
        :disabled="!make || vehiclePending"
        @update:model-value="emit('model', String($event || ''))"
      />
      <BaseSelect
        :model-value="year"
        :options="yearOptions"
        label="წელი"
        placeholder="ყველა წელი"
        empty-text="წლები ვერ მოიძებნა"
        inline-options
        :disabled="!make || vehiclePending"
        @update:model-value="emit('year', String($event || ''))"
      />
      <BaseSelect
        class="min-w-0"
        :selected-values="selectedCategories"
        :options="categoryOptions"
        label="კატეგორიები"
        placeholder="ყველა კატეგორია"
        empty-text="კატეგორიები ვერ მოიძებნა"
        multiple
        inline-options
        :disabled="categoriesPending"
        @update:selected-values="emit('categories', $event.map(String))"
      />
    </div>
    <ul v-if="selectedOptions.length" class="mt-3 flex flex-wrap gap-2" aria-label="არჩეული კატეგორიები">
      <li v-for="option in selectedOptions" :key="option.value" class="min-w-0 max-w-full">
        <button
          type="button"
          class="inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg border border-accent-primary/30 bg-accent-soft px-3 py-2 text-left text-xs font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          :aria-label="`${option.label} — მოხსნა`"
          @click="emit('categories', selectedCategories.filter((value) => value !== option.value))"
        >
          <span class="min-w-0 break-words">{{ option.label }}</span>
          <span class="shrink-0 text-lg text-accent-primary" aria-hidden="true">×</span>
        </button>
      </li>
    </ul>
    <div v-if="error" class="mt-3 flex flex-wrap items-center gap-2 text-sm text-warning" role="status">
      <p>{{ error }}</p>
      <button type="button" class="min-h-11 font-semibold underline" @click="emit('retry')">ხელახლა ცდა</button>
    </div>
    <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border-default pt-4 md:mt-1 md:border-t-0 md:pt-0">
      <BaseButton variant="ghost" size="sm" @click="emit('clear')">გასუფთავება</BaseButton>
      <BaseButton class="md:hidden" :disabled="!canSubmit" @click="emit('search')">ძებნა</BaseButton>
    </div>
  </section>
</template>

<style scoped>
@media (min-width: 1024px) {
  .header-search-filter-grid {
    --header-search-options-height: clamp(10rem, calc(100dvh - 22rem), 16rem);
    padding-bottom: 0;
    overflow: clip;
    /* Allow focus/pointer handoff to another select before collapsing the area. */
    transition: padding-bottom 180ms ease 120ms;
  }

  .header-search-filter-grid:has([aria-haspopup="listbox"][aria-expanded="true"]) {
    padding-bottom: calc(var(--header-search-options-height) + 0.5rem);
    transition-delay: 0s;
  }

  .header-search-filter-grid :deep(.base-select-options-scroll) {
    position: absolute;
    max-height: var(--header-search-options-height);
  }
}
</style>
