<script setup lang="ts">
import BaseButton from "~/components/common/BaseButton.vue";
import BaseInput from "~/components/common/BaseInput.vue";
import { useDebounceFn } from "@vueuse/core";
import type { CatalogFilterCategory } from "~/types/catalog";

const props = withDefaults(
  defineProps<{
    categories?: CatalogFilterCategory[];
    selectedCategoryId?: number | null;
    selectedCategorySlug?: string | null;
    minPrice?: string;
    maxPrice?: string;
    disabled?: boolean;
  }>(),
  {
    categories: () => [],
    selectedCategoryId: null,
    selectedCategorySlug: null,
    minPrice: "",
    maxPrice: "",
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: "update:selectedCategoryId", value: number | null): void;
  (e: "update:minPrice", value: string): void;
  (e: "update:maxPrice", value: string): void;
  (e: "apply"): void;
  (e: "reset"): void;
}>();

const minPriceModel = computed({
  get: () => props.minPrice,
  set: (value: string) => emit("update:minPrice", value),
});

const maxPriceModel = computed({
  get: () => props.maxPrice,
  set: (value: string) => emit("update:maxPrice", value),
});

const emitApplyDebounced = useDebounceFn(() => {
  emit("apply");
}, 500);

const toggleCategory = (id: number) => {
  emit("update:selectedCategoryId", id);
  emit("apply");
};

const isCategorySelected = (category: CatalogFilterCategory) =>
  props.selectedCategoryId === category.id ||
  props.selectedCategorySlug === category.slug;

watch([minPriceModel, maxPriceModel], () => {
  emitApplyDebounced();
});
</script>

<template>
  <aside class="rounded-xl border border-border-default bg-surface p-4">
    <h2 class="text-lg font-semibold text-text-primary">ფილტრები</h2>

    <div class="mt-4 border-t border-border-default pt-4">
      <h3 class="text-sm font-semibold text-text-primary">კატეგორია</h3>
      <ul class="mt-3 space-y-2">
        <li
          v-for="category in categories"
          :key="category.id"
          class="text-sm"
        >
          <label
            class="flex cursor-pointer items-center justify-between gap-3 rounded-[14px] border px-3 py-2.5 transition-colors duration-200"
            :class="
              isCategorySelected(category)
                ? 'border-accent-primary/45 bg-accent-primary/10 text-text-primary'
                : 'border-transparent bg-surface-2/55 text-text-secondary hover:border-border-default hover:bg-surface-2'
            "
          >
            <input
              type="radio"
              name="catalog-category"
              :checked="isCategorySelected(category)"
              :disabled="disabled"
              class="sr-only"
              @change="toggleCategory(category.id)"
            />
            <span class="flex min-w-0 items-center gap-3">
              <span
                class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-200"
                :class="
                  isCategorySelected(category)
                    ? 'border-accent-primary bg-accent-primary/12'
                    : 'border-border-muted bg-surface'
                "
              >
                <span
                  class="h-2.5 w-2.5 rounded-full transition-colors duration-200"
                  :class="
                    isCategorySelected(category)
                      ? 'bg-accent-primary'
                      : 'bg-transparent'
                  "
                />
              </span>
              <span class="truncate">{{ category.name }}</span>
            </span>
            <span
              class="shrink-0 text-xs font-semibold transition-colors duration-200"
              :class="
                isCategorySelected(category)
                  ? 'text-accent-primary'
                  : 'text-text-muted'
              "
            >
              {{ category.count }}
            </span>
          </label>
        </li>
      </ul>
    </div>

    <div class="mt-4 border-t border-border-default pt-4">
      <h3 class="text-sm font-semibold text-text-primary">ფასის დიაპაზონი</h3>
      <div class="mt-3 grid grid-cols-2 gap-2">
        <BaseInput
          v-model="minPriceModel"
          type="number"
          placeholder="დან"
          inputmode="numeric"
          min="0"
        />
        <BaseInput
          v-model="maxPriceModel"
          type="number"
          placeholder="მდე"
          inputmode="numeric"
          min="0"
        />
      </div>
    </div>

    <div class="mt-5">
      <BaseButton
        type="button"
        variant="secondary"
        :full-width="true"
        :disabled="disabled"
        @click="emit('reset')"
      >
        &#x10D2;&#x10D0;&#x10E1;&#x10E3;&#x10E4;&#x10D7;&#x10D0;&#x10D5;&#x10D4;&#x10D1;&#x10D0;
      </BaseButton>
    </div>
  </aside>
</template>

<style scoped>
:deep(input[type="number"]) {
  appearance: textfield;
  -moz-appearance: textfield;
}

:deep(input[type="number"]::-webkit-outer-spin-button),
:deep(input[type="number"]::-webkit-inner-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}
</style>


