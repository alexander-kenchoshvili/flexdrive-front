<script setup lang="ts">
import { XMarkIcon } from "@heroicons/vue/24/outline";
import BaseButton from "~/components/common/BaseButton.vue";
import BaseInput from "~/components/common/BaseInput.vue";
import BaseSelect from "~/components/common/BaseSelect.vue";
import type {
  CatalogFacetBrand,
  CatalogFacetOption,
  CatalogFilterCategory,
  CatalogSort,
  CatalogVehicleEngine,
  CatalogVehicleMake,
  CatalogVehicleModel,
  CatalogVehicleSelection,
  CatalogVehicleYear,
} from "~/types/catalog";

type CatalogSortOption = {
  label: string;
  value: CatalogSort;
  disabled?: boolean;
};
type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

const props = withDefaults(
  defineProps<{
    open?: boolean;
    categories?: CatalogFilterCategory[];
    brands?: CatalogFacetBrand[];
    placements?: CatalogFacetOption[];
    sides?: CatalogFacetOption[];
    vehicleMakes?: CatalogVehicleMake[];
    vehicleModels?: CatalogVehicleModel[];
    vehicleYears?: CatalogVehicleYear[];
    vehicleEngines?: CatalogVehicleEngine[];
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleYear?: string;
    vehicleEngine?: string;
    vehicleEngineDisplayValue?: string;
    vehicleEngineOptionsReady?: boolean;
    vehicleOptionsPending?: boolean;
    vehicleOptionsError?: boolean;
    hasInvalidVehicle?: boolean;
    selectedCategoryId?: number | null;
    selectedCategorySlug?: string | null;
    selectedBrand?: string;
    selectedPlacement?: string;
    selectedSide?: string;
    inStock?: boolean;
    onSale?: boolean;
    minPrice?: string;
    maxPrice?: string;
    sort?: CatalogSort;
    sortOptions?: CatalogSortOption[];
    disabled?: boolean;
  }>(),
  {
    open: false,
    categories: () => [],
    brands: () => [],
    placements: () => [],
    sides: () => [],
    vehicleMakes: () => [],
    vehicleModels: () => [],
    vehicleYears: () => [],
    vehicleEngines: () => [],
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    vehicleEngine: "",
    vehicleEngineDisplayValue: "",
    vehicleEngineOptionsReady: true,
    vehicleOptionsPending: false,
    vehicleOptionsError: false,
    hasInvalidVehicle: false,
    selectedCategoryId: null,
    selectedCategorySlug: null,
    selectedBrand: "",
    selectedPlacement: "",
    selectedSide: "",
    inStock: false,
    onSale: false,
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
  (e: "update:vehicleMake", value: string): void;
  (e: "update:vehicleModel", value: string): void;
  (e: "update:vehicleYear", value: string): void;
  (e: "update:vehicleEngine", value: string): void;
  (e: "resetVehicleDraft"): void;
  (
    e: "apply",
    value: {
      selectedCategoryId: number | null;
      minPrice: string;
      maxPrice: string;
      sort: CatalogSort;
      selectedBrand: string;
      selectedPlacement: string;
      selectedSide: string;
      inStock: boolean;
      onSale: boolean;
      vehicle: CatalogVehicleSelection;
    },
  ): void;
}>();

const sheetRef = ref<HTMLElement | null>(null);
const draftSelectedCategoryId = ref<number | null>(props.selectedCategoryId);
const draftMinPrice = ref(props.minPrice);
const draftMaxPrice = ref(props.maxPrice);
const draftSort = ref<CatalogSort>(props.sort);
const draftSelectedBrand = ref(props.selectedBrand);
const draftSelectedPlacement = ref(props.selectedPlacement);
const draftSelectedSide = ref(props.selectedSide);
const draftInStock = ref(props.inStock);
const draftOnSale = ref(props.onSale);

let previousBodyOverflow = "";

const toStringValue = (value: string | number | null) =>
  value === null ? "" : String(value);
const prependAllOption = (label: string, options: SelectOption[]) => [
  { label, value: "" },
  ...options,
];

const vehicleMakeOptions = computed<SelectOption[]>(() =>
  props.vehicleMakes.map((make) => ({ label: make.name, value: make.slug })),
);
const vehicleModelOptions = computed<SelectOption[]>(() =>
  props.vehicleModels.map((model) => ({ label: model.name, value: model.slug })),
);
const vehicleYearOptions = computed<SelectOption[]>(() =>
  props.vehicleYears.map((item) => ({
    label: String(item.year),
    value: String(item.year),
  })),
);
const vehicleEngineOptions = computed<SelectOption[]>(() =>
  props.vehicleEngines.map((engine) => ({
    label: engine.name,
    value: engine.slug,
  })),
);
const brandOptions = computed<SelectOption[]>(() =>
  props.brands.length
    ? prependAllOption(
        "ყველა ბრენდი",
        props.brands.map((brand) => ({
          label: `${brand.name} (${brand.count})`,
          value: brand.slug,
        })),
      )
    : [],
);
const placementOptions = computed<SelectOption[]>(() =>
  props.placements.length
    ? prependAllOption(
        "ყველა მდებარეობა",
        props.placements.map((option) => ({
          label: `${option.label} (${option.count})`,
          value: option.value,
        })),
      )
    : [],
);
const sideOptions = computed<SelectOption[]>(() =>
  props.sides.length
    ? prependAllOption(
        "ყველა მხარე",
        props.sides.map((option) => ({
          label: `${option.label} (${option.count})`,
          value: option.value,
        })),
      )
    : [],
);

const vehicleMakeModel = computed({
  get: () => props.vehicleMake,
  set: (value: string | number | null) =>
    emit("update:vehicleMake", toStringValue(value)),
});
const vehicleModelModel = computed({
  get: () => props.vehicleModel,
  set: (value: string | number | null) =>
    emit("update:vehicleModel", toStringValue(value)),
});
const vehicleYearModel = computed({
  get: () => props.vehicleYear,
  set: (value: string | number | null) =>
    emit("update:vehicleYear", toStringValue(value)),
});
const vehicleEngineModel = computed({
  get: () => props.vehicleEngine,
  set: (value: string | number | null) =>
    emit("update:vehicleEngine", toStringValue(value)),
});
const sortModel = computed({
  get: () => draftSort.value,
  set: (value: string | number | null) => {
    if (typeof value === "string") {
      draftSort.value = value as CatalogSort;
    }
  },
});
const brandModel = computed({
  get: () => draftSelectedBrand.value,
  set: (value: string | number | null) => {
    draftSelectedBrand.value = toStringValue(value);
  },
});
const placementModel = computed({
  get: () => draftSelectedPlacement.value,
  set: (value: string | number | null) => {
    draftSelectedPlacement.value = toStringValue(value);
  },
});
const sideModel = computed({
  get: () => draftSelectedSide.value,
  set: (value: string | number | null) => {
    draftSelectedSide.value = toStringValue(value);
  },
});

const hasDraftControls = computed(
  () =>
    draftSelectedCategoryId.value !== null ||
    Boolean(draftMinPrice.value.trim()) ||
    Boolean(draftMaxPrice.value.trim()) ||
    draftSort.value !== "recommended" ||
    Boolean(draftSelectedBrand.value) ||
    Boolean(draftSelectedPlacement.value) ||
    Boolean(draftSelectedSide.value) ||
    draftInStock.value ||
    draftOnSale.value ||
    Boolean(
      props.vehicleMake ||
        props.vehicleModel ||
        props.vehicleYear ||
        props.vehicleEngine,
    ),
);
const canApplyFilters = computed(
  () =>
    !props.disabled &&
    !props.hasInvalidVehicle &&
    !props.vehicleOptionsPending,
);
const vehicleHelperText = computed(() => {
  if (props.vehicleOptionsError) {
    return "მანქანის არჩევანის ჩატვირთვა ვერ მოხერხდა.";
  }

  if (props.hasInvalidVehicle) {
    return "მანქანის ფილტრი არასწორი თანმიმდევრობით არის არჩეული.";
  }

  return (
    "შეგიძლია დაიწყო მხოლოდ მარკით და შემდეგ დააზუსტო მოდელი, წელი ან ძრავი."
  );
});

const applyFilters = () => {
  if (!canApplyFilters.value) return;

  emit("apply", {
    selectedCategoryId: draftSelectedCategoryId.value,
    minPrice: draftMinPrice.value.trim(),
    maxPrice: draftMaxPrice.value.trim(),
    sort: draftSort.value,
    selectedBrand: draftSelectedBrand.value,
    selectedPlacement: draftSelectedPlacement.value,
    selectedSide: draftSelectedSide.value,
    inStock: draftInStock.value,
    onSale: draftOnSale.value,
    vehicle: {
      make: props.vehicleMake,
      model: props.vehicleModel,
      year: props.vehicleYear,
      engine: props.vehicleEngine,
    },
  });
};

const clearDraftFilters = () => {
  draftSelectedCategoryId.value = null;
  draftMinPrice.value = "";
  draftMaxPrice.value = "";
  draftSort.value = "recommended";
  draftSelectedBrand.value = "";
  draftSelectedPlacement.value = "";
  draftSelectedSide.value = "";
  draftInStock.value = false;
  draftOnSale.value = false;
  emit("resetVehicleDraft");
};

const selectCategory = (id: number) => {
  draftSelectedCategoryId.value = id;
};

const isCategorySelected = (category: CatalogFilterCategory) =>
  draftSelectedCategoryId.value === category.id ||
  props.selectedCategorySlug === category.slug;

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
  draftSelectedBrand.value = props.selectedBrand;
  draftSelectedPlacement.value = props.selectedPlacement;
  draftSelectedSide.value = props.selectedSide;
  draftInStock.value = props.inStock;
  draftOnSale.value = props.onSale;
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
        class="absolute inset-x-0 bottom-0 flex max-h-[88dvh] min-h-[min(72dvh,680px)] flex-col rounded-t-[22px] border-t border-border-default bg-surface shadow-[0_-18px_48px_rgba(2,6,23,0.38)] outline-none"
        @click.stop
      >
        <div class="flex justify-center px-4 pb-2 pt-3">
          <span class="h-1.5 w-12 rounded-full bg-border-default" aria-hidden="true" />
        </div>

        <div
          class="flex items-start justify-between gap-3 border-b border-border-default px-4 pb-4 pt-2 sm:px-5"
        >
          <div>
            <h2
              id="catalog-mobile-filter-title"
              class="text-lg font-bold text-text-primary"
            >
              ფილტრები და დალაგება
            </h2>
            <p class="mt-1 text-sm leading-5 text-text-secondary">
              მოძებნე ნაწილი მანქანით, ბრენდით, ფასით ან კატეგორიით.
            </p>
          </div>

          <button
            type="button"
            class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border-default bg-surface-2/70 text-text-secondary transition-colors duration-200 hover:border-accent-primary hover:text-accent-primary"
            aria-label="ფილტრის დახურვა"
            @click="emit('close')"
          >
            <XMarkIcon class="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div class="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5">
          <section class="rounded-lg border border-border-default bg-surface-2/55 p-4">
            <h3 class="text-sm font-bold text-text-primary">მანქანით ძებნა</h3>
            <div class="mt-3 grid gap-3 min-[520px]:grid-cols-2">
              <BaseSelect
                v-model="vehicleMakeModel"
                :options="vehicleMakeOptions"
                placeholder="მარკა"
                empty-text="მარკები ჯერ არ არის დამატებული"
                :disabled="disabled"
              />
              <BaseSelect
                v-model="vehicleModelModel"
                :options="vehicleModelOptions"
                placeholder="მოდელი"
                empty-text="ჯერ აირჩიე მარკა ან დაამატე მოდელები"
                :disabled="disabled || vehicleOptionsPending || !vehicleMake"
              />
              <BaseSelect
                v-model="vehicleYearModel"
                :options="vehicleYearOptions"
                placeholder="წელი"
                empty-text="წლების დიაპაზონი ჯერ არ არის მიბმული"
                :disabled="disabled || vehicleOptionsPending || !vehicleMake"
              />
              <BaseSelect
                v-model="vehicleEngineModel"
                :options="vehicleEngineOptions"
                :display-value="vehicleEngineDisplayValue"
                placeholder="ძრავი"
                empty-text="ძრავის არჩევანი არ არის"
                :disabled="
                  disabled ||
                  vehicleOptionsPending ||
                  !vehicleModel ||
                  !vehicleYear ||
                  (vehicleEngineOptionsReady &&
                    !vehicleEngine &&
                    !vehicleEngineOptions.length)
                "
              />
            </div>
            <p
              class="mt-2 text-xs leading-5"
              :class="
                hasInvalidVehicle || vehicleOptionsError
                  ? 'text-warning'
                  : 'text-text-muted'
              "
            >
              {{ vehicleHelperText }}
            </p>
          </section>

          <section class="rounded-lg border border-border-default bg-surface-2/55 p-4">
            <h3 class="text-sm font-bold text-text-primary">დალაგება</h3>
            <BaseSelect
              v-model="sortModel"
              :options="props.sortOptions"
              placeholder="დალაგება"
              :disabled="disabled"
              class="mt-3"
            />
          </section>

          <section class="rounded-lg border border-border-default bg-surface-2/55 p-4">
            <div class="flex items-center justify-between gap-3">
              <h3 class="text-sm font-bold text-text-primary">კატეგორია</h3>
              <span class="text-xs text-text-muted">{{ categories.length }} არჩევანი</span>
            </div>

            <div
              class="mt-3 flex flex-wrap gap-2"
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
                class="inline-flex min-h-[42px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                :class="
                  isCategorySelected(category)
                    ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                    : 'border-border-default bg-surface text-text-secondary hover:border-accent-primary hover:text-accent-primary'
                "
                @click="selectCategory(category.id)"
              >
                <span>{{ category.name }}</span>
                <span
                  class="rounded-full px-2 py-0.5 text-[11px] font-bold"
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

          <section class="rounded-lg border border-border-default bg-surface-2/55 p-4">
            <h3 class="text-sm font-bold text-text-primary">დაზუსტება</h3>
            <div class="mt-3 grid gap-3 min-[520px]:grid-cols-2">
              <BaseSelect
                v-model="brandModel"
                :options="brandOptions"
                placeholder="ბრენდი"
                empty-text="ბრენდები ჯერ არ არის შევსებული"
                :disabled="disabled"
              />
              <BaseSelect
                v-model="placementModel"
                :options="placementOptions"
                placeholder="მდებარეობა"
                empty-text="მდებარეობის მონაცემი ჯერ არ არის შევსებული"
                :disabled="disabled"
              />
              <BaseSelect
                v-model="sideModel"
                :options="sideOptions"
                placeholder="მხარე"
                empty-text="მხარის მონაცემი ჯერ არ არის შევსებული"
                :disabled="disabled"
              />
            </div>
          </section>

          <section class="rounded-lg border border-border-default bg-surface-2/55 p-4">
            <h3 class="text-sm font-bold text-text-primary">სწრაფი ფილტრები</h3>
            <div class="mt-3 flex flex-wrap gap-2">
              <label
                class="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-border-default bg-surface px-3 py-2 text-sm font-semibold text-text-secondary"
              >
                <input
                  v-model="draftInStock"
                  type="checkbox"
                  :disabled="disabled"
                  class="h-4 w-4 accent-[var(--accent-primary)]"
                />
                მარაგშია
              </label>
              <label
                class="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-border-default bg-surface px-3 py-2 text-sm font-semibold text-text-secondary"
              >
                <input
                  v-model="draftOnSale"
                  type="checkbox"
                  :disabled="disabled"
                  class="h-4 w-4 accent-[var(--accent-primary)]"
                />
                ფასდაკლება
              </label>
            </div>
          </section>

          <section class="rounded-lg border border-border-default bg-surface-2/55 p-4">
            <h3 class="text-sm font-bold text-text-primary">ფასის დიაპაზონი</h3>
            <div class="mt-3 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
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
            :loading="vehicleOptionsPending"
            :disabled="!canApplyFilters"
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
