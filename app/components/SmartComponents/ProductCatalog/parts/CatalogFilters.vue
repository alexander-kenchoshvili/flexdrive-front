<script setup lang="ts">
import { XMarkIcon } from "@heroicons/vue/24/outline";
import { useDebounceFn } from "@vueuse/core";
import BaseInput from "~/components/common/BaseInput.vue";
import BaseSelect from "~/components/common/BaseSelect.vue";
import type {
  CatalogFacetBrand,
  CatalogFacetOption,
  CatalogFilterCategory,
  CatalogVehicleEngine,
  CatalogVehicleMake,
  CatalogVehicleModel,
  CatalogVehicleYear,
} from "~/types/catalog";

type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

const props = withDefaults(
  defineProps<{
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
    hasAppliedVehicle?: boolean;
    selectedCategoryId?: number | null;
    selectedCategorySlug?: string | null;
    selectedBrand?: string;
    selectedPlacement?: string;
    selectedSide?: string;
    inStock?: boolean;
    onSale?: boolean;
    minPrice?: string;
    maxPrice?: string;
    disabled?: boolean;
  }>(),
  {
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
    hasAppliedVehicle: false,
    selectedCategoryId: null,
    selectedCategorySlug: null,
    selectedBrand: "",
    selectedPlacement: "",
    selectedSide: "",
    inStock: false,
    onSale: false,
    minPrice: "",
    maxPrice: "",
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: "update:vehicleMake", value: string): void;
  (e: "update:vehicleModel", value: string): void;
  (e: "update:vehicleYear", value: string): void;
  (e: "update:vehicleEngine", value: string): void;
  (e: "update:selectedCategoryId", value: number | null): void;
  (e: "update:selectedBrand", value: string): void;
  (e: "update:selectedPlacement", value: string): void;
  (e: "update:selectedSide", value: string): void;
  (e: "update:inStock", value: boolean): void;
  (e: "update:onSale", value: boolean): void;
  (e: "update:minPrice", value: string): void;
  (e: "update:maxPrice", value: string): void;
  (e: "resetVehicle"): void;
  (e: "apply"): void;
  (e: "reset"): void;
}>();

const toStringValue = (value: string | number | null) =>
  value === null ? "" : String(value);

const prependAllOption = (label: string, options: SelectOption[]) => [
  { label, value: "" },
  ...options,
];

const vehicleMakeOptions = computed<SelectOption[]>(() =>
  props.vehicleMakes.map((make) => ({
    label: make.name,
    value: make.slug,
  })),
);
const vehicleModelOptions = computed<SelectOption[]>(() =>
  props.vehicleModels.map((model) => ({
    label: model.name,
    value: model.slug,
  })),
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
const brandModel = computed({
  get: () => props.selectedBrand,
  set: (value: string | number | null) => {
    emit("update:selectedBrand", toStringValue(value));
    emit("apply");
  },
});
const placementModel = computed({
  get: () => props.selectedPlacement,
  set: (value: string | number | null) => {
    emit("update:selectedPlacement", toStringValue(value));
    emit("apply");
  },
});
const sideModel = computed({
  get: () => props.selectedSide,
  set: (value: string | number | null) => {
    emit("update:selectedSide", toStringValue(value));
    emit("apply");
  },
});
const minPriceModel = computed({
  get: () => props.minPrice,
  set: (value: string) => emit("update:minPrice", value),
});
const maxPriceModel = computed({
  get: () => props.maxPrice,
  set: (value: string) => emit("update:maxPrice", value),
});

const hasVehicleDraft = computed(() =>
  Boolean(
    props.vehicleMake ||
      props.vehicleModel ||
      props.vehicleYear ||
      props.vehicleEngine,
  ),
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

const emitApplyDebounced = useDebounceFn(() => {
  emit("apply");
}, 500);

const toggleCategory = (id: number) => {
  emit("update:selectedCategoryId", id);
  emit("apply");
};

const updateQuickFilter = (key: "inStock" | "onSale", value: boolean) => {
  if (key === "inStock") {
    emit("update:inStock", value);
  } else {
    emit("update:onSale", value);
  }
  emit("apply");
};

const getCheckedValue = (event: Event) =>
  (event.target as HTMLInputElement | null)?.checked ?? false;

const isCategorySelected = (category: CatalogFilterCategory) =>
  props.selectedCategoryId === category.id ||
  props.selectedCategorySlug === category.slug;

watch([minPriceModel, maxPriceModel], () => {
  emitApplyDebounced();
});
</script>

<template>
  <aside
    class="catalog-filter-panel rounded-lg border border-border-default bg-surface p-4"
  >
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-base font-bold text-text-primary">ფილტრები</h2>
      <button
        type="button"
        class="text-xs font-semibold text-accent-primary transition-colors duration-200 hover:text-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="disabled"
        @click="emit('reset')"
      >
        გასუფთავება
      </button>
    </div>

    <section class="mt-4 border-t border-border-default pt-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="text-sm font-bold text-text-primary">მანქანით ძებნა</h3>
          <p class="mt-1 text-xs leading-5 text-text-muted">
            ფილტრი ავტომატურად ზუსტდება ყოველ არჩეულ საფეხურზე.
          </p>
        </div>
        <button
          v-if="hasVehicleDraft || hasAppliedVehicle"
          type="button"
          class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border-default bg-surface-2/70 text-text-muted transition-colors duration-200 hover:border-accent-primary hover:text-accent-primary disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="disabled || vehicleOptionsPending"
          aria-label="მანქანის ფილტრის გასუფთავება"
          title="მანქანის ფილტრის გასუფთავება"
          @click="emit('resetVehicle')"
        >
          <XMarkIcon class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div class="mt-3 grid gap-2">
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

    <section class="mt-4 border-t border-border-default pt-4">
      <h3 class="text-sm font-bold text-text-primary">კატეგორია</h3>
      <ul
        class="catalog-filter-scroll mt-3 max-h-[330px] space-y-2 overflow-y-auto pr-1"
        role="radiogroup"
        aria-label="კატეგორია"
      >
        <li v-for="category in categories" :key="category.id" class="text-sm">
          <button
            type="button"
            role="radio"
            class="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
            :aria-checked="isCategorySelected(category)"
            :disabled="disabled"
            :class="
              isCategorySelected(category)
                ? 'border-accent-primary/45 bg-accent-primary/10 text-text-primary'
                : 'border-transparent bg-surface-2/55 text-text-secondary hover:border-border-default hover:bg-surface-2'
            "
            @click="toggleCategory(category.id)"
          >
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
          </button>
        </li>
      </ul>
    </section>

    <section class="mt-4 border-t border-border-default pt-4">
      <h3 class="text-sm font-bold text-text-primary">დაზუსტება</h3>
      <div class="mt-3 grid gap-2">
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

    <section class="mt-4 border-t border-border-default pt-4">
      <h3 class="text-sm font-bold text-text-primary">სწრაფი ფილტრები</h3>
      <div class="mt-3 grid gap-2">
        <label
          class="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-border-default bg-surface px-3 py-2 text-sm font-semibold text-text-secondary transition-colors duration-200 hover:border-accent-primary hover:text-accent-primary"
        >
          <span>მარაგშია</span>
          <input
            type="checkbox"
            :checked="inStock"
            :disabled="disabled"
            class="h-4 w-4 accent-[var(--accent-primary)]"
            @change="updateQuickFilter('inStock', getCheckedValue($event))"
          />
        </label>
        <label
          class="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-border-default bg-surface px-3 py-2 text-sm font-semibold text-text-secondary transition-colors duration-200 hover:border-accent-primary hover:text-accent-primary"
        >
          <span>ფასდაკლება</span>
          <input
            type="checkbox"
            :checked="onSale"
            :disabled="disabled"
            class="h-4 w-4 accent-[var(--accent-primary)]"
            @change="updateQuickFilter('onSale', getCheckedValue($event))"
          />
        </label>
      </div>
    </section>

    <section class="mt-4 border-t border-border-default pt-4">
      <h3 class="text-sm font-bold text-text-primary">ფასის დიაპაზონი</h3>
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
    </section>
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

.catalog-filter-scroll {
  scrollbar-width: thin;
  scrollbar-color: var(--border-muted) transparent;
}

.catalog-filter-scroll::-webkit-scrollbar {
  width: 8px;
}

.catalog-filter-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.catalog-filter-scroll::-webkit-scrollbar-thumb {
  border: 2px solid transparent;
  border-radius: 999px;
  background-color: var(--border-muted);
  background-clip: content-box;
}

.catalog-filter-scroll::-webkit-scrollbar-thumb:hover {
  background-color: var(--accent-primary);
}

html.dark .catalog-filter-scroll {
  scrollbar-color: var(--accent-primary) transparent;
}

html.dark .catalog-filter-scroll::-webkit-scrollbar-thumb {
  background-color: color-mix(in srgb, var(--accent-primary) 70%, var(--surface-3));
}

html.dark .catalog-filter-scroll::-webkit-scrollbar-thumb:hover {
  background-color: var(--accent-hover);
}
</style>
