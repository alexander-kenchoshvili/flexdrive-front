<script setup lang="ts">
import { XMarkIcon } from "@heroicons/vue/24/outline";
import BaseButton from "~/components/common/BaseButton.vue";
import BaseInput from "~/components/common/BaseInput.vue";
import BaseSelect from "~/components/common/BaseSelect.vue";
import type { CatalogFilterCategory, CatalogSort } from "~/types/catalog";

type CatalogSortOption = {
  label: string;
  value: CatalogSort;
  disabled?: boolean;
};

const props = withDefaults(
  defineProps<{
    open?: boolean;
    categories?: CatalogFilterCategory[];
    selectedCategoryId?: number | null;
    selectedCategorySlug?: string | null;
    minPrice?: string;
    maxPrice?: string;
    sort?: CatalogSort;
    sortOptions?: CatalogSortOption[];
    disabled?: boolean;
  }>(),
  {
    open: false,
    categories: () => [],
    selectedCategoryId: null,
    selectedCategorySlug: null,
    minPrice: "",
    maxPrice: "",
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
  (e: "close"): void;
  (
    e: "apply",
    value: {
      selectedCategoryId: number | null;
      minPrice: string;
      maxPrice: string;
      sort: CatalogSort;
    },
  ): void;
}>();

const sheetRef = ref<HTMLElement | null>(null);
const draftSelectedCategoryId = ref<number | null>(props.selectedCategoryId);
const draftMinPrice = ref(props.minPrice);
const draftMaxPrice = ref(props.maxPrice);
const draftSort = ref<CatalogSort>(props.sort);

let previousBodyOverflow = "";

const hasDraftControls = computed(
  () =>
    draftSelectedCategoryId.value !== null ||
    Boolean(draftMinPrice.value.trim()) ||
    Boolean(draftMaxPrice.value.trim()) ||
    draftSort.value !== "recommended",
);

const applyFilters = () => {
  emit("apply", {
    selectedCategoryId: draftSelectedCategoryId.value,
    minPrice: draftMinPrice.value.trim(),
    maxPrice: draftMaxPrice.value.trim(),
    sort: draftSort.value,
  });
};

const clearDraftFilters = () => {
  draftSelectedCategoryId.value = null;
  draftMinPrice.value = "";
  draftMaxPrice.value = "";
  draftSort.value = "recommended";
};

const selectCategory = (id: number) => {
  draftSelectedCategoryId.value = id;
};

const isCategorySelected = (category: CatalogFilterCategory) =>
  draftSelectedCategoryId.value === category.id ||
  props.selectedCategorySlug === category.slug;

const sortModel = computed({
  get: () => draftSort.value,
  set: (value: string | number | null) => {
    if (typeof value === "string") {
      draftSort.value = value as CatalogSort;
    }
  },
});

const handleWindowKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    emit("close");
  }
};

const lockBodyScroll = () => {
  if (!import.meta.client) return;
  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
};

const unlockBodyScroll = () => {
  if (!import.meta.client) return;
  document.body.style.overflow = previousBodyOverflow;
};

const syncDraftFromProps = () => {
  draftSelectedCategoryId.value = props.selectedCategoryId;
  draftMinPrice.value = props.minPrice;
  draftMaxPrice.value = props.maxPrice;
  draftSort.value = props.sort;
};

watch(
  () => props.open,
  async (isOpen) => {
    if (!import.meta.client) return;

    if (isOpen) {
      syncDraftFromProps();
      lockBodyScroll();
      window.addEventListener("keydown", handleWindowKeydown);
      await nextTick();
      sheetRef.value?.focus();
      return;
    }

    unlockBodyScroll();
    window.removeEventListener("keydown", handleWindowKeydown);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (!import.meta.client) return;
  unlockBodyScroll();
  window.removeEventListener("keydown", handleWindowKeydown);
});
</script>

<template>
  <transition name="catalog-filter-sheet">
    <div
      v-if="open"
      class="fixed inset-0 z-50 bg-[rgba(2,6,23,0.52)] lg:hidden"
      @click="emit('close')"
    >
      <section
        ref="sheetRef"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-mobile-filter-title"
        class="absolute inset-x-0 bottom-0 flex max-h-[85dvh] min-h-[min(68dvh,620px)] flex-col rounded-t-[28px] border-t border-border-default bg-surface shadow-[0_-18px_48px_rgba(2,6,23,0.38)] outline-none"
        @click.stop
      >
        <div class="flex justify-center px-4 pb-2 pt-3">
          <span
            class="h-1.5 w-12 rounded-full bg-border-default"
            aria-hidden="true"
          />
        </div>

        <div
          class="flex items-start justify-between gap-3 border-b border-border-default px-4 pb-4 pt-2 sm:px-5"
        >
          <div>
            <h2
              id="catalog-mobile-filter-title"
              class="text-lg font-semibold text-text-primary"
            >
              ფილტრები და დალაგება
            </h2>
            <p class="mt-1 text-sm text-text-secondary">
              აირჩიე კატეგორია, ფასის დიაპაზონი და შედეგების დალაგება.
            </p>
          </div>

          <button
            type="button"
            class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-border-default bg-surface-2/70 text-text-secondary transition-colors duration-200 hover:border-accent-primary hover:text-accent-primary"
            aria-label="ფილტრის დახურვა"
            @click="emit('close')"
          >
            <XMarkIcon class="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div class="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-5">
          <section
            class="rounded-[22px] border border-border-default bg-surface-2/55 p-4"
          >
            <h3 class="text-sm font-semibold text-text-primary">დალაგება</h3>

            <BaseSelect
              v-model="sortModel"
              :options="props.sortOptions"
              placeholder="დალაგება"
              :disabled="disabled"
              class="mt-4"
            />
          </section>

          <section
            class="rounded-[22px] border border-border-default bg-surface-2/55 p-4"
          >
            <div class="flex items-center justify-between gap-3">
              <h3 class="text-sm font-semibold text-text-primary">კატეგორია</h3>
              <span class="text-xs text-text-muted">
                {{ categories.length }} არჩევა
              </span>
            </div>

            <div
              class="mt-4 flex flex-wrap gap-2"
              role="radiogroup"
              aria-label="კატეგორიის ფილტრი"
            >
              <button
                v-for="category in categories"
                :key="category.id"
                type="button"
                role="radio"
                :aria-checked="isCategorySelected(category)"
                :disabled="disabled"
                class="inline-flex min-h-[42px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                :class="
                  isCategorySelected(category)
                    ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                    : 'border-border-default bg-surface text-text-secondary hover:border-accent-primary hover:text-accent-primary'
                "
                @click="selectCategory(category.id)"
              >
                <span>{{ category.name }}</span>
                <span
                  class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  :class="
                    isCategorySelected(category)
                      ? 'bg-accent-primary/12 text-accent-primary'
                      : 'bg-surface-2 text-text-muted'
                  "
                >
                  {{ category.count }}
                </span>
              </button>
            </div>
          </section>

          <section
            class="rounded-[22px] border border-border-default bg-surface-2/55 p-4"
          >
            <h3 class="text-sm font-semibold text-text-primary">
              ფასის დიაპაზონი
            </h3>

            <div class="mt-4 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
              <BaseInput
                v-model="draftMinPrice"
                label="დან"
                type="number"
                placeholder="0"
                inputmode="numeric"
                min="0"
                :disabled="disabled"
              />
              <BaseInput
                v-model="draftMaxPrice"
                label="მდე"
                type="number"
                placeholder="0"
                inputmode="numeric"
                min="0"
                :disabled="disabled"
              />
            </div>
          </section>
        </div>

        <div
          class="flex flex-col gap-3 border-t border-border-default bg-surface px-4 py-4 sm:px-5"
        >
          <button
            type="button"
            class="self-start text-sm font-semibold text-accent-primary transition-colors duration-200 hover:text-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="disabled || !hasDraftControls"
            @click="clearDraftFilters"
          >
            გასუფთავება
          </button>

          <BaseButton
            type="button"
            :full-width="true"
            :disabled="disabled"
            @click="applyFilters"
          >
            ფილტრების გამოყენება
          </BaseButton>
        </div>
      </section>
    </div>
  </transition>
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

.catalog-filter-sheet-enter-active,
.catalog-filter-sheet-leave-active {
  transition: opacity 0.22s ease;
}

.catalog-filter-sheet-enter-active section,
.catalog-filter-sheet-leave-active section {
  transition: transform 0.26s ease;
}

.catalog-filter-sheet-enter-from,
.catalog-filter-sheet-leave-to {
  opacity: 0;
}

.catalog-filter-sheet-enter-from section,
.catalog-filter-sheet-leave-to section {
  transform: translateY(32px);
}

@media (prefers-reduced-motion: reduce) {
  .catalog-filter-sheet-enter-active,
  .catalog-filter-sheet-leave-active,
  .catalog-filter-sheet-enter-active section,
  .catalog-filter-sheet-leave-active section {
    transition: none;
  }
}
</style>
