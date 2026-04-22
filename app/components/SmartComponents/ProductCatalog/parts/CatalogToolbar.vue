<script setup lang="ts">
import BaseSelect from "~/components/common/BaseSelect.vue";

type CatalogSortOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

const props = withDefaults(
  defineProps<{
    resultCount?: number;
    sort?: string;
    sortOptions?: CatalogSortOption[];
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
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: "update:sort", value: string): void;
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
    class="flex flex-col gap-3 rounded-xl border border-border-default bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
  >
    <p class="text-sm text-text-secondary">
      ნაპოვნია <span class="font-semibold text-text-primary">{{ resultCount }}</span>
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
</template>
