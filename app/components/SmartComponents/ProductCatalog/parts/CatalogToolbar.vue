<script setup lang="ts">
import { XMarkIcon } from "@heroicons/vue/24/outline";
import BaseSelect from "~/components/common/BaseSelect.vue";

type CatalogSortOption = {
  label: string;
  value: string;
  disabled?: boolean;
};
type CatalogActiveFilterKey =
  | "vehicle"
  | "category"
  | "brand"
  | "placement"
  | "side"
  | "price"
  | "in_stock"
  | "on_sale";
type CatalogActiveFilter = {
  key: CatalogActiveFilterKey;
  label: string;
  value?: string;
};

const props = withDefaults(
  defineProps<{
    resultCount?: number;
    sort?: string;
    sortOptions?: CatalogSortOption[];
    activeFilters?: CatalogActiveFilter[];
    disabled?: boolean;
  }>(),
  {
    resultCount: 0,
    sort: "recommended",
    sortOptions: () => [
      { value: "recommended", label: "რეკომენდირებული" },
      { value: "newest", label: "უახლესი" },
      { value: "price_asc", label: "ფასი: ზრდადობით" },
      { value: "price_desc", label: "ფასი: კლებადობით" },
    ],
    activeFilters: () => [],
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: "update:sort", value: string): void;
  (e: "removeFilter", key: CatalogActiveFilterKey): void;
  (e: "clearAll"): void;
}>();

const sortModel = computed({
  get: () => props.sort ?? "recommended",
  set: (value: string | number | null) => {
    if (typeof value === "string") {
      emit("update:sort", value);
    }
  },
});
</script>

<template>
  <div
    class="rounded-lg border border-border-default bg-surface p-4"
  >
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-sm text-text-secondary">
        ნაპოვნია
        <span class="font-semibold text-text-primary">{{ resultCount }}</span>
        პროდუქტი
      </p>

      <div class="flex items-center gap-2 text-sm text-text-secondary">
        <span>დალაგება</span>
        <BaseSelect
          v-model="sortModel"
          :options="props.sortOptions"
          placeholder="დალაგება"
          :disabled="disabled"
          class="w-[220px]"
        />
      </div>
    </div>

    <div class="mt-3 flex min-h-[45px] flex-col justify-center border-t border-border-default pt-3">
      <div
        v-if="activeFilters.length"
        class="flex flex-wrap items-center gap-2"
      >
        <button
          v-for="filter in activeFilters"
          :key="filter.key"
          type="button"
          class="inline-flex min-h-8 min-w-0 max-w-full items-center justify-center gap-2 rounded-full border border-border-default bg-accent-soft px-3 py-1 text-xs font-semibold leading-5 text-accent-primary transition-colors duration-200 hover:border-accent-primary hover:bg-accent-primary hover:text-text-invert disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="disabled"
          :aria-label="`${filter.label} ფილტრის მოხსნა`"
          @click="emit('removeFilter', filter.key)"
        >
          <span v-if="filter.key !== 'vehicle'" class="shrink-0">{{ filter.label }}</span>
          <span v-if="filter.value" class="min-w-0 whitespace-normal [overflow-wrap:anywhere]" :class="filter.key === 'vehicle' ? 'text-center' : 'text-left'">
            {{ filter.value }}
          </span>
          <XMarkIcon class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </button>

        <button
          type="button"
          class="ml-auto min-h-8 text-xs font-semibold text-text-secondary transition-colors duration-200 hover:text-accent-primary disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="disabled"
          @click="emit('clearAll')"
        >
          ყველაფრის გასუფთავება
        </button>
      </div>
      <p v-else class="text-xs font-medium text-text-muted">
        აირჩიე ფილტრები შედეგების დასაზუსტებლად
      </p>
    </div>
  </div>
</template>
