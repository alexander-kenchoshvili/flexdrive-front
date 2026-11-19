<script setup lang="ts">
import BaseSelect from "~/components/common/BaseSelect.vue";
import BaseButton from "~/components/common/BaseButton.vue";
import type { BaseSelectOption } from "~/components/common/BaseSelect.vue";

const props = defineProps<{
  embedded?: boolean;
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
  canClear: boolean;
}>();
const emit = defineEmits<{
  (e: "make", value: string): void;
  (e: "model", value: string): void;
  (e: "year", value: string): void;
  (e: "categories", value: string[]): void;
  (e: "search" | "clear" | "retry"): void;
}>();
// Empty value is a UI-only reset choice; it never enters catalog filters.
const categorySelectOptions = computed(() => [
  { label: "ყველა კატეგორია", value: "" },
  ...props.categoryOptions,
]);
const categorySelectValues = computed(() => props.selectedCategories.length ? props.selectedCategories : [""]);
const updateCategories = (values: Array<string | number>) => {
  const next = values.map(String);
  emit("categories", props.selectedCategories.length && next.includes("") ? [] : next.filter(Boolean));
};
const selectedOptions = computed(() => props.selectedCategories.map((value) => ({
  value,
  label: props.categoryOptions.find((option) => String(option.value) === value)?.label || value,
})));
</script>

<template>
  <section aria-label="ძიების ფილტრები" class="min-w-0" :class="embedded ? 'max-[767px]:[&_label]:sr-only max-[659px]:[&_[aria-haspopup=listbox]]:min-h-9 max-[659px]:[&_[aria-haspopup=listbox]]:py-2 max-[659px]:[&_[aria-haspopup=listbox]]:text-xs max-[639px]:[&_[aria-haspopup=listbox]]:min-h-7 max-[639px]:[&_[aria-haspopup=listbox]]:py-1 max-[639px]:[&_[aria-haspopup=listbox]]:pl-2.5 max-[639px]:[&_[aria-haspopup=listbox]]:pr-8 max-[639px]:[&_[aria-haspopup=listbox]]:text-[10px] max-[639px]:[&_[aria-haspopup=listbox]_svg]:h-4 max-[639px]:[&_[aria-haspopup=listbox]_svg]:w-4' : ''">
    <div
      class="grid min-w-0 items-start"
      :class="embedded ? 'grid-cols-1 gap-3 max-[639px]:gap-2 min-[440px]:grid-cols-2 md:grid-cols-4 md:gap-2.5 min-[1248px]:gap-3' : 'header-search-filter-grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'">
      <BaseSelect
        :model-value="make"
        clearable
        clear-label="მარკის გასუფთავება"
        :options="makeOptions"
        label="მარკა"
        placeholder="ყველა მარკა"
        empty-text="მარკები ვერ მოიძებნა"
        :inline-options="!embedded"
        :disabled="makesPending"
        @update:model-value="emit('make', String($event || ''))"
      />
      <BaseSelect
        :model-value="model"
        clearable
        clear-label="მოდელის გასუფთავება"
        :options="modelOptions"
        label="მოდელი"
        placeholder="ყველა მოდელი"
        empty-text="მოდელები ვერ მოიძებნა"
        :inline-options="!embedded"
        :disabled="!make || vehiclePending"
        @update:model-value="emit('model', String($event || ''))"
      />
      <BaseSelect
        :model-value="year"
        clearable
        clear-label="წლის გასუფთავება"
        :options="yearOptions"
        label="წელი"
        placeholder="ყველა წელი"
        empty-text="წლები ვერ მოიძებნა"
        :inline-options="!embedded"
        :disabled="!make || vehiclePending"
        @update:model-value="emit('year', String($event || ''))"
      />
      <BaseSelect
        class="min-w-0"
        :selected-values="categorySelectValues"
        :options="categorySelectOptions"
        label="კატეგორიები"
        placeholder="ყველა კატეგორია"
        empty-text="კატეგორიები ვერ მოიძებნა"
        multiple
        :inline-options="!embedded"
        :disabled="categoriesPending"
        @update:selected-values="updateCategories"
      />
    </div>
    <div v-if="selectedOptions.length || canClear" class="mt-3 flex min-w-0 items-center justify-between gap-3" :class="embedded && !selectedOptions.length ? 'hidden' : ''">
      <ul v-if="selectedOptions.length" class="flex min-w-0 flex-1 flex-wrap gap-2" aria-label="არჩეული კატეგორიები">
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
      <BaseButton v-if="canClear" class="ml-auto shrink-0" :class="embedded ? 'hidden' : ''" variant="ghost" size="sm" @click="emit('clear')">გასუფთავება</BaseButton>
    </div>
    <div v-if="error" class="mt-3 flex flex-wrap items-center gap-2 text-sm text-warning" role="status">
      <p>{{ error }}</p>
      <button type="button" class="min-h-11 font-semibold underline" @click="emit('retry')">ხელახლა ცდა</button>
    </div>
    <div v-if="!embedded" class="mt-4 flex justify-end border-t border-border-default pt-4 md:hidden">
      <BaseButton :disabled="!canSubmit" @click="emit('search')">ძებნა</BaseButton>
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
