<script setup lang="ts">
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
          class="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-accent-primary/35 bg-accent-primary/10 px-3 py-1 text-xs font-semibold text-accent-primary transition-colors duration-200 hover:border-accent-primary hover:bg-accent-primary hover:text-text-invert disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="disabled"
          :aria-label="`${filter.label} ფილტრის მოხსნა`"
          @click="emit('removeFilter', filter.key)"
        >
          <span>{{ filter.label }}</span>
          <span v-if="filter.value" class="max-w-[220px] truncate text-current/80">
            {{ filter.value }}
          </span>
          <span aria-hidden="true">×</span>
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
