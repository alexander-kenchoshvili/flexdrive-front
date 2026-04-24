<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core";
import { storeToRefs } from "pinia";
import type { LocationQuery, LocationQueryValue } from "vue-router";
import AppBreadcrumbs from "~/components/common/AppBreadcrumbs.vue";
import { useIndexingPolicy } from "~/composables/useIndexingPolicy";
import { useCatalogApi } from "~/composables/catalog/useCatalogApi";
import { resolveCmsCollectionSeoPolicy } from "~/utils/cmsCollectionSeo";
import {
  buildCatalogCategoryPath,
  getCatalogCategorySlugFromPath,
} from "~/utils/routePaths";
import { buildBreadcrumbStructuredData } from "~/utils/structuredData";
import type { SmartComponentData } from "~/types/page";
import type {
  CatalogCategoryItem,
  CatalogFilterCategory,
  CatalogListParams,
  CatalogListResponse,
  CatalogProductCardData,
  CatalogSort,
} from "~/types/catalog";
import CatalogFilters from "./parts/CatalogFilters.vue";
import CatalogMobileFilterSheet from "./parts/CatalogMobileFilterSheet.vue";
import CatalogMobileToolbar from "./parts/CatalogMobileToolbar.vue";
import CatalogToolbar from "./parts/CatalogToolbar.vue";
import ProductGrid from "./parts/ProductGrid.vue";

type CatalogSortOption = {
  label: string;
  value: CatalogSort;
  disabled?: boolean;
};

const props = defineProps<{
  data?: SmartComponentData;
}>();

const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();
const siteSettingsStore = useSiteSettings();
const { settings } = storeToRefs(siteSettingsStore);
const {
  getCatalogProducts,
  getCatalogProductsRaw,
  getCatalogCategories,
  getCatalogCategoriesRaw,
} = useCatalogApi();

const PAGE_SIZE = 9;
const SORT_VALUES: CatalogSort[] = [
  "recommended",
  "newest",
  "oldest",
  "price_asc",
  "price_desc",
  "name_asc",
  "name_desc",
];
const sortOptions: CatalogSortOption[] = [
  { value: "recommended", label: "რეკომენდირებული" },
  { value: "newest", label: "უახლესი" },
  { value: "price_asc", label: "ფასი: ზრდადობით" },
  { value: "price_desc", label: "ფასი: კლებადობით" },
];

const productsResponse = ref<CatalogListResponse | null>(null);
const categoriesResponse = ref<CatalogCategoryItem[]>([]);

const productsPending = ref(false);
const categoriesPending = ref(false);

const productsError = ref<unknown>(null);
const categoriesError = ref<unknown>(null);
const latestProductsRequestId = ref(0);
const latestCategoriesRequestId = ref(0);
const hasInitialized = ref(false);

const selectedSort = ref<CatalogSort>("recommended");
const searchQuery = ref("");
const selectedCategoryId = ref<number | null>(null);
const selectedCategorySlug = ref<string | null>(null);
const minPrice = ref("");
const maxPrice = ref("");
const currentPage = ref(1);
const isMobilePagination = useMediaQuery("(max-width: 640px)");
const isDesktopCatalogLayout = useMediaQuery("(min-width: 1024px)");
const isMobileFilterSheetOpen = ref(false);
const normalizedSearchQuery = computed(() => searchQuery.value.trim());
const hasActiveSearch = computed(() => Boolean(normalizedSearchQuery.value));

const normalizeUrl = (value: string) => value.replace(/\/+$/, "");
const toAbsoluteUrl = (siteUrl: string, pathOrUrl: string) => {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const normalizedSiteUrl = normalizeUrl(siteUrl);
  const normalizedPath = pathOrUrl.startsWith("/")
    ? pathOrUrl
    : `/${pathOrUrl}`;
  return `${normalizedSiteUrl}${normalizedPath}`;
};

const title = computed(() => (props.data?.title as string) || "კატალოგი");
const subtitle = computed(
  () =>
    (props.data?.subtitle as string) ||
    "შეარჩიე სასურველი პროდუქტი კატეგორიისა და ფასის მიხედვით.",
);
const pageSubtitle = computed(() => {
  if (hasActiveSearch.value) {
    return `ძიების შედეგები მოთხოვნისთვის "${normalizedSearchQuery.value}". გამოიყენე ფილტრები უფრო ზუსტი შედეგისთვის.`;
  }

  return subtitle.value;
});

const selectedCategoryLabel = computed(() => {
  if (!selectedCategorySlug.value) {
    return "";
  }

  return (
    categoriesResponse.value.find(
      (category) => category.slug === selectedCategorySlug.value,
    )?.name || ""
  );
});

const selectedCategory = computed(
  () =>
    categoriesResponse.value.find(
      (category) => category.slug === selectedCategorySlug.value,
    ) || null,
);
const selectedCategorySeo = computed(() => selectedCategory.value?.seo || null);
const collectionSeoPolicy = computed(() =>
  resolveCmsCollectionSeoPolicy(route.path || "/", route.query),
);
const hasCollectionQuery = computed(
  () => Object.keys(route.query || {}).length > 0,
);
const categoryCanonicalPath = computed(() => {
  if (hasCollectionQuery.value) {
    return collectionSeoPolicy.value?.canonicalPath || route.path || "/catalog";
  }

  return selectedCategorySeo.value?.canonical || route.path || "/catalog";
});
const siteUrl = computed(() =>
  normalizeUrl(String(config.public.siteUrl || "https://localhost:3000")),
);
const defaultSeoImage = computed(
  () =>
    String(
      settings.value?.default_seo_image || config.public.defaultSeoImage || "",
    ) || undefined,
);
const categoryCanonicalUrl = computed(() =>
  toAbsoluteUrl(siteUrl.value, categoryCanonicalPath.value),
);
const categorySeoTitle = computed(() => {
  if (selectedCategory.value) {
    const baseTitle =
      selectedCategorySeo.value?.title ||
      `${selectedCategory.value.name} კატეგორია`;
    return currentPage.value > 1
      ? `${baseTitle} - გვერდი ${currentPage.value}`
      : baseTitle;
  }

  if (currentPage.value > 1) {
    return `${title.value} - გვერდი ${currentPage.value}`;
  }

  return undefined;
});
const categorySeoDescription = computed(() => {
  if (!selectedCategory.value) {
    return undefined;
  }

  return (
    selectedCategorySeo.value?.description ||
    `დაათვალიერე ${selectedCategory.value.name} კატეგორიის ხარისხიანი ავტონაწილები FlexDrive-ზე.`
  );
});
const categorySeoImage = computed(
  () => selectedCategorySeo.value?.image || defaultSeoImage.value,
);
const { robots: categoryRobots } = useIndexingPolicy({
  pageNoindex: computed(() => Boolean(selectedCategorySeo.value?.noindex)),
});
const breadcrumbSchema = computed(() =>
  buildBreadcrumbStructuredData({
    items: breadcrumbItems.value,
    siteUrl: siteUrl.value,
    currentPath: categoryCanonicalPath.value,
  }),
);

const breadcrumbItems = computed(() => {
  const items: Array<{ label: string; to?: string }> = [
    { label: "მთავარი", to: "/" },
    { label: title.value, to: "/catalog" },
  ];

  if (selectedCategoryLabel.value) {
    items.push({ label: selectedCategoryLabel.value });
  }

  return items;
});

const resultCount = computed(() => productsResponse.value?.count ?? 0);
const totalPages = computed(() => productsResponse.value?.total_pages ?? 1);
const pageSize = computed(() => productsResponse.value?.page_size ?? PAGE_SIZE);
const paginationMaxPagesShown = computed(() =>
  isMobilePagination.value ? 3 : 5,
);
const paginationShowEndingButtons = computed(() => !isMobilePagination.value);
const hasActiveFilterSelection = computed(
  () =>
    selectedCategorySlug.value !== null ||
    Boolean(minPrice.value.trim()) ||
    Boolean(maxPrice.value.trim()),
);
const hasActiveMobileSheetControls = computed(
  () => hasActiveFilterSelection.value || selectedSort.value !== "recommended",
);
const hasCatalogControlsApplied = computed(
  () =>
    hasActiveSearch.value ||
    selectedSort.value !== "recommended" ||
    hasActiveFilterSelection.value,
);
const emptyStateTitle = computed(() =>
  hasActiveSearch.value
    ? "ასეთი პროდუქტი ვერ მოიძებნა."
    : "პროდუქტები არ მოიძებნა.",
);
const emptyStateDescription = computed(() => {
  if (hasActiveSearch.value) {
    return `მოთხოვნა "${normalizedSearchQuery.value}" შედეგს არ აბრუნებს. სცადე სხვა სიტყვა ან გაასუფთავე ფილტრები.`;
  }

  if (hasCatalogControlsApplied.value) {
    return "არჩეულ ფილტრებში პროდუქტები ვერ მოიძებნა. სცადე ფილტრების გასუფთავება.";
  }

  return "";
});

const mappedProducts = computed<CatalogProductCardData[]>(() => {
  const items = productsResponse.value?.results ?? [];
  return items.map((item) => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    subtitle: item.short_description,
    category: item.category?.name,
    price: Number(item.price),
    oldPrice: item.old_price ? Number(item.old_price) : null,
    image: item.primary_image,
    isNew: item.is_new,
    inStock: item.in_stock,
    onSale: item.on_sale,
  }));
});

const mappedCategories = computed<CatalogFilterCategory[]>(() => {
  if (categoriesResponse.value.length) {
    return categoriesResponse.value.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      count: category.product_count,
    }));
  }

  const fallback = productsResponse.value?.facets?.categories ?? [];
  return fallback.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    count: category.count,
  }));
});

const hasError = computed(() =>
  Boolean(productsError.value || categoriesError.value),
);
const isLoading = computed(
  () => productsPending.value || categoriesPending.value,
);
const hasCatalogData = computed(() => productsResponse.value !== null);
const isInitialLoading = computed(
  () => !hasInitialized.value && isLoading.value,
);
const hasBlockingError = computed(
  () => !isInitialLoading.value && hasError.value && !hasCatalogData.value,
);
const hasNonBlockingError = computed(
  () => !isInitialLoading.value && hasError.value && hasCatalogData.value,
);
const isRefreshingProducts = computed(
  () => hasInitialized.value && productsPending.value,
);
const showRefreshLoader = false;

const firstQueryValue = (
  value: LocationQueryValue | LocationQueryValue[] | undefined,
): string | undefined => {
  if (Array.isArray(value)) return value[0] ?? undefined;
  return value ?? undefined;
};

const toPositiveIntOrNull = (value: string | undefined): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const toSortValue = (value: string | undefined): CatalogSort => {
  if (!value) return "recommended";
  return SORT_VALUES.includes(value as CatalogSort)
    ? (value as CatalogSort)
    : "recommended";
};

const toNumericString = (value: string | undefined): string => {
  if (!value) return "";
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return "";
  return String(parsed);
};

const toOptionalNumber = (value: string): number | undefined => {
  const normalized = value.trim();
  if (!normalized) return undefined;

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
};

const syncSelectedCategoryFromRoute = (query: LocationQuery) => {
  const categorySlugFromPath = getCatalogCategorySlugFromPath(
    route.path || "/",
  );
  const categoryQueryValue = firstQueryValue(query.category);

  if (categorySlugFromPath) {
    selectedCategorySlug.value = categorySlugFromPath;
    selectedCategoryId.value =
      categoriesResponse.value.find(
        (category) => category.slug === categorySlugFromPath,
      )?.id || null;
    return;
  }

  const categoryIdFromQuery = toPositiveIntOrNull(categoryQueryValue);
  if (categoryIdFromQuery) {
    selectedCategoryId.value = categoryIdFromQuery;
    selectedCategorySlug.value =
      categoriesResponse.value.find(
        (category) => category.id === categoryIdFromQuery,
      )?.slug || null;
    return;
  }

  selectedCategorySlug.value = categoryQueryValue || null;
  selectedCategoryId.value =
    categoriesResponse.value.find(
      (category) => category.slug === selectedCategorySlug.value,
    )?.id || null;
};

const syncControlsFromRoute = (query: LocationQuery) => {
  searchQuery.value = firstQueryValue(query.q) || "";
  selectedSort.value = toSortValue(firstQueryValue(query.ordering));
  minPrice.value = toNumericString(firstQueryValue(query.min_price));
  maxPrice.value = toNumericString(firstQueryValue(query.max_price));
  currentPage.value = toPositiveIntOrNull(firstQueryValue(query.page)) ?? 1;
  syncSelectedCategoryFromRoute(query);
};

const setSelectedCategoryId = (value: number | null) => {
  selectedCategoryId.value = value;
  selectedCategorySlug.value =
    categoriesResponse.value.find((category) => category.id === value)?.slug ||
    null;
};

const buildParamsFromControls = (): CatalogListParams => {
  const params: CatalogListParams = {
    page: currentPage.value,
    page_size: PAGE_SIZE,
  };

  if (normalizedSearchQuery.value) {
    params.q = normalizedSearchQuery.value;
  }

  if (selectedSort.value !== "recommended") {
    params.ordering = selectedSort.value;
  }

  if (selectedCategorySlug.value) {
    params.category = selectedCategorySlug.value;
  } else if (selectedCategoryId.value) {
    params.category = selectedCategoryId.value;
  }

  const min = toOptionalNumber(minPrice.value);
  const max = toOptionalNumber(maxPrice.value);

  if (min !== undefined) params.min_price = min;
  if (max !== undefined) params.max_price = max;

  return params;
};

const buildRouteQueryFromControls = (page: number): Record<string, string> => {
  const query: Record<string, string> = {};

  if (normalizedSearchQuery.value) {
    query.q = normalizedSearchQuery.value;
  }

  if (selectedSort.value !== "recommended") {
    query.ordering = selectedSort.value;
  }

  if (minPrice.value.trim()) {
    query.min_price = minPrice.value.trim();
  }

  if (maxPrice.value.trim()) {
    query.max_price = maxPrice.value.trim();
  }

  if (page > 1) {
    query.page = String(page);
  }

  return query;
};

const buildRoutePathFromControls = () => {
  if (selectedCategorySlug.value) {
    return buildCatalogCategoryPath(selectedCategorySlug.value);
  }

  return "/catalog";
};

const normalizeRouteQuery = (query: LocationQuery): Record<string, string> => {
  const normalized: Record<string, string> = {};

  Object.entries(query).forEach(([key, value]) => {
    const parsed = firstQueryValue(value);
    if (parsed !== undefined && parsed !== "") {
      normalized[key] = parsed;
    }
  });

  return normalized;
};

const areQueriesEqual = (
  a: Record<string, string>,
  b: Record<string, string>,
): boolean => {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every((key) => a[key] === b[key]);
};

const pushQueryFromControls = async (options?: { resetPage?: boolean }) => {
  const targetPage = options?.resetPage ? 1 : currentPage.value;
  const targetQuery = buildRouteQueryFromControls(targetPage);
  const targetPath = buildRoutePathFromControls();
  const currentQuery = normalizeRouteQuery(route.query);
  const currentPath = route.path || "/catalog";

  if (
    targetPath === currentPath &&
    areQueriesEqual(targetQuery, currentQuery)
  ) {
    return;
  }

  await router.push({ path: targetPath, query: targetQuery });
};

const loadProducts = async () => {
  const requestId = ++latestProductsRequestId.value;
  productsPending.value = true;
  productsError.value = null;

  let responseData: CatalogListResponse | null = null;
  let requestError: unknown = null;

  if (hasInitialized.value) {
    try {
      responseData = await getCatalogProductsRaw(buildParamsFromControls());
    } catch (error) {
      requestError = error;
    }
  } else {
    const request = await getCatalogProducts(buildParamsFromControls());
    responseData = (request.data.value as CatalogListResponse | null) ?? null;
    requestError = request.error.value;
  }

  if (requestId !== latestProductsRequestId.value) return;

  productsPending.value = false;

  if (requestError) {
    productsError.value = requestError;
    return;
  }

  if (!responseData) {
    productsError.value = new Error("Catalog products response is empty.");
    return;
  }

  productsResponse.value = responseData;
};

const loadCategories = async () => {
  const requestId = ++latestCategoriesRequestId.value;
  categoriesPending.value = true;
  categoriesError.value = null;

  let responseData: CatalogCategoryItem[] = [];
  let requestError: unknown = null;

  if (hasInitialized.value) {
    try {
      responseData = await getCatalogCategoriesRaw();
    } catch (error) {
      requestError = error;
    }
  } else {
    const request = await getCatalogCategories();
    responseData = (request.data.value as CatalogCategoryItem[] | null) ?? [];
    requestError = request.error.value;
  }

  if (requestId !== latestCategoriesRequestId.value) return;

  categoriesPending.value = false;

  if (requestError) {
    categoriesError.value = requestError;
    return;
  }

  categoriesResponse.value = responseData;
};

const openMobileFilterSheet = () => {
  if (productsPending.value) return;
  isMobileFilterSheetOpen.value = true;
};

const closeMobileFilterSheet = () => {
  isMobileFilterSheetOpen.value = false;
};

const handleSortUpdate = async (value: string) => {
  selectedSort.value = toSortValue(value);
  await pushQueryFromControls({ resetPage: true });
};

const handleApplyFilters = async () => {
  await pushQueryFromControls({ resetPage: true });
};

const handleMobileFilterApply = async (value: {
  selectedCategoryId: number | null;
  minPrice: string;
  maxPrice: string;
  sort: CatalogSort;
}) => {
  setSelectedCategoryId(value.selectedCategoryId);
  minPrice.value = value.minPrice;
  maxPrice.value = value.maxPrice;
  selectedSort.value = value.sort;
  closeMobileFilterSheet();
  await pushQueryFromControls({ resetPage: true });
};

const handleResetFilters = async () => {
  setSelectedCategoryId(null);
  minPrice.value = "";
  maxPrice.value = "";
  await pushQueryFromControls({ resetPage: true });
};

const handleClearCatalogState = async () => {
  searchQuery.value = "";
  selectedSort.value = "recommended";
  setSelectedCategoryId(null);
  minPrice.value = "";
  maxPrice.value = "";
  currentPage.value = 1;
  await pushQueryFromControls({ resetPage: true });
};

const handlePageClick = async (page: number) => {
  currentPage.value = page;
  await pushQueryFromControls();

  if (import.meta.client) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};

const retryLoad = async () => {
  await Promise.all([loadCategories(), loadProducts()]);
};

syncControlsFromRoute(route.query);
await Promise.all([loadCategories(), loadProducts()]);
hasInitialized.value = true;

watch(
  () => route.fullPath,
  async () => {
    closeMobileFilterSheet();
    syncControlsFromRoute(route.query);
    await loadProducts();
  },
);

watch(
  () => categoriesResponse.value,
  () => {
    syncSelectedCategoryFromRoute(route.query);
  },
  { deep: true },
);

watch(isDesktopCatalogLayout, (isDesktop) => {
  if (isDesktop) {
    closeMobileFilterSheet();
  }
});

useHead(() => {
  const scripts = breadcrumbSchema.value
    ? [
        {
          key: "catalog-breadcrumb-schema",
          type: "application/ld+json",
          children: JSON.stringify(breadcrumbSchema.value),
        },
      ]
    : [];

  if (!selectedCategory.value && currentPage.value <= 1) {
    return {
      script: scripts,
    };
  }

  return {
    link: [{ rel: "canonical", href: categoryCanonicalUrl.value }],
    script: scripts,
  };
});

useSeoMeta({
  title: () => categorySeoTitle.value,
  description: () => categorySeoDescription.value,
  robots: () =>
    selectedCategorySeo.value?.noindex ? categoryRobots.value : undefined,
  ogTitle: () => categorySeoTitle.value,
  ogDescription: () => categorySeoDescription.value,
  ogImage: () => categorySeoImage.value,
  ogUrl: () => categoryCanonicalUrl.value,
  twitterTitle: () => categorySeoTitle.value,
  twitterDescription: () => categorySeoDescription.value,
  twitterImage: () => categorySeoImage.value,
});
</script>

<template>
  <section class="mx-auto w-full max-w-[1440px] px-4 py-4 md:px-6 md:py-10 lg:px-8 2xl:px-0">
    <AppBreadcrumbs :items="breadcrumbItems" />

    <div class="my-2 md:my-5">
      <h1 class="text-xl lg:text-2xl font-bold text-text-primary upper">
        {{ title }}
      </h1>
      <p class="text-sm hidden xs:flex md:text-base text-text-secondary">
        {{ pageSubtitle }}
      </p>

      <div
        v-if="hasActiveSearch"
        class="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border-default bg-surface px-4 py-3 text-sm text-text-secondary"
      >
        <span
          class="inline-flex items-center rounded-full bg-accent-primary/10 px-3 py-1 font-semibold text-accent-primary"
        >
          ძიება: {{ normalizedSearchQuery }}
        </span>
        <button
          type="button"
          class="font-semibold text-text-primary transition-colors duration-200 hover:text-accent-primary"
          @click="handleClearCatalogState"
        >
          გასუფთავება
        </button>
      </div>
    </div>

    <div
      v-if="isInitialLoading"
      class="rounded-xl border border-border-default bg-surface p-6 text-sm text-text-secondary"
    >
      კატალოგი იტვირთება...
    </div>

    <div
      v-else-if="hasBlockingError"
      class="rounded-xl border border-error/30 bg-surface p-6 text-sm text-text-secondary"
    >
      <p class="text-text-primary">კატალოგის ჩატვირთვა ვერ მოხერხდა.</p>
      <button
        type="button"
        class="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg bg-accent-primary px-4 text-sm font-semibold text-text-invert transition-colors duration-200 hover:bg-accent-hover"
        @click="retryLoad"
      >
        ხელახლა ცდა
      </button>
    </div>

    <template v-else>
      <div
        class="grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start"
      >
        <div class="hidden lg:block lg:sticky lg:top-40 lg:self-start">
          <CatalogFilters
            :categories="mappedCategories"
            :selected-category-id="selectedCategoryId"
            :selected-category-slug="selectedCategorySlug"
            :min-price="minPrice"
            :max-price="maxPrice"
            :disabled="productsPending"
            @update:selected-category-id="setSelectedCategoryId"
            @update:min-price="minPrice = $event"
            @update:max-price="maxPrice = $event"
            @apply="handleApplyFilters"
            @reset="handleResetFilters"
          />
        </div>

        <div class="flex flex-col gap-2">
          <div class="lg:hidden">
            <CatalogMobileToolbar
              :result-count="resultCount"
              :has-active-filters="hasActiveMobileSheetControls"
              :disabled="productsPending"
              @open-filters="openMobileFilterSheet"
            />
          </div>

          <div class="hidden lg:block">
            <CatalogToolbar
              :result-count="resultCount"
              :sort="selectedSort"
              :sort-options="sortOptions"
              :disabled="productsPending"
              @update:sort="handleSortUpdate"
            />
          </div>

          <div
            v-if="hasNonBlockingError"
            class="rounded-lg border border-warning/30 bg-surface px-4 py-3 text-sm text-text-secondary"
          >
            კატალოგის განახლება ვერ მოხერხდა. ნაჩვენებია ბოლოს ჩატვირთული
            შედეგები.
          </div>

          <div class="relative">
            <transition
              enter-active-class="transition-opacity duration-150"
              enter-from-class="opacity-0"
              enter-to-class="opacity-100"
              leave-active-class="transition-opacity duration-150"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <div
                v-if="showRefreshLoader && isRefreshingProducts"
                class="catalog-refresh-track pointer-events-none absolute left-0 right-0 -top-2 z-10 h-1 overflow-hidden rounded-full"
              >
                <span class="catalog-refresh-bar block h-full w-1/3" />
              </div>
            </transition>

            <ProductGrid
              :products="mappedProducts"
              :empty-title="emptyStateTitle"
              :empty-description="emptyStateDescription"
            />
          </div>

          <ClientOnly>
            <div v-if="totalPages > 1" class="flex justify-center py-2">
              <vue-awesome-paginate
                v-model="currentPage"
                :total-items="resultCount"
                :items-per-page="pageSize"
                :max-pages-shown="paginationMaxPagesShown"
                :show-ending-buttons="paginationShowEndingButtons"
                :show-breakpoint-buttons="true"
                :hide-prev-next-when-ends="true"
                first-page-content="პირველი"
                last-page-content="ბოლო"
                pagination-container-class="catalog-pagination"
                paginate-buttons-class="catalog-paginate-button"
                number-buttons-class="catalog-paginate-number"
                first-button-class="catalog-paginate-edge"
                last-button-class="catalog-paginate-edge"
                back-button-class="catalog-paginate-nav"
                next-button-class="catalog-paginate-nav"
                active-page-class="catalog-paginate-active"
                disabled-paginate-buttons-class="catalog-paginate-disabled"
                @click="handlePageClick"
              />
            </div>
          </ClientOnly>
        </div>
      </div>

      <CatalogMobileFilterSheet
        :open="isMobileFilterSheetOpen"
        :categories="mappedCategories"
        :selected-category-id="selectedCategoryId"
        :selected-category-slug="selectedCategorySlug"
        :min-price="minPrice"
        :max-price="maxPrice"
        :sort="selectedSort"
        :sort-options="sortOptions"
        :disabled="productsPending"
        @close="closeMobileFilterSheet"
        @apply="handleMobileFilterApply"
      />
    </template>
  </section>
</template>

<style scoped>
:deep(.catalog-pagination) {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.catalog-paginate-button) {
  min-width: 38px;
  min-height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid var(--border-default);
  background: var(--surface);
  color: var(--text-primary);
  font-weight: 600;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}

:deep(.catalog-paginate-number) {
  min-width: 38px;
  padding: 0 10px;
}

:deep(.catalog-paginate-nav) {
  padding: 0 12px;
}

:deep(.catalog-paginate-edge) {
  min-width: 58px;
  padding: 0 14px;
}

@media (hover: hover) and (pointer: fine) {
  :deep(.catalog-paginate-button:hover) {
    border-color: var(--accent-primary);
    background: var(--bg-secondary);
  }
}

:deep(.catalog-paginate-active) {
  border-color: var(--accent-primary);
  background: var(--accent-primary);
  color: var(--text-invert);
}

:deep(.catalog-paginate-disabled) {
  cursor: not-allowed;
  opacity: 0.45;
}

.catalog-refresh-track {
  background: linear-gradient(
    90deg,
    rgba(255, 107, 53, 0.14) 0%,
    rgba(255, 107, 53, 0.22) 100%
  );
}

.catalog-refresh-bar {
  background: linear-gradient(
    90deg,
    rgba(255, 107, 53, 0) 0%,
    var(--accent-primary) 45%,
    rgba(255, 107, 53, 0) 100%
  );
  animation: catalog-refresh-slide 0.95s ease-in-out infinite;
}

@keyframes catalog-refresh-slide {
  0% {
    transform: translateX(-130%);
  }
  100% {
    transform: translateX(340%);
  }
}

@media (max-width: 640px) {
  :deep(.catalog-pagination) {
    gap: 6px;
    flex-wrap: wrap;
    justify-content: center;
  }

  :deep(.catalog-paginate-button) {
    min-width: 34px;
    min-height: 34px;
    padding: 0 9px;
    font-size: 13px;
  }

  :deep(.catalog-paginate-number) {
    min-width: 34px;
    padding: 0 8px;
  }

  :deep(.catalog-paginate-nav) {
    padding: 0 10px;
  }
}
</style>
