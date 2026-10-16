<script setup lang="ts">
import { onClickOutside, useDebounceFn, useMediaQuery } from "@vueuse/core";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/vue";
import HeaderSearchFilters from "./HeaderSearchFilters.vue";
import BasePicture from "~/components/common/BasePicture.vue";
import { useCatalogApi } from "~/composables/catalog/useCatalogApi";
import { useCatalogPlaceholderMedia } from "~/composables/catalog/useCatalogPlaceholderMedia";
import { getCatalogCategorySlugFromPath } from "~/utils/routePaths";
import { waitForPageReady } from "~/utils/pageScrollCoordinator";
import type {
  CatalogCategoryItem,
  CatalogProductSuggestion,
  CatalogVehicleMake,
  CatalogVehicleModel,
  CatalogVehicleYear,
} from "~/types/catalog";

const emit = defineEmits<{
  (e: "open-mobile-search"): void;
}>();

const props = withDefaults(
  defineProps<{
    hideMobileTrigger?: boolean;
    sheetOnly?: boolean;
  }>(),
  {
    hideMobileTrigger: false,
    sheetOnly: false,
  },
);

const route = useRoute();
const router = useRouter();
// Match the parent Header mobile trigger and desktop input at the md breakpoint.
const isMobileViewport = useMediaQuery("(max-width: 767px)");
const { getCatalogCategoriesRaw, getCatalogProductSuggestions, getVehicleMakes, getVehicleModels, getVehicleYears } =
  useCatalogApi();
const { cardPlaceholderImage } = useCatalogPlaceholderMedia();
const { trackSearchSelection } = useEcommerceAnalytics();

const rootRef = ref<HTMLElement | null>(null);
const mobileInputRef = ref<HTMLInputElement | null>(null);

const searchPlaceholder = "მოძებნე ნაწილი, OEM ან SKU";

const searchText = ref("");
const isDesktopOpen = ref(false);
const isMobileOpen = ref(false);
const categories = ref<CatalogCategoryItem[]>([]);
const categoriesLoaded = ref(false);
const categoriesPending = ref(false);
const suggestions = ref<CatalogProductSuggestion[]>([]);
const suggestionsPending = ref(false);
const suggestionsError = ref<string | null>(null);
const activeSuggestionIndex = ref(-1);
const latestSuggestionsRequestId = ref(0);
const lastCompletedQuery = ref("");

const normalizedSearchText = computed(() => searchText.value.trim());
const showDesktopPanel = computed(
  () => !isMobileViewport.value && isDesktopOpen.value,
);
const isSearchSurfaceOpen = computed(
  () => isDesktopOpen.value || isMobileOpen.value,
);
const hasEnoughCharacters = computed(
  () => normalizedSearchText.value.length >= 2,
);
const showTypingHint = computed(() => normalizedSearchText.value.length === 1);
const showSuggestionList = computed(
  () =>
    hasEnoughCharacters.value &&
    !suggestionsPending.value &&
    lastCompletedQuery.value === normalizedSearchText.value &&
    suggestions.value.length > 0,
);
const showNoResults = computed(
  () =>
    hasEnoughCharacters.value &&
    !suggestionsPending.value &&
    !suggestionsError.value &&
    suggestions.value.length === 0 &&
    lastCompletedQuery.value === normalizedSearchText.value,
);
const hasActiveSuggestion = computed(
  () =>
    activeSuggestionIndex.value >= 0 &&
    activeSuggestionIndex.value < suggestions.value.length,
);
const mobileTriggerLabel = computed(
  () => normalizedSearchText.value || "მოძებნე ნაწილი",
);

const extractSearchQueryFromRoute = () => {
  const queryValue = route.query.q;
  if (Array.isArray(queryValue)) return String(queryValue[0] || "");
  return typeof queryValue === "string" ? queryValue : "";
};

const resetSuggestionsState = () => {
  ++latestSuggestionsRequestId.value;
  activeSuggestionIndex.value = -1;
  suggestions.value = [];
  suggestionsPending.value = false;
  suggestionsError.value = null;
  lastCompletedQuery.value = "";
};

// A catalog refinement must not overwrite a header draft that is not submitted yet.
const headerRouteKey = computed(() => JSON.stringify([
  route.path.replace(/\/$/, ""),
  ...["q", "make", "model", "year", "category", "categories"].map((key) => {
    const value = route.query[key];
    return (Array.isArray(value) ? value[0] : value) || "";
  }),
]));
const clearCatalogRefinementsOnSubmit = ref(false);
const selectedMake = ref("");
const selectedModel = ref("");
const selectedYear = ref("");
const selectedCategories = ref<string[]>([]);
const makes = ref<CatalogVehicleMake[]>([]);
const models = ref<CatalogVehicleModel[]>([]);
const years = ref<CatalogVehicleYear[]>([]);
const makesLoaded = ref(false);
const makesPending = ref(false);
const vehiclePending = ref(false);
const categoriesError = ref(false);
const makesError = ref(false);
const vehicleError = ref(false);
let vehicleRequestId = 0;
let disposed = false;
const filterError = computed(() => categoriesError.value || makesError.value || vehicleError.value
  ? "ფილტრების ჩატვირთვა ვერ მოხერხდა." : "");
const categoryOptions = computed(() => categories.value.map((category) => ({ label: category.name, value: category.slug })));
const makeOptions = computed(() => [{ label: "ყველა მარკა", value: "" }, ...makes.value.map((make) => ({ label: make.name, value: make.slug }))]);
const modelOptions = computed(() => [{ label: "ყველა მოდელი", value: "" }, ...models.value.map((model) => ({ label: model.name, value: model.slug }))]);
const yearOptions = computed(() => [{ label: "ყველა წელი", value: "" }, ...[...years.value].reverse().map(({ year }) => ({ label: String(year), value: String(year) }))]);
const canSubmit = computed(() => normalizedSearchText.value.length !== 1 && normalizedSearchText.value.length <= 255);
const filterParams = computed(() => ({
  ...(selectedMake.value ? { make: selectedMake.value } : {}),
  ...(selectedMake.value && selectedModel.value ? { model: selectedModel.value } : {}),
  ...(selectedMake.value && selectedYear.value ? { year: Number(selectedYear.value) } : {}),
  ...(selectedCategories.value.length ? { categories: selectedCategories.value.join(",") } : {}),
}));
const filtersKey = computed(() => JSON.stringify(filterParams.value));

const ensureCategoriesLoaded = async () => {
  if (categoriesLoaded.value || categoriesPending.value) return;
  categoriesPending.value = true;
  categoriesError.value = false;
  try {
    const response = await getCatalogCategoriesRaw();
    if (disposed) return;
    categories.value = response ?? [];
    selectedCategories.value = selectedCategories.value.map((value) =>
      categories.value.find((category) => String(category.id) === value)?.slug || value,
    );
    categoriesLoaded.value = true;
  } catch {
    if (!disposed) categoriesError.value = true;
  } finally {
    if (!disposed) categoriesPending.value = false;
  }
};
const ensureMakesLoaded = async () => {
  if (makesLoaded.value || makesPending.value) return;
  makesPending.value = true;
  makesError.value = false;
  try {
    const response = await getVehicleMakes();
    if (disposed) return;
    makes.value = response ?? [];
    makesLoaded.value = true;
  } catch {
    if (!disposed) makesError.value = true;
  } finally {
    if (!disposed) makesPending.value = false;
  }
};
const loadVehicleOptions = async () => {
  const requestId = ++vehicleRequestId;
  const make = selectedMake.value;
  const model = selectedModel.value;
  models.value = [];
  years.value = [];
  vehicleError.value = false;
  vehiclePending.value = Boolean(make);
  if (!make) return;
  try {
    const [nextModels, nextYears] = await Promise.all([
      getVehicleModels(make), getVehicleYears(make, model || undefined),
    ]);
    if (disposed || requestId !== vehicleRequestId) return;
    models.value = nextModels;
    years.value = nextYears;
  } catch {
    if (!disposed && requestId === vehicleRequestId) vehicleError.value = true;
  } finally {
    if (!disposed && requestId === vehicleRequestId) vehiclePending.value = false;
  }
};
const ensureFiltersLoaded = () => Promise.all([ensureCategoriesLoaded(), ensureMakesLoaded(), loadVehicleOptions()]);
const updateMake = (value: string) => {
  selectedModel.value = "";
  selectedYear.value = "";
  selectedMake.value = value;
};
const updateModel = (value: string) => {
  selectedYear.value = "";
  selectedModel.value = value;
};
const clearFilters = () => {
  clearCatalogRefinementsOnSubmit.value = true;
  searchText.value = "";
  selectedMake.value = "";
  selectedModel.value = "";
  selectedYear.value = "";
  selectedCategories.value = [];
};
watch([selectedMake, selectedModel], () => { if (isSearchSurfaceOpen.value) void loadVehicleOptions(); });

const fetchSuggestions = async (query: string) => {
  const normalizedQuery = query.trim();
  // A queued debounce may run after the input changed or the panel closed.
  if (normalizedQuery !== normalizedSearchText.value || !isSearchSurfaceOpen.value) return;

  if (normalizedQuery.length < 2) {
    resetSuggestionsState();
    return;
  }

  const requestId = ++latestSuggestionsRequestId.value;
  const requestedFilters = filtersKey.value;
  suggestionsPending.value = true;
  suggestionsError.value = null;

  try {
    const response = await getCatalogProductSuggestions(normalizedQuery, filterParams.value);

    if (disposed || requestId !== latestSuggestionsRequestId.value || requestedFilters !== filtersKey.value) return;

    suggestions.value = response;
    lastCompletedQuery.value = normalizedQuery;
  } catch {
    if (disposed || requestId !== latestSuggestionsRequestId.value || requestedFilters !== filtersKey.value) return;

    suggestions.value = [];
    suggestionsError.value =
      "ძიების შედეგების ჩატვირთვა ვერ მოხერხდა. სცადე ხელახლა.";
    lastCompletedQuery.value = normalizedQuery;
  } finally {
    if (requestId === latestSuggestionsRequestId.value) {
      suggestionsPending.value = false;
    }
  }
};

const fetchSuggestionsDebounced = useDebounceFn((query: string) => {
  void fetchSuggestions(query);
}, 300);

const closeDesktopPanel = () => {
  isDesktopOpen.value = false;
  activeSuggestionIndex.value = -1;
  if (!isSearchSurfaceOpen.value) resetSuggestionsState();
};

const closeMobileSheet = () => {
  isMobileOpen.value = false;
  activeSuggestionIndex.value = -1;
  if (!isSearchSurfaceOpen.value) resetSuggestionsState();
};

const closeAllSearchSurfaces = () => {
  closeDesktopPanel();
  closeMobileSheet();
};

const openDesktopPanel = async () => {
  if (isMobileViewport.value || isDesktopOpen.value) return;

  isDesktopOpen.value = true;
  activeSuggestionIndex.value = -1;
  void ensureFiltersLoaded();

  if (normalizedSearchText.value.length >= 2) {
    void fetchSuggestions(normalizedSearchText.value);
    return;
  }

  await ensureCategoriesLoaded();
};

const openMobileSheet = async () => {
  if (isMobileOpen.value) return;
  emit("open-mobile-search");
  isMobileOpen.value = true;
  activeSuggestionIndex.value = -1;
  void ensureFiltersLoaded();
  if (normalizedSearchText.value.length >= 2) {
    void fetchSuggestions(normalizedSearchText.value);
  } else {
    await ensureCategoriesLoaded();
  }
  await nextTick();
  if (normalizedSearchText.value) mobileInputRef.value?.focus();
};

const submitSearch = async () => {
  const normalizedQuery = normalizedSearchText.value;
  if (!canSubmit.value) return;

  const isCatalogSearch = /^\/catalog(?:\/category\/[^/]+)?\/?$/.test(route.path);
  const refinements: Record<string, string> = {};
  if (isCatalogSearch && !clearCatalogRefinementsOnSubmit.value) {
    for (const key of ["brand", "placement", "side", "in_stock", "on_sale", "min_price", "max_price", "ordering"]) {
      const rawValue = route.query[key];
      const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
      if (typeof value === "string" && value) refinements[key] = value;
    }
  }
  const query = { ...refinements, ...(normalizedQuery ? { q: normalizedQuery } : {}), ...filterParams.value };
  const searchPath = router.resolve({ path: "/catalog", query }).fullPath;

  closeAllSearchSurfaces();

  await router.push({
    path: "/catalog",
    query,
  });
  clearCatalogRefinementsOnSubmit.value = false;

  if (!isCatalogSearch || router.currentRoute.value.fullPath !== searchPath) return;
  await waitForPageReady(searchPath);
  await nextTick();
  window.requestAnimationFrame(() => {
    if (router.currentRoute.value.fullPath !== searchPath) return;
    document.getElementById("catalog-results-start")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
};

const goToSuggestion = async (suggestion: CatalogProductSuggestion) => {
  const normalizedQuery = normalizedSearchText.value;
  if (normalizedQuery) {
    trackSearchSelection(normalizedQuery, suggestion.display_sku || suggestion.sku);
  }
  closeAllSearchSurfaces();
  await navigateTo(`/catalog/${suggestion.slug}`);
};

const suggestionPriceLabel = (suggestion: CatalogProductSuggestion) => {
  const price = Number(suggestion.price || 0);
  return Number.isFinite(price) ? price.toFixed(2) : "0.00";
};
const suggestionStatusLabel = (suggestion: CatalogProductSuggestion) => {
  if (suggestion.price_available === false) return "ფასი დასაზუსტებელია";
  return suggestion.in_stock ? "მარაგშია" : "არ არის";
};
const suggestionStatusClass = (suggestion: CatalogProductSuggestion) => {
  if (suggestion.price_available === false) {
    return "border-warning/20 bg-warning/10 text-warning";
  }

  return suggestion.in_stock
    ? "border-success/20 bg-success/10 text-success"
    : "border-warning/20 bg-warning/10 text-warning";
};

const handleInputKeydown = async (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    closeAllSearchSurfaces();
    return;
  }

  if (event.key === "ArrowDown") {
    if (!showSuggestionList.value) return;
    event.preventDefault();
    activeSuggestionIndex.value =
      activeSuggestionIndex.value < suggestions.value.length - 1
        ? activeSuggestionIndex.value + 1
        : 0;
    return;
  }

  if (event.key === "ArrowUp") {
    if (!showSuggestionList.value) return;
    event.preventDefault();
    activeSuggestionIndex.value =
      activeSuggestionIndex.value > 0
        ? activeSuggestionIndex.value - 1
        : suggestions.value.length - 1;
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();

    if (showSuggestionList.value && hasActiveSuggestion.value) {
      await goToSuggestion(suggestions.value[activeSuggestionIndex.value]!);
      return;
    }

    await submitSearch();
  }
};

const syncSearchTextFromRoute = () => {
  clearCatalogRefinementsOnSubmit.value = false;
  searchText.value = extractSearchQueryFromRoute();
  const first = (value: unknown) => String((Array.isArray(value) ? value[0] : value) || "");
  const inCatalog = /^\/catalog(?:\/category\/[^/]+)?\/?$/.test(route.path);
  selectedMake.value = inCatalog ? first(route.query.make) : "";
  selectedModel.value = selectedMake.value ? first(route.query.model) : "";
  selectedYear.value = selectedMake.value ? first(route.query.year) : "";
  const category = inCatalog ? getCatalogCategorySlugFromPath(route.path) || first(route.query.category) : "";
  const plural = inCatalog ? first(route.query.categories) : "";
  selectedCategories.value = [...new Set((category ? [category] : plural.split(",")).filter(Boolean))].map((value) =>
    categories.value.find((item) => String(item.id) === value)?.slug || value,
  );
  activeSuggestionIndex.value = -1;
};

watch([normalizedSearchText, filtersKey], ([nextValue]) => {
  // Invalidate in-flight responses immediately, before the next debounce starts.
  resetSuggestionsState();

  if (!isSearchSurfaceOpen.value) return;

  if (nextValue.length < 2) {
    resetSuggestionsState();
    if (!nextValue.length) {
      void ensureCategoriesLoaded();
    }
    return;
  }

  suggestionsPending.value = true;
  fetchSuggestionsDebounced(nextValue);
}, { flush: "sync" });

watch(() => route.fullPath, closeAllSearchSurfaces);
watch(headerRouteKey, syncSearchTextFromRoute);

watch(isMobileViewport, (isMobile) => {
  if (isMobile) {
    closeDesktopPanel();
    return;
  }

  closeMobileSheet();
});

onMounted(() => {
  // Remove history left by older versions; this panel no longer persists searches.
  try {
    window.localStorage.removeItem("flexdrive-header-searches");
  } catch {
    // Search remains available when browser storage is blocked.
  }
  syncSearchTextFromRoute();
});

onBeforeUnmount(() => {
  disposed = true;
  ++vehicleRequestId;
  resetSuggestionsState();
});

onClickOutside(rootRef, () => {
  if (showDesktopPanel.value) {
    closeDesktopPanel();
  }
});

defineExpose({
  openMobileSheet,
});

</script>

<template>
  <div ref="rootRef" class="w-full min-w-0">
    <div v-if="!props.sheetOnly" class="relative hidden md:block">
      <form
        class="flex items-center gap-2 rounded-[16px] border border-header-border bg-header-surface p-1.5 transition-colors focus-within:border-accent-primary focus-within:bg-surface"
        role="search"
        @submit.prevent="submitSearch"
      >
        <span class="flex h-10 w-10 shrink-0 items-center justify-center text-text-secondary" aria-hidden="true">
          <BaseIcon name="search" :size="18" />
        </span>
        <input
          v-model="searchText"
          type="search"
          :placeholder="searchPlaceholder"
          :aria-label="searchPlaceholder"
          :aria-expanded="showDesktopPanel"
          autocomplete="off"
          spellcheck="false"
          maxlength="255"
          class="h-11 min-w-0 flex-1 bg-transparent px-1 text-[15px] text-text-primary placeholder:text-text-muted focus:outline-none"
          @focus="openDesktopPanel"
          @click="openDesktopPanel"
          @keydown="handleInputKeydown"
        />
        <BaseButton type="submit" :disabled="!canSubmit">ძებნა</BaseButton>
      </form>
      <transition name="header-search-panel">
        <div
          v-if="showDesktopPanel"
          class="header-search-panel header-search-scroll absolute inset-x-0 top-[calc(100%+12px)] z-50 overflow-y-auto overscroll-contain rounded-[20px] border border-header-border bg-surface p-4 shadow-[0_28px_60px_-28px_var(--shadow-color)] md:p-5"
          @keydown.esc.stop="closeDesktopPanel"
        >
          <HeaderSearchFilters
            :make="selectedMake" :model="selectedModel" :year="selectedYear"
            :selected-categories="selectedCategories" :category-options="categoryOptions"
            :make-options="makeOptions" :model-options="modelOptions" :year-options="yearOptions"
            :categories-pending="categoriesPending" :makes-pending="makesPending"
            :vehicle-pending="vehiclePending" :error="filterError" :can-submit="canSubmit"
            @make="updateMake" @model="updateModel" @year="selectedYear = $event"
            @categories="selectedCategories = $event" @search="submitSearch"
            @clear="clearFilters" @retry="ensureFiltersLoaded"
          />
          <div v-if="normalizedSearchText" class="mt-4 border-t border-border-default pt-4" aria-live="polite" :aria-busy="suggestionsPending">
            <p v-if="showTypingHint" class="text-sm text-text-muted">ჩაწერე მინიმუმ 2 სიმბოლო.</p>
            <p v-else-if="suggestionsPending" class="text-sm text-text-muted">იტვირთება…</p>
            <p v-else-if="suggestionsError" class="text-sm text-warning">{{ suggestionsError }}</p>
            <ul v-else-if="showSuggestionList" class="space-y-2" aria-label="ნაპოვნი პროდუქტები">
              <li v-for="(suggestion, index) in suggestions" :key="suggestion.id">
                <button
                  type="button"
                  class="flex min-h-20 w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                  :class="index === activeSuggestionIndex ? 'border-accent-primary bg-accent-soft' : 'border-border-default bg-surface hover:bg-surface-2'"
                  @click="goToSuggestion(suggestion)"
                >
                  <span class="block h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                    <BasePicture
                      product-image
                      :data="suggestion.primary_image.desktop || suggestion.primary_image.tablet || suggestion.primary_image.mobile ? suggestion.primary_image : cardPlaceholderImage"
                      :alt="suggestion.primary_image.alt_text || suggestion.name" preset="search" fit="contain" lazy
                    />
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="header-search-result-title block text-sm font-semibold text-text-primary">{{ suggestion.name }}</span>
                    <span class="mt-1 block text-xs text-text-muted">{{ suggestion.fitment_summary }}</span>
                    <span class="mt-1 inline-flex rounded-md border px-2 py-0.5 text-xs" :class="suggestionStatusClass(suggestion)">{{ suggestionStatusLabel(suggestion) }}</span>
                  </span>
                  <span class="shrink-0 text-right text-sm font-bold text-accent-primary">{{ suggestion.price_available === false ? 'ფასი დასაზუსტებელია' : `${suggestionPriceLabel(suggestion)} GEL` }}</span>
                </button>
              </li>
            </ul>
            <p v-else-if="showNoResults" class="text-sm text-text-secondary">შედეგი ვერ მოიძებნა. შეცვალე სიტყვა ან არჩეული ფილტრები.</p>
            <BaseButton v-if="showSuggestionList" variant="ghost" class="mt-3 w-full items-center justify-center" @click="submitSearch">
              <span>ყველა შედეგის ნახვა</span>
              <span aria-hidden="true">→</span>
            </BaseButton>
          </div>
        </div>
      </transition>
    </div>

    <button
      v-if="!props.hideMobileTrigger && !props.sheetOnly"
      type="button"
      class="flex min-h-[52px] w-full items-center gap-3 rounded-[14px] border border-header-border bg-header-surface px-4 text-left text-sm text-text-secondary md:hidden"
      @click="openMobileSheet"
    >
      <BaseIcon name="search" :size="18" />
      <span class="min-w-0 truncate">{{ mobileTriggerLabel }}</span>
    </button>

    <Dialog :open="isMobileOpen" class="relative z-50 md:hidden" @close="closeMobileSheet">
      <div class="fixed inset-0 bg-text-primary/40" aria-hidden="true" />
      <div class="fixed inset-0 flex">
        <DialogPanel class="flex h-[100dvh] w-full min-w-0 flex-col bg-surface">
          <div class="shrink-0 border-b border-header-border px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <div class="mb-3 flex items-center justify-between gap-3">
              <DialogTitle class="text-base font-bold text-text-primary">ძებნა</DialogTitle>
              <BaseButton variant="ghost" aria-label="ძიების დახურვა" @click="closeMobileSheet">
                <span aria-hidden="true" class="text-2xl leading-none">×</span>
              </BaseButton>
            </div>
            <form role="search" class="flex items-center gap-2 rounded-lg border border-header-border bg-header-surface px-3 focus-within:border-accent-primary" @submit.prevent="submitSearch">
              <BaseIcon name="search" :size="18" class="shrink-0 text-text-muted" />
              <input
                ref="mobileInputRef" v-model="searchText" type="search"
                :placeholder="searchPlaceholder" :aria-label="searchPlaceholder"
                autocomplete="off" spellcheck="false" maxlength="255"
                class="h-12 min-w-0 flex-1 bg-transparent text-base text-text-primary placeholder:text-text-muted focus:outline-none"
                @keydown="handleInputKeydown"
              />
            </form>
          </div>
          <div class="header-search-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
            <HeaderSearchFilters
              :make="selectedMake" :model="selectedModel" :year="selectedYear"
              :selected-categories="selectedCategories" :category-options="categoryOptions"
              :make-options="makeOptions" :model-options="modelOptions" :year-options="yearOptions"
              :categories-pending="categoriesPending" :makes-pending="makesPending"
              :vehicle-pending="vehiclePending" :error="filterError" :can-submit="canSubmit"
              @make="updateMake" @model="updateModel" @year="selectedYear = $event"
              @categories="selectedCategories = $event" @search="submitSearch"
              @clear="clearFilters" @retry="ensureFiltersLoaded"
            />
            <div v-if="normalizedSearchText" class="mt-4 border-t border-border-default pt-4" aria-live="polite" :aria-busy="suggestionsPending">
              <p v-if="showTypingHint" class="text-sm text-text-muted">ჩაწერე მინიმუმ 2 სიმბოლო.</p>
              <p v-else-if="suggestionsPending" class="text-sm text-text-muted">იტვირთება…</p>
              <p v-else-if="suggestionsError" class="text-sm text-warning">{{ suggestionsError }}</p>
              <ul v-else-if="showSuggestionList" class="space-y-2" aria-label="ნაპოვნი პროდუქტები">
                <li v-for="(suggestion, index) in suggestions" :key="suggestion.id">
                  <button
                    type="button"
                    class="flex w-full items-start gap-3 rounded-lg border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                    :class="index === activeSuggestionIndex ? 'border-accent-primary bg-accent-soft' : 'border-border-default bg-surface'"
                    @click="goToSuggestion(suggestion)"
                  >
                    <span class="block h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                      <BasePicture
                        product-image
                        :data="suggestion.primary_image.desktop || suggestion.primary_image.tablet || suggestion.primary_image.mobile ? suggestion.primary_image : cardPlaceholderImage"
                        :alt="suggestion.primary_image.alt_text || suggestion.name" preset="search" fit="contain" lazy
                      />
                    </span>
                    <span class="min-w-0 flex-1">
                      <span class="header-search-result-title block text-sm font-semibold text-text-primary">{{ suggestion.name }}</span>
                      <span class="mt-1 block text-xs text-text-muted">{{ suggestion.fitment_summary }}</span>
                      <span class="mt-1 block text-sm font-bold text-accent-primary">{{ suggestion.price_available === false ? 'ფასი დასაზუსტებელია' : `${suggestionPriceLabel(suggestion)} GEL` }}</span>
                      <span class="mt-1 inline-flex rounded-md border px-2 py-0.5 text-xs" :class="suggestionStatusClass(suggestion)">{{ suggestionStatusLabel(suggestion) }}</span>
                    </span>
                  </button>
                </li>
              </ul>
              <p v-else-if="showNoResults" class="text-sm text-text-secondary">შედეგი ვერ მოიძებნა. შეცვალე სიტყვა ან არჩეული ფილტრები.</p>
              <BaseButton v-if="showSuggestionList" variant="ghost" class="mt-3 w-full justify-between" @click="submitSearch">
                <span>ყველა შედეგის ნახვა</span>
                <span aria-hidden="true">→</span>
              </BaseButton>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.header-search-panel { max-height: min(720px, calc(100dvh - 160px)); }
.header-search-result-title { overflow-wrap: anywhere; }
.header-search-scroll { scrollbar-width: thin; scrollbar-color: var(--border-muted) transparent; }
.header-search-panel-enter-active,
.header-search-panel-leave-active { transition: opacity 150ms ease, transform 150ms ease; }
.header-search-panel-enter-from,
.header-search-panel-leave-to { opacity: 0; transform: translateY(-4px); }
@media (prefers-reduced-motion: reduce) {
  .header-search-panel-enter-active,
  .header-search-panel-leave-active { transition: none; }
}
</style>
