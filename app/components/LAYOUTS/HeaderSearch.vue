<script setup lang="ts">
import { onClickOutside, useDebounceFn, useMediaQuery } from "@vueuse/core";
import BasePicture from "~/components/common/BasePicture.vue";
import { useCatalogApi } from "~/composables/catalog/useCatalogApi";
import { useCatalogPlaceholderMedia } from "~/composables/catalog/useCatalogPlaceholderMedia";
import { buildCatalogCategoryPath } from "~/utils/routePaths";
import type {
  CatalogCategoryItem,
  CatalogProductSuggestion,
} from "~/types/catalog";

const emit = defineEmits<{
  (e: "open-mobile-search"): void;
}>();

const props = withDefaults(
  defineProps<{
    hideMobileTrigger?: boolean;
  }>(),
  {
    hideMobileTrigger: false,
  },
);

const route = useRoute();
const router = useRouter();
const isMobileViewport = useMediaQuery("(max-width: 639px)");
const { getCatalogCategoriesRaw, getCatalogProductSuggestions } =
  useCatalogApi();
const { cardPlaceholderImage } = useCatalogPlaceholderMedia();

const rootRef = ref<HTMLElement | null>(null);
const mobileInputRef = ref<HTMLInputElement | null>(null);

const RECENT_SEARCHES_KEY = "automate-header-searches";
const RECENT_SEARCHES_LIMIT = 5;
const searchPlaceholder = "მოძებნე ნაწილი, OEM, SKU ან VIN";
const quickSearchModes = [
  {
    label: "ნაწილი",
    copy: "პროდუქტის სახელით",
  },
  {
    label: "OEM/SKU",
    copy: "კოდით ან არტიკულით",
  },
  {
    label: "VIN",
    copy: "მომავალი VIN flow-სთვის",
  },
];

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
const recentSearches = ref<string[]>([]);
const latestSuggestionsRequestId = ref(0);
const lastCompletedQuery = ref("");

const emptyStateTitle = "სწრაფი ძებნა";
const emptyStateCopy =
  "დაიწყე ნაწილის სახელის, OEM-ის, SKU-ის ან VIN-ის ჩაწერა, ან აირჩიე კატეგორია.";

const normalizedSearchText = computed(() => searchText.value.trim());
const quickCategories = computed(() => categories.value.slice(0, 5));
const showDesktopPanel = computed(
  () => !isMobileViewport.value && isDesktopOpen.value,
);
const isSearchSurfaceOpen = computed(
  () => isDesktopOpen.value || isMobileOpen.value,
);
const hasEnoughCharacters = computed(
  () => normalizedSearchText.value.length >= 2,
);
const showDiscoveryState = computed(
  () => normalizedSearchText.value.length === 0,
);
const showTypingHint = computed(() => normalizedSearchText.value.length === 1);
const showSuggestionList = computed(
  () =>
    hasEnoughCharacters.value &&
    !suggestionsPending.value &&
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

const loadRecentSearches = () => {
  if (!import.meta.client) return;

  const rawValue = window.localStorage.getItem(RECENT_SEARCHES_KEY);
  if (!rawValue) return;

  try {
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) {
      recentSearches.value = parsed
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, RECENT_SEARCHES_LIMIT);
    }
  } catch {
    recentSearches.value = [];
  }
};

const persistRecentSearches = () => {
  if (!import.meta.client) return;
  window.localStorage.setItem(
    RECENT_SEARCHES_KEY,
    JSON.stringify(recentSearches.value.slice(0, RECENT_SEARCHES_LIMIT)),
  );
};

const saveRecentSearch = (value: string) => {
  const normalizedValue = value.trim();
  if (!normalizedValue || !import.meta.client) return;

  recentSearches.value = [
    normalizedValue,
    ...recentSearches.value.filter((item) => item !== normalizedValue),
  ].slice(0, RECENT_SEARCHES_LIMIT);

  persistRecentSearches();
};

const resetSuggestionsState = () => {
  activeSuggestionIndex.value = -1;
  suggestions.value = [];
  suggestionsPending.value = false;
  suggestionsError.value = null;
  lastCompletedQuery.value = "";
};

const ensureCategoriesLoaded = async () => {
  if (categoriesLoaded.value || categoriesPending.value) return;

  categoriesPending.value = true;

  try {
    categories.value = (await getCatalogCategoriesRaw()) ?? [];
    categoriesLoaded.value = true;
  } finally {
    categoriesPending.value = false;
  }
};

const fetchSuggestions = async (query: string) => {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length < 2) {
    resetSuggestionsState();
    return;
  }

  const requestId = ++latestSuggestionsRequestId.value;
  suggestionsPending.value = true;
  suggestionsError.value = null;

  try {
    const response = await getCatalogProductSuggestions(normalizedQuery);

    if (requestId !== latestSuggestionsRequestId.value) return;

    suggestions.value = response;
    lastCompletedQuery.value = normalizedQuery;
  } catch {
    if (requestId !== latestSuggestionsRequestId.value) return;

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
};

const closeMobileSheet = () => {
  isMobileOpen.value = false;
  activeSuggestionIndex.value = -1;
};

const closeAllSearchSurfaces = () => {
  closeDesktopPanel();
  closeMobileSheet();
};

const openDesktopPanel = async () => {
  if (isMobileViewport.value) return;

  isDesktopOpen.value = true;
  activeSuggestionIndex.value = -1;

  if (normalizedSearchText.value.length >= 2) {
    void fetchSuggestions(normalizedSearchText.value);
    return;
  }

  await ensureCategoriesLoaded();
};

const openMobileSheet = async () => {
  emit("open-mobile-search");
  isMobileOpen.value = true;
  activeSuggestionIndex.value = -1;
  await ensureCategoriesLoaded();
  await nextTick();
  mobileInputRef.value?.focus();
};

const submitSearch = async () => {
  const normalizedQuery = normalizedSearchText.value;
  if (!normalizedQuery) return;

  saveRecentSearch(normalizedQuery);
  closeAllSearchSurfaces();

  await router.push({
    path: "/catalog",
    query: {
      q: normalizedQuery,
    },
  });
};

const goToSuggestion = async (suggestion: CatalogProductSuggestion) => {
  saveRecentSearch(normalizedSearchText.value || suggestion.name);
  closeAllSearchSurfaces();
  await navigateTo(`/catalog/${suggestion.slug}`);
};

const applyRecentSearch = async (value: string) => {
  searchText.value = value;
  await submitSearch();
};

const goToCategory = async (category: CatalogCategoryItem) => {
  closeAllSearchSurfaces();
  await router.push(buildCatalogCategoryPath(category.slug));
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
  searchText.value = extractSearchQueryFromRoute();
  activeSuggestionIndex.value = -1;
};

watch(normalizedSearchText, (nextValue) => {
  activeSuggestionIndex.value = -1;

  if (!isSearchSurfaceOpen.value) return;

  if (nextValue.length < 2) {
    resetSuggestionsState();
    if (!nextValue.length) {
      void ensureCategoriesLoaded();
    }
    return;
  }

  fetchSuggestionsDebounced(nextValue);
});

watch(
  () => route.fullPath,
  () => {
    closeAllSearchSurfaces();
    syncSearchTextFromRoute();
  },
);

watch(isMobileViewport, (isMobile) => {
  if (isMobile) {
    closeDesktopPanel();
    return;
  }

  closeMobileSheet();
});

watch(isMobileOpen, (isOpen) => {
  if (!import.meta.client) return;
  document.body.style.overflow = isOpen ? "hidden" : "";
});

onMounted(() => {
  loadRecentSearches();
  syncSearchTextFromRoute();
});

onBeforeUnmount(() => {
  if (!import.meta.client) return;
  document.body.style.overflow = "";
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
  <div class="w-full" ref="rootRef">
    <div class="hidden sm:block">
      <div class="relative">
        <form
          class="group flex items-center gap-2 rounded-[16px] border border-header-border bg-header-surface p-1.5 shadow-[0_12px_26px_-22px_var(--shadow-color)] transition-[border-color,box-shadow,background-color] duration-200 focus-within:border-accent-primary focus-within:bg-surface focus-within:shadow-[0_14px_34px_-22px_rgba(82,120,32,0.32)]"
          @submit.prevent="submitSearch"
        >
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-surface text-text-secondary transition-colors duration-200 group-focus-within:text-accent-primary"
          >
            <BaseIcon name="search" :size="18" />
          </div>

          <input
            v-model="searchText"
            type="search"
            :placeholder="searchPlaceholder"
            autocomplete="off"
            spellcheck="false"
            :aria-expanded="showDesktopPanel"
            aria-autocomplete="list"
            class="h-11 min-w-0 flex-1 bg-transparent px-1 text-[15px] text-text-primary placeholder:text-text-muted focus:outline-none"
            @focus="openDesktopPanel"
            @keydown="handleInputKeydown"
          />

          <button
            type="submit"
            class="hidden min-h-[44px] shrink-0 upper items-center gap-2 rounded-[12px] bg-accent-primary px-4 text-sm font-semibold text-text-invert transition-colors duration-200 hover:bg-accent-hover md:inline-flex"
          >
            ძებნა
          </button>

          <button
            type="submit"
            aria-label="ძებნა"
            class="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[12px] bg-accent-primary text-text-invert transition-colors duration-200 hover:bg-accent-hover md:hidden"
          >
            <BaseIcon name="search" :size="16" />
          </button>
        </form>

        <transition name="header-search-panel">
          <div
            v-if="showDesktopPanel"
            class="absolute left-0 right-0 top-[calc(100%+12px)] z-50 overflow-hidden rounded-[24px] border border-header-border bg-surface shadow-[0_28px_60px_-28px_rgba(2,6,23,0.25)]"
          >
            <div
              class="header-search-scroll max-h-[min(70vh,640px)] overflow-y-auto p-4 md:p-5"
            >
              <div
                v-if="showDiscoveryState"
                class="grid gap-5 lg:grid-cols-[1.2fr_0.9fr]"
              >
                <section
                  class="rounded-[20px] border border-border-default bg-surface-2/70 p-4"
                >
                  <p
                    class="text-xs font-semibold uppercase tracking-[0.14em] text-accent-primary"
                  >
                    {{ emptyStateTitle }}
                  </p>
                  <p class="mt-2 text-sm leading-6 text-text-secondary">
                    {{ emptyStateCopy }}
                  </p>

                  <ul class="mt-4 grid gap-2 sm:grid-cols-3">
                    <li
                      v-for="mode in quickSearchModes"
                      :key="mode.label"
                      class="rounded-[14px] border border-border-default bg-surface px-3 py-2"
                    >
                      <span
                        class="block text-[12px] font-bold text-text-primary"
                      >
                        {{ mode.label }}
                      </span>
                      <span class="mt-0.5 block text-[11px] text-text-muted">
                        {{ mode.copy }}
                      </span>
                    </li>
                  </ul>

                  <div class="mt-5">
                    <p class="text-sm font-semibold text-text-primary">
                      ბოლო ძებნები
                    </p>
                    <div
                      v-if="recentSearches.length"
                      class="mt-3 flex flex-wrap gap-2"
                    >
                      <button
                        v-for="term in recentSearches"
                        :key="term"
                        type="button"
                        class="inline-flex min-h-[40px] items-center rounded-full border border-border-default bg-surface px-4 text-sm text-text-secondary transition-colors duration-200 hover:border-accent-primary hover:text-accent-primary"
                        @click="applyRecentSearch(term)"
                      >
                        {{ term }}
                      </button>
                    </div>
                    <p v-else class="mt-3 text-sm leading-6 text-text-muted">
                      ძებნის ისტორია აქ გამოჩნდება.
                    </p>
                  </div>
                </section>

                <section
                  class="rounded-[20px] border border-border-default bg-surface p-4"
                >
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-sm font-semibold text-text-primary">
                      პოპულარული კატეგორიები
                    </p>
                    <NuxtLink
                      to="/catalog"
                      class="text-sm font-semibold text-accent-primary transition-colors duration-200 hover:text-accent-hover"
                    >
                      კატალოგი
                    </NuxtLink>
                  </div>

                  <div
                    v-if="categoriesPending && !quickCategories.length"
                    class="mt-4 space-y-2"
                  >
                    <div
                      v-for="index in 5"
                      :key="index"
                      class="h-11 animate-pulse rounded-[14px] border border-border-default bg-surface-2"
                    />
                  </div>

                  <div v-else class="mt-4 grid gap-2">
                    <button
                      v-for="category in quickCategories"
                      :key="category.id"
                      type="button"
                      class="group flex min-h-[52px] items-center justify-between rounded-[16px] border border-border-default bg-surface-2 px-4 text-left transition-colors duration-200 hover:border-accent-primary hover:bg-header-hover"
                      @click="goToCategory(category)"
                    >
                      <span class="min-w-0">
                        <span
                          class="block text-sm font-semibold text-text-primary"
                        >
                          {{ category.name }}
                        </span>
                        <span class="mt-1 block text-xs text-text-muted">
                          {{ category.product_count }} პროდუქტი
                        </span>
                      </span>
                      <span
                        class="text-sm font-semibold text-text-muted transition-colors duration-200 group-hover:text-accent-primary"
                      >
                        →
                      </span>
                    </button>
                  </div>
                </section>
              </div>

              <div
                v-else-if="showTypingHint"
                class="rounded-[20px] border border-border-default bg-surface-2/70 px-4 py-6 text-sm text-text-secondary"
              >
                ჩაწერე მინიმუმ 2 სიმბოლო, რომ შესაბამისი პროდუქტები გაჩვენოთ.
              </div>

              <div v-else-if="suggestionsPending" class="space-y-3">
                <div
                  v-for="index in 5"
                  :key="index"
                  class="flex items-center gap-3 rounded-[18px] border border-border-default bg-surface-2/70 p-3"
                >
                  <div
                    class="h-16 w-16 animate-pulse rounded-[14px] bg-surface"
                  />
                  <div class="min-w-0 flex-1 space-y-2">
                    <div
                      class="h-4 w-3/5 animate-pulse rounded-full bg-surface"
                    />
                    <div
                      class="h-3 w-2/5 animate-pulse rounded-full bg-surface"
                    />
                  </div>
                  <div class="h-4 w-16 animate-pulse rounded-full bg-surface" />
                </div>
              </div>

              <div
                v-else-if="suggestionsError"
                class="rounded-[20px] border border-error/20 bg-error/5 px-4 py-6 text-sm text-text-secondary"
              >
                <p class="font-semibold text-text-primary">
                  {{ suggestionsError }}
                </p>
                <button
                  type="button"
                  class="mt-4 inline-flex min-h-[40px] items-center rounded-full border border-accent-primary px-4 text-sm font-semibold text-accent-primary transition-colors duration-200 hover:bg-accent-primary hover:text-text-invert"
                  @click="fetchSuggestions(normalizedSearchText)"
                >
                  ხელახლა ცდა
                </button>
              </div>

              <div v-else-if="showSuggestionList" class="space-y-3">
                <section>
                  <div class="mb-3 flex items-center justify-between gap-3">
                    <p class="text-sm font-semibold text-text-primary">
                      შესაბამისი პროდუქტები
                    </p>
                    <p
                      class="text-xs uppercase tracking-[0.14em] text-text-muted"
                    >
                      {{ suggestions.length }} შედეგი
                    </p>
                  </div>

                  <div class="space-y-2">
                    <button
                      v-for="(suggestion, index) in suggestions"
                      :key="suggestion.id"
                      type="button"
                      :class="[
                        'group flex w-full items-center gap-3 rounded-[18px] border p-3 text-left transition-colors duration-200',
                        index === activeSuggestionIndex
                          ? 'border-accent-primary bg-header-hover'
                          : 'border-border-default bg-surface hover:border-accent-primary hover:bg-header-hover/70',
                      ]"
                      @mouseenter="activeSuggestionIndex = index"
                      @click="goToSuggestion(suggestion)"
                    >
                      <div
                        class="h-16 w-16 shrink-0 overflow-hidden rounded-[14px] border border-border-default bg-surface-2"
                      >
                        <BasePicture
                          :data="
                            suggestion.primary_image.desktop ||
                            suggestion.primary_image.tablet ||
                            suggestion.primary_image.mobile
                              ? suggestion.primary_image
                              : cardPlaceholderImage
                          "
                          :alt="
                            suggestion.primary_image.alt_text || suggestion.name
                          "
                          preset="search"
                          class="h-full w-full"
                          fit="cover"
                          lazy
                        />
                      </div>

                      <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center gap-2">
                          <p
                            class="header-search-result-title text-sm font-semibold text-text-primary"
                          >
                            {{ suggestion.name }}
                          </p>
                          <span
                            class="inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold"
                            :class="
                              suggestion.in_stock
                                ? 'border-success/20 bg-success/10 text-success'
                                : 'border-warning/20 bg-warning/10 text-warning'
                            "
                          >
                            {{
                              suggestion.in_stock
                                ? "მარაგშია"
                                : "არ არის მარაგში"
                            }}
                          </span>
                        </div>
                        <p class="mt-1 text-xs text-text-muted">
                          {{ suggestion.category.name }}
                        </p>
                      </div>

                      <div class="shrink-0 text-right">
                        <p class="text-sm font-bold text-accent-primary">
                          {{ suggestion.price }} GEL
                        </p>
                        <p
                          class="mt-1 text-xs text-text-muted transition-colors duration-200 group-hover:text-accent-primary"
                        >
                          დეტალები →
                        </p>
                      </div>
                    </button>
                  </div>
                </section>

                <button
                  type="button"
                  class="flex min-h-[54px] w-full items-center justify-between rounded-[18px] border border-accent-primary/25 bg-accent-primary/6 px-4 text-left transition-colors duration-200 hover:border-accent-primary hover:bg-accent-primary/10"
                  @click="submitSearch"
                >
                  <span>
                    <span class="block text-sm font-semibold text-text-primary">
                      ყველა შედეგის ნახვა
                    </span>
                    <span class="mt-1 block text-xs text-text-muted">
                      მოთხოვნა: “{{ normalizedSearchText }}”
                    </span>
                  </span>
                  <span class="text-sm font-semibold text-accent-primary">
                    →
                  </span>
                </button>
              </div>

              <div
                v-else-if="showNoResults"
                class="grid gap-4 rounded-[22px] border border-border-default bg-surface-2/60 p-4 md:grid-cols-[1.1fr_0.9fr]"
              >
                <section>
                  <p
                    class="text-xs font-semibold uppercase tracking-[0.14em] text-accent-primary"
                  >
                    შედეგი ვერ მოიძებნა
                  </p>
                  <p class="mt-2 text-base font-semibold text-text-primary">
                    “{{ normalizedSearchText }}” შესაბამის პროდუქტებში ვერ
                    ვიპოვეთ.
                  </p>
                  <p class="mt-2 text-sm leading-6 text-text-secondary">
                    სცადე სხვა სიტყვა, OEM, SKU, VIN ან გადადი სრულ კატალოგში.
                  </p>

                  <button
                    type="button"
                    class="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-accent-primary px-5 text-sm font-semibold text-text-invert transition-colors duration-200 hover:bg-accent-hover"
                    @click="submitSearch"
                  >
                    კატალოგში ძებნა
                  </button>
                </section>

                <section
                  class="rounded-[18px] border border-border-default bg-surface p-4"
                >
                  <p class="text-sm font-semibold text-text-primary">
                    სცადე ეს კატეგორიები
                  </p>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <button
                      v-for="category in quickCategories"
                      :key="category.id"
                      type="button"
                      class="inline-flex min-h-[40px] items-center rounded-full border border-border-default px-4 text-sm text-text-secondary transition-colors duration-200 hover:border-accent-primary hover:text-accent-primary"
                      @click="goToCategory(category)"
                    >
                      {{ category.name }}
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <div v-if="!props.hideMobileTrigger" class="sm:hidden">
      <button
        type="button"
        class="flex min-h-[52px] w-full items-center gap-3 rounded-[14px] border border-header-border bg-header-surface px-3 text-left shadow-[0_12px_26px_-22px_var(--shadow-color)] transition-colors duration-200 hover:border-accent-primary hover:bg-surface"
        @click="openMobileSheet"
      >
        <span
          class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-surface text-text-secondary"
        >
          <BaseIcon name="search" :size="18" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-medium text-text-primary">
            {{ mobileTriggerLabel }}
          </span>
          <span class="mt-0.5 block text-xs text-text-muted">
            OEM, SKU ან VIN
          </span>
        </span>
      </button>
    </div>

    <transition name="header-search-sheet">
      <div
        v-if="isMobileOpen"
        class="fixed inset-0 z-50 bg-[rgba(2,6,23,0.46)] sm:hidden"
        @click="closeMobileSheet"
      >
        <section
          class="absolute inset-x-0 top-0 flex max-h-[100dvh] min-h-[100dvh] flex-col rounded-b-[24px] border-b border-header-border bg-header-bg"
          @click.stop
        >
          <div
            class="border-b border-header-border bg-header-bg/95 px-4 pb-4 pt-5 backdrop-blur"
          >
            <div class="mb-3 flex items-center justify-between gap-3">
              <div>
                <p
                  class="text-xs font-semibold uppercase tracking-[0.14em] text-accent-primary"
                >
                  სწრაფი ძებნა
                </p>
                <p class="mt-1 text-sm text-text-secondary">
                  ნაწილი, OEM, SKU ან VIN ერთ ველში
                </p>
              </div>

              <button
                type="button"
                aria-label="ძიების დახურვა"
                class="inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-header-border text-text-secondary transition-colors duration-200 hover:border-accent-primary hover:bg-header-hover hover:text-accent-primary"
                @click="closeMobileSheet"
              >
                <span class="text-xl leading-none">×</span>
              </button>
            </div>

            <form
              class="flex items-center gap-2 rounded-[16px] border border-header-border bg-header-surface p-1.5 shadow-[0_12px_26px_-22px_var(--shadow-color)]"
              @submit.prevent="submitSearch"
            >
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-surface text-text-secondary"
              >
                <BaseIcon name="search" :size="18" />
              </div>

              <input
                ref="mobileInputRef"
                v-model="searchText"
                type="search"
                :placeholder="searchPlaceholder"
                autocomplete="off"
                spellcheck="false"
                class="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-text-primary placeholder:text-text-muted focus:outline-none"
                @keydown="handleInputKeydown"
              />

              <button
                type="submit"
                class="inline-flex min-h-[44px] items-center rounded-[12px] bg-accent-primary px-4 text-sm font-semibold text-text-invert transition-colors duration-200 hover:bg-accent-hover"
              >
                ძებნა
              </button>
            </form>
          </div>

          <div class="header-search-scroll flex-1 overflow-y-auto px-4 pb-6 pt-4">
            <div v-if="showDiscoveryState" class="space-y-4">
              <section
                class="rounded-[20px] border border-border-default bg-surface p-4"
              >
                <p class="text-sm font-semibold text-text-primary">
                  როგორ შეგიძლია მოძებნო
                </p>
                <ul class="mt-3 grid gap-2">
                  <li
                    v-for="mode in quickSearchModes"
                    :key="mode.label"
                    class="rounded-[14px] border border-border-default bg-surface-2 px-3 py-2"
                  >
                    <span class="block text-xs font-bold text-text-primary">
                      {{ mode.label }}
                    </span>
                    <span class="mt-0.5 block text-xs text-text-muted">
                      {{ mode.copy }}
                    </span>
                  </li>
                </ul>
              </section>

              <section
                class="rounded-[20px] border border-border-default bg-surface p-4"
              >
                <p class="text-sm font-semibold text-text-primary">
                  ბოლო ძებნები
                </p>
                <div
                  v-if="recentSearches.length"
                  class="mt-3 flex flex-wrap gap-2"
                >
                  <button
                    v-for="term in recentSearches"
                    :key="term"
                    type="button"
                    class="inline-flex min-h-[40px] items-center rounded-full border border-border-default bg-surface-2 px-4 text-sm text-text-secondary transition-colors duration-200 hover:border-accent-primary hover:text-accent-primary"
                    @click="applyRecentSearch(term)"
                  >
                    {{ term }}
                  </button>
                </div>
                <p v-else class="mt-3 text-sm leading-6 text-text-muted">
                  ძებნის ისტორია აქ გამოჩნდება.
                </p>
              </section>

              <section
                class="rounded-[20px] border border-border-default bg-surface p-4"
              >
                <p class="text-sm font-semibold text-text-primary">
                  პოპულარული კატეგორიები
                </p>

                <div
                  v-if="categoriesPending && !quickCategories.length"
                  class="mt-4 space-y-2"
                >
                  <div
                    v-for="index in 5"
                    :key="index"
                    class="h-11 animate-pulse rounded-[14px] bg-surface-2"
                  />
                </div>

                <div v-else class="mt-4 grid gap-2">
                  <button
                    v-for="category in quickCategories"
                    :key="category.id"
                    type="button"
                    class="flex min-h-[52px] items-center justify-between rounded-[16px] border border-border-default bg-surface-2 px-4 text-left transition-colors duration-200 hover:border-accent-primary hover:bg-header-hover"
                    @click="goToCategory(category)"
                  >
                    <span>
                      <span
                        class="block text-sm font-semibold text-text-primary"
                      >
                        {{ category.name }}
                      </span>
                      <span class="mt-1 block text-xs text-text-muted">
                        {{ category.product_count }} პროდუქტი
                      </span>
                    </span>
                    <span class="text-sm font-semibold text-text-muted">
                      →
                    </span>
                  </button>
                </div>
              </section>
            </div>

            <div
              v-else-if="showTypingHint"
              class="rounded-[20px] border border-border-default bg-surface px-4 py-6 text-sm text-text-secondary"
            >
              ჩაწერე მინიმუმ 2 სიმბოლო, რომ შესაბამისი პროდუქტები გაჩვენოთ.
            </div>

            <div v-else-if="suggestionsPending" class="space-y-3">
              <div
                v-for="index in 5"
                :key="index"
                class="flex items-center gap-3 rounded-[18px] border border-border-default bg-surface p-3"
              >
                <div
                  class="h-16 w-16 animate-pulse rounded-[14px] bg-surface-2"
                />
                <div class="min-w-0 flex-1 space-y-2">
                  <div
                    class="h-4 w-3/5 animate-pulse rounded-full bg-surface-2"
                  />
                  <div
                    class="h-3 w-2/5 animate-pulse rounded-full bg-surface-2"
                  />
                </div>
                <div class="h-4 w-16 animate-pulse rounded-full bg-surface-2" />
              </div>
            </div>

            <div
              v-else-if="suggestionsError"
              class="rounded-[20px] border border-error/20 bg-error/5 px-4 py-6 text-sm text-text-secondary"
            >
              <p class="font-semibold text-text-primary">
                {{ suggestionsError }}
              </p>
              <button
                type="button"
                class="mt-4 inline-flex min-h-[40px] items-center rounded-full border border-accent-primary px-4 text-sm font-semibold text-accent-primary transition-colors duration-200 hover:bg-accent-primary hover:text-text-invert"
                @click="fetchSuggestions(normalizedSearchText)"
              >
                ხელახლა ცდა
              </button>
            </div>

            <div v-else-if="showSuggestionList" class="space-y-3">
              <button
                v-for="(suggestion, index) in suggestions"
                :key="suggestion.id"
                type="button"
                :class="[
                  'group flex w-full items-center gap-3 rounded-[18px] border p-3 text-left transition-colors duration-200',
                  index === activeSuggestionIndex
                    ? 'border-accent-primary bg-header-hover'
                    : 'border-border-default bg-surface hover:border-accent-primary hover:bg-header-hover/70',
                ]"
                @click="goToSuggestion(suggestion)"
                @mouseenter="activeSuggestionIndex = index"
              >
                <div
                  class="h-16 w-16 shrink-0 overflow-hidden rounded-[14px] border border-border-default bg-surface-2"
                >
                  <BasePicture
                    :data="
                      suggestion.primary_image.desktop ||
                      suggestion.primary_image.tablet ||
                      suggestion.primary_image.mobile
                        ? suggestion.primary_image
                        : cardPlaceholderImage
                    "
                    :alt="suggestion.primary_image.alt_text || suggestion.name"
                    preset="search"
                    class="h-full w-full"
                    fit="cover"
                    lazy
                  />
                </div>

                <div class="min-w-0 flex-1">
                  <p
                    class="header-search-result-title text-sm font-semibold text-text-primary"
                  >
                    {{ suggestion.name }}
                  </p>
                  <p class="mt-1 text-xs text-text-muted">
                    {{ suggestion.category.name }}
                  </p>
                  <p class="mt-2 text-sm font-bold text-accent-primary">
                    {{ suggestion.price }} GEL
                  </p>
                </div>

                <span
                  class="inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold"
                  :class="
                    suggestion.in_stock
                      ? 'border-success/20 bg-success/10 text-success'
                      : 'border-warning/20 bg-warning/10 text-warning'
                  "
                >
                  {{ suggestion.in_stock ? "მარაგშია" : "არ არის" }}
                </span>
              </button>

              <button
                type="button"
                class="flex min-h-[54px] w-full items-center justify-between rounded-[18px] border border-accent-primary/25 bg-accent-primary/6 px-4 text-left transition-colors duration-200 hover:border-accent-primary hover:bg-accent-primary/10"
                @click="submitSearch"
              >
                <span>
                  <span class="block text-sm font-semibold text-text-primary">
                    ყველა შედეგის ნახვა
                  </span>
                  <span class="mt-1 block text-xs text-text-muted">
                    მოთხოვნა: “{{ normalizedSearchText }}”
                  </span>
                </span>
                <span class="text-sm font-semibold text-accent-primary">→</span>
              </button>
            </div>

            <div
              v-else-if="showNoResults"
              class="rounded-[22px] border border-border-default bg-surface p-4"
            >
              <p
                class="text-xs font-semibold uppercase tracking-[0.14em] text-accent-primary"
              >
                შედეგი ვერ მოიძებნა
              </p>
              <p class="mt-2 text-base font-semibold text-text-primary">
                “{{ normalizedSearchText }}” შესაბამის პროდუქტებში ვერ ვიპოვეთ.
              </p>
              <p class="mt-2 text-sm leading-6 text-text-secondary">
                სცადე სხვა სიტყვა, OEM, SKU, VIN ან აირჩიე კატეგორია ქვემოთ.
              </p>

              <div class="mt-4 flex flex-wrap gap-2">
                <button
                  v-for="category in quickCategories"
                  :key="category.id"
                  type="button"
                  class="inline-flex min-h-[40px] items-center rounded-full border border-border-default px-4 text-sm text-text-secondary transition-colors duration-200 hover:border-accent-primary hover:text-accent-primary"
                  @click="goToCategory(category)"
                >
                  {{ category.name }}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.header-search-result-title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.header-search-scroll {
  scrollbar-color: var(--accent-primary) transparent;
  scrollbar-width: thin;
}

.header-search-scroll::-webkit-scrollbar {
  width: 8px;
}

.header-search-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.header-search-scroll::-webkit-scrollbar-thumb {
  border: 2px solid var(--surface);
  border-radius: 999px;
  background: var(--accent-primary);
}

.header-search-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--accent-hover);
}

.header-search-panel-enter-active,
.header-search-panel-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.22s ease;
}

.header-search-panel-enter-from,
.header-search-panel-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.header-search-sheet-enter-active,
.header-search-sheet-leave-active {
  transition: opacity 0.22s ease;
}

.header-search-sheet-enter-active section,
.header-search-sheet-leave-active section {
  transition: transform 0.24s ease;
}

.header-search-sheet-enter-from,
.header-search-sheet-leave-to {
  opacity: 0;
}

.header-search-sheet-enter-from section,
.header-search-sheet-leave-to section {
  transform: translateY(-24px);
}

@media (prefers-reduced-motion: reduce) {
  .header-search-panel-enter-active,
  .header-search-panel-leave-active,
  .header-search-sheet-enter-active,
  .header-search-sheet-leave-active,
  .header-search-sheet-enter-active section,
  .header-search-sheet-leave-active section {
    transition: none;
  }
}
</style>
