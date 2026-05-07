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
  CatalogFacetBrand,
  CatalogFacetOption,
  CatalogFilterCategory,
  CatalogListParams,
  CatalogListResponse,
  CatalogProductCardData,
  CatalogSort,
  CatalogVehicleEngine,
  CatalogVehicleMake,
  CatalogVehicleModel,
  CatalogVehicleSelection,
  CatalogVehicleYear,
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
  getVehicleMakes,
  getVehicleModels,
  getVehicleYears,
  getVehicleEngines,
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
const PLACEMENT_LABELS: Record<string, string> = {
  front: "წინა",
  rear: "უკანა",
  upper: "ზედა",
  lower: "ქვედა",
  inner: "შიდა",
  outer: "გარე",
};
const SIDE_LABELS: Record<string, string> = {
  left: "მარცხენა",
  right: "მარჯვენა",
  both: "ორივე",
  center: "ცენტრი",
};

const productsResponse = ref<CatalogListResponse | null>(null);
const categoriesResponse = ref<CatalogCategoryItem[]>([]);
const vehicleMakesResponse = ref<CatalogVehicleMake[]>([]);
const vehicleModelsResponse = ref<CatalogVehicleModel[]>([]);
const vehicleYearsResponse = ref<CatalogVehicleYear[]>([]);
const vehicleEnginesResponse = ref<CatalogVehicleEngine[]>([]);

const productsPending = ref(false);
const categoriesPending = ref(false);
const vehicleOptionsPending = ref(false);

const productsError = ref<unknown>(null);
const categoriesError = ref<unknown>(null);
const vehicleOptionsError = ref<unknown>(null);
const latestProductsRequestId = ref(0);
const latestCategoriesRequestId = ref(0);
const latestVehicleOptionsRequestId = ref(0);
const hasInitialized = ref(false);

const selectedSort = ref<CatalogSort>("recommended");
const searchQuery = ref("");
const selectedCategoryId = ref<number | null>(null);
const selectedCategorySlug = ref<string | null>(null);
const selectedBrand = ref("");
const selectedPlacement = ref("");
const selectedSide = ref("");
const selectedInStock = ref(false);
const selectedOnSale = ref(false);
const selectedVehicleMake = ref("");
const selectedVehicleModel = ref("");
const selectedVehicleYear = ref("");
const selectedVehicleEngine = ref("");
const draftVehicleMake = ref("");
const draftVehicleModel = ref("");
const draftVehicleYear = ref("");
const draftVehicleEngine = ref("");
const minPrice = ref("");
const maxPrice = ref("");
const currentPage = ref(1);
const isMobilePagination = useMediaQuery("(max-width: 640px)");
const isDesktopCatalogLayout = useMediaQuery("(min-width: 1024px)");
const isMobileFilterSheetOpen = ref(false);
const hasHydrated = ref(false);
const resultsStartRef = ref<HTMLElement | null>(null);
const normalizedSearchQuery = computed(() => searchQuery.value.trim());
const hasActiveSearch = computed(() => Boolean(normalizedSearchQuery.value));
const draftVehicle = computed<CatalogVehicleSelection>(() => ({
  make: draftVehicleMake.value,
  model: draftVehicleModel.value,
  year: draftVehicleYear.value,
  engine: draftVehicleEngine.value,
}));
const selectedVehicleYearNumber = computed(() => {
  if (!selectedVehicleYear.value) return null;
  const parsed = Number(selectedVehicleYear.value);
  return Number.isInteger(parsed) ? parsed : null;
});
const hasActiveVehicleFilter = computed(() =>
  Boolean(selectedVehicleMake.value),
);
const hasInvalidDraftVehicle = computed(
  () =>
    Boolean(draftVehicleModel.value && !draftVehicleMake.value) ||
    Boolean(draftVehicleYear.value && !draftVehicleMake.value) ||
    Boolean(
      draftVehicleEngine.value &&
        (!draftVehicleMake.value ||
          !draftVehicleModel.value ||
          !draftVehicleYear.value),
    ),
);

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
const resolveFacetLabel = (
  options: CatalogFacetOption[],
  value: string,
  fallbackLabels: Record<string, string> = {},
) =>
  options.find((option) => option.value === value)?.label ||
  fallbackLabels[value] ||
  value;
const toPlacementLabel = (value: string, fallback = "") =>
  PLACEMENT_LABELS[value] || fallback || value;
const toSideLabel = (value: string, fallback = "") =>
  SIDE_LABELS[value] || fallback || value;
const selectedBrandLabel = computed(() => {
  if (!selectedBrand.value) return "";
  return (
    productsResponse.value?.facets?.brands?.find(
      (brand) => brand.slug === selectedBrand.value,
    )?.name || selectedBrand.value
  );
});
const selectedPlacementLabel = computed(() => {
  if (!selectedPlacement.value) return "";
  return resolveFacetLabel(
    mappedPlacementOptions.value,
    selectedPlacement.value,
    PLACEMENT_LABELS,
  );
});
const selectedSideLabel = computed(() => {
  if (!selectedSide.value) return "";
  return resolveFacetLabel(mappedSideOptions.value, selectedSide.value, SIDE_LABELS);
});
const vehicleMakeLabel = computed(() => {
  if (!selectedVehicleMake.value) return "";
  return (
    vehicleMakesResponse.value.find(
      (make) => make.slug === selectedVehicleMake.value,
    )?.name || selectedVehicleMake.value
  );
});
const vehicleModelLabel = computed(() => {
  if (!selectedVehicleModel.value) return "";
  return (
    vehicleModelsResponse.value.find(
      (model) => model.slug === selectedVehicleModel.value,
    )?.name || selectedVehicleModel.value
  );
});
const vehicleEngineLabel = computed(() => {
  if (!selectedVehicleEngine.value) return "";

  if (!hasHydrated.value) {
    return selectedVehicleEngine.value;
  }

  return (
    vehicleEnginesResponse.value.find(
      (engine) => engine.slug === selectedVehicleEngine.value,
    )?.name || selectedVehicleEngine.value
  );
});
const selectedVehicleLabel = computed(() => {
  if (!hasActiveVehicleFilter.value) return "";

  return [
    vehicleMakeLabel.value,
    vehicleModelLabel.value,
    selectedVehicleYear.value,
    vehicleEngineLabel.value,
  ]
    .filter(Boolean)
    .join(" · ");
});
const selectedVehicleCardFilter = computed(() => ({
  make: vehicleMakeLabel.value,
  model: vehicleModelLabel.value,
  year: selectedVehicleYear.value,
  engine: vehicleEngineLabel.value,
}));
const draftVehicleEngineDisplayValue = computed(() =>
  !hasHydrated.value && draftVehicleEngine.value ? draftVehicleEngine.value : "",
);
const showVehicleOptionsError = computed(
  () => hasHydrated.value && Boolean(vehicleOptionsError.value),
);

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
    hasActiveVehicleFilter.value ||
    Boolean(selectedBrand.value) ||
    Boolean(selectedPlacement.value) ||
    Boolean(selectedSide.value) ||
    selectedInStock.value ||
    selectedOnSale.value ||
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
    sku: item.sku,
    manufacturerPartNumber: item.manufacturer_part_number,
    subtitle: item.short_description,
    category: item.category?.name,
    brand: item.brand?.name,
    placement: item.placement ? toPlacementLabel(item.placement) : "",
    side: item.side ? toSideLabel(item.side) : "",
    price: Number(item.price),
    oldPrice: item.old_price ? Number(item.old_price) : null,
    image: item.primary_image,
    isNew: item.is_new,
    inStock: item.in_stock,
    onSale: item.on_sale,
    isUniversalFitment: item.is_universal_fitment,
    compatibility: item.compatibility,
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
const mappedBrands = computed<CatalogFacetBrand[]>(
  () => productsResponse.value?.facets?.brands ?? [],
);
const mappedPlacementOptions = computed<CatalogFacetOption[]>(() =>
  (productsResponse.value?.facets?.placements ?? []).map((option) => ({
    ...option,
    label: toPlacementLabel(option.value, option.label),
  })),
);
const mappedSideOptions = computed<CatalogFacetOption[]>(() =>
  (productsResponse.value?.facets?.sides ?? []).map((option) => ({
    ...option,
    label: toSideLabel(option.value, option.label),
  })),
);
const activeFilterChips = computed<CatalogActiveFilter[]>(() => {
  const chips: CatalogActiveFilter[] = [];

  if (selectedVehicleLabel.value) {
    chips.push({
      key: "vehicle",
      label: "მანქანა",
      value: selectedVehicleLabel.value,
    });
  }

  if (selectedCategoryLabel.value) {
    chips.push({
      key: "category",
      label: "კატეგორია",
      value: selectedCategoryLabel.value,
    });
  }

  if (selectedBrandLabel.value) {
    chips.push({
      key: "brand",
      label: "ბრენდი",
      value: selectedBrandLabel.value,
    });
  }

  if (selectedPlacementLabel.value) {
    chips.push({
      key: "placement",
      label: "მდებარეობა",
      value: selectedPlacementLabel.value,
    });
  }

  if (selectedSideLabel.value) {
    chips.push({
      key: "side",
      label: "მხარე",
      value: selectedSideLabel.value,
    });
  }

  if (minPrice.value.trim() || maxPrice.value.trim()) {
    chips.push({
      key: "price",
      label: "ფასი",
      value: `${minPrice.value.trim() || "0"} - ${
        maxPrice.value.trim() || "..."
      } GEL`,
    });
  }

  if (selectedInStock.value) {
    chips.push({ key: "in_stock", label: "მარაგშია" });
  }

  if (selectedOnSale.value) {
    chips.push({ key: "on_sale", label: "ფასდაკლება" });
  }

  return chips;
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
const toCleanQueryString = (value: string | undefined): string =>
  (value || "").trim();
const toBooleanFromQuery = (value: string | undefined): boolean => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
};
const toYearString = (value: string | undefined): string => {
  if (!value) return "";
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1900 || parsed > 2100) return "";
  return String(parsed);
};
const hasVehicleSelection = (vehicle: CatalogVehicleSelection) =>
  Boolean(vehicle.make || vehicle.model || vehicle.year || vehicle.engine);
const normalizeVehicleSelection = (
  vehicle: CatalogVehicleSelection,
): CatalogVehicleSelection => {
  if (!vehicle.make) {
    return { make: "", model: "", year: "", engine: "" };
  }

  if (!vehicle.model || !vehicle.year) {
    return { ...vehicle, engine: "" };
  }

  return vehicle;
};
const isVehicleSelectionValid = (vehicle: CatalogVehicleSelection) => {
  if (!hasVehicleSelection(vehicle)) return true;
  if (!vehicle.make) return false;
  if (vehicle.engine && (!vehicle.model || !vehicle.year)) return false;
  return true;
};
const readVehicleSelectionFromQuery = (
  query: LocationQuery,
): CatalogVehicleSelection =>
  normalizeVehicleSelection({
    make: toCleanQueryString(firstQueryValue(query.make)),
    model: toCleanQueryString(firstQueryValue(query.model)),
    year: toYearString(firstQueryValue(query.year)),
    engine: toCleanQueryString(firstQueryValue(query.engine)),
  });
const hasVehicleRouteChanged = (query: LocationQuery) => {
  const routeVehicle = readVehicleSelectionFromQuery(query);
  return (
    routeVehicle.make !== selectedVehicleMake.value ||
    routeVehicle.model !== selectedVehicleModel.value ||
    routeVehicle.year !== selectedVehicleYear.value ||
    routeVehicle.engine !== selectedVehicleEngine.value
  );
};
const syncDraftVehicleFromApplied = () => {
  draftVehicleMake.value = selectedVehicleMake.value;
  draftVehicleModel.value = selectedVehicleModel.value;
  draftVehicleYear.value = selectedVehicleYear.value;
  draftVehicleEngine.value = selectedVehicleEngine.value;
};
const clearAppliedVehicleFilter = () => {
  selectedVehicleMake.value = "";
  selectedVehicleModel.value = "";
  selectedVehicleYear.value = "";
  selectedVehicleEngine.value = "";
};
const clearDraftVehicleFilter = () => {
  draftVehicleMake.value = "";
  draftVehicleModel.value = "";
  draftVehicleYear.value = "";
  draftVehicleEngine.value = "";
};
const applyVehicleSelection = (vehicle: CatalogVehicleSelection) => {
  const normalizedVehicle = normalizeVehicleSelection(vehicle);

  if (!hasVehicleSelection(normalizedVehicle)) {
    clearAppliedVehicleFilter();
    return;
  }

  if (!isVehicleSelectionValid(normalizedVehicle)) return;

  selectedVehicleMake.value = normalizedVehicle.make;
  selectedVehicleModel.value = normalizedVehicle.model;
  selectedVehicleYear.value = normalizedVehicle.year;
  selectedVehicleEngine.value = normalizedVehicle.engine;
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

const syncControlsFromRoute = (
  query: LocationQuery,
  options?: { syncVehicleDraft?: boolean },
) => {
  searchQuery.value = firstQueryValue(query.q) || "";
  selectedSort.value = toSortValue(firstQueryValue(query.ordering));
  minPrice.value = toNumericString(firstQueryValue(query.min_price));
  maxPrice.value = toNumericString(firstQueryValue(query.max_price));
  selectedBrand.value = toCleanQueryString(firstQueryValue(query.brand));
  selectedPlacement.value = toCleanQueryString(firstQueryValue(query.placement));
  selectedSide.value = toCleanQueryString(firstQueryValue(query.side));
  selectedInStock.value = toBooleanFromQuery(firstQueryValue(query.in_stock));
  selectedOnSale.value = toBooleanFromQuery(firstQueryValue(query.on_sale));

  const routeVehicle = readVehicleSelectionFromQuery(query);
  selectedVehicleMake.value = routeVehicle.make;
  selectedVehicleModel.value = routeVehicle.model;
  selectedVehicleYear.value = routeVehicle.year;
  selectedVehicleEngine.value = routeVehicle.engine;

  if (options?.syncVehicleDraft) {
    syncDraftVehicleFromApplied();
  }

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

  if (hasActiveVehicleFilter.value) {
    params.make = selectedVehicleMake.value;

    if (selectedVehicleModel.value) {
      params.model = selectedVehicleModel.value;
    }

    if (selectedVehicleYearNumber.value !== null) {
      params.year = selectedVehicleYearNumber.value;
    }

    if (
      selectedVehicleEngine.value &&
      selectedVehicleYearNumber.value !== null
    ) {
      params.engine = selectedVehicleEngine.value;
    }
  }

  if (selectedBrand.value) {
    params.brand = selectedBrand.value;
  }

  if (selectedPlacement.value) {
    params.placement = selectedPlacement.value;
  }

  if (selectedSide.value) {
    params.side = selectedSide.value;
  }

  if (selectedInStock.value) {
    params.in_stock = true;
  }

  if (selectedOnSale.value) {
    params.on_sale = true;
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

  if (hasActiveVehicleFilter.value) {
    query.make = selectedVehicleMake.value;

    if (selectedVehicleModel.value) {
      query.model = selectedVehicleModel.value;
    }

    if (selectedVehicleYear.value) {
      query.year = selectedVehicleYear.value;
    }

    if (selectedVehicleEngine.value && selectedVehicleYear.value) {
      query.engine = selectedVehicleEngine.value;
    }
  }

  if (selectedBrand.value) {
    query.brand = selectedBrand.value;
  }

  if (selectedPlacement.value) {
    query.placement = selectedPlacement.value;
  }

  if (selectedSide.value) {
    query.side = selectedSide.value;
  }

  if (selectedInStock.value) {
    query.in_stock = "true";
  }

  if (selectedOnSale.value) {
    query.on_sale = "true";
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

const scrollToResultsStart = async () => {
  if (!import.meta.client) return;

  await nextTick();

  window.requestAnimationFrame(() => {
    const target = resultsStartRef.value;
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const isComfortablyVisible =
      rect.top >= 120 && rect.top <= viewportHeight * 0.6;

    if (isComfortablyVisible) return;

    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
};

const pushQueryAndScrollToResults = async (options?: { resetPage?: boolean }) => {
  await pushQueryFromControls(options);
  await scrollToResultsStart();
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

const loadVehicleMakes = async () => {
  try {
    vehicleMakesResponse.value = await getVehicleMakes();
  } catch (error) {
    vehicleOptionsError.value = error;
  }
};

const loadVehicleOptionsForDraft = async () => {
  const requestId = ++latestVehicleOptionsRequestId.value;
  vehicleOptionsPending.value = true;
  vehicleOptionsError.value = null;

  try {
    if (!draftVehicleMake.value) {
      vehicleModelsResponse.value = [];
      vehicleYearsResponse.value = [];
      vehicleEnginesResponse.value = [];
      return;
    }

    const models = await getVehicleModels(draftVehicleMake.value);
    if (requestId !== latestVehicleOptionsRequestId.value) return;
    vehicleModelsResponse.value = models;

    const years = await getVehicleYears(
      draftVehicleMake.value,
      draftVehicleModel.value || undefined,
    );
    if (requestId !== latestVehicleOptionsRequestId.value) return;
    vehicleYearsResponse.value = years;

    if (!draftVehicleModel.value || !draftVehicleYear.value) {
      vehicleEnginesResponse.value = [];
      return;
    }

    const parsedYear = Number(draftVehicleYear.value);
    if (!Number.isInteger(parsedYear)) {
      vehicleEnginesResponse.value = [];
      return;
    }

    const engines = await getVehicleEngines(
      draftVehicleMake.value,
      draftVehicleModel.value,
      parsedYear,
    );
    if (requestId !== latestVehicleOptionsRequestId.value) return;
    vehicleEnginesResponse.value = engines;
  } catch (error) {
    if (requestId === latestVehicleOptionsRequestId.value) {
      vehicleOptionsError.value = error;
    }
  } finally {
    if (requestId === latestVehicleOptionsRequestId.value) {
      vehicleOptionsPending.value = false;
    }
  }
};

const openMobileFilterSheet = async () => {
  if (productsPending.value) return;
  syncDraftVehicleFromApplied();
  await loadVehicleOptionsForDraft();
  isMobileFilterSheetOpen.value = true;
};

const closeMobileFilterSheet = (options?: { resetVehicleDraft?: boolean }) => {
  isMobileFilterSheetOpen.value = false;
  if (options?.resetVehicleDraft) {
    syncDraftVehicleFromApplied();
  }
};

const handleMobileFilterClose = () => {
  closeMobileFilterSheet({ resetVehicleDraft: true });
};

const handleDraftVehicleMakeUpdate = async (value: string) => {
  draftVehicleMake.value = value;
  draftVehicleModel.value = "";
  draftVehicleYear.value = "";
  draftVehicleEngine.value = "";
  await loadVehicleOptionsForDraft();
};

const handleDraftVehicleModelUpdate = async (value: string) => {
  draftVehicleModel.value = value;
  draftVehicleYear.value = "";
  draftVehicleEngine.value = "";
  await loadVehicleOptionsForDraft();
};

const handleDraftVehicleYearUpdate = async (value: string) => {
  draftVehicleYear.value = value;
  draftVehicleEngine.value = "";
  await loadVehicleOptionsForDraft();
};

const handleDraftVehicleEngineUpdate = (value: string) => {
  draftVehicleEngine.value = value;
};

const applyDraftVehicleFilter = async () => {
  if (!isVehicleSelectionValid(draftVehicle.value)) return;
  applyVehicleSelection(draftVehicle.value);
  await pushQueryAndScrollToResults({ resetPage: true });
};

const handleDesktopVehicleMakeUpdate = async (value: string) => {
  await handleDraftVehicleMakeUpdate(value);
  await applyDraftVehicleFilter();
};

const handleDesktopVehicleModelUpdate = async (value: string) => {
  await handleDraftVehicleModelUpdate(value);
  await applyDraftVehicleFilter();
};

const handleDesktopVehicleYearUpdate = async (value: string) => {
  await handleDraftVehicleYearUpdate(value);
  await applyDraftVehicleFilter();
};

const handleDesktopVehicleEngineUpdate = async (value: string) => {
  handleDraftVehicleEngineUpdate(value);
  await applyDraftVehicleFilter();
};

const handleResetVehicleDraft = async () => {
  clearDraftVehicleFilter();
  await loadVehicleOptionsForDraft();
};

const handleResetVehicleFilter = async () => {
  clearDraftVehicleFilter();
  clearAppliedVehicleFilter();
  await loadVehicleOptionsForDraft();
  await pushQueryAndScrollToResults({ resetPage: true });
};

const handleSortUpdate = async (value: string) => {
  selectedSort.value = toSortValue(value);
  await pushQueryAndScrollToResults({ resetPage: true });
};

const handleApplyFilters = async () => {
  await pushQueryAndScrollToResults({ resetPage: true });
};

const handleMobileFilterApply = async (value: {
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
}) => {
  if (!isVehicleSelectionValid(value.vehicle)) return;

  setSelectedCategoryId(value.selectedCategoryId);
  minPrice.value = value.minPrice;
  maxPrice.value = value.maxPrice;
  selectedSort.value = value.sort;
  selectedBrand.value = value.selectedBrand;
  selectedPlacement.value = value.selectedPlacement;
  selectedSide.value = value.selectedSide;
  selectedInStock.value = value.inStock;
  selectedOnSale.value = value.onSale;
  applyVehicleSelection(value.vehicle);
  closeMobileFilterSheet();
  await pushQueryAndScrollToResults({ resetPage: true });
};

const handleResetFilters = async () => {
  setSelectedCategoryId(null);
  selectedBrand.value = "";
  selectedPlacement.value = "";
  selectedSide.value = "";
  selectedInStock.value = false;
  selectedOnSale.value = false;
  clearDraftVehicleFilter();
  clearAppliedVehicleFilter();
  minPrice.value = "";
  maxPrice.value = "";
  await loadVehicleOptionsForDraft();
  await pushQueryAndScrollToResults({ resetPage: true });
};

const handleClearCatalogState = async () => {
  searchQuery.value = "";
  selectedSort.value = "recommended";
  setSelectedCategoryId(null);
  selectedBrand.value = "";
  selectedPlacement.value = "";
  selectedSide.value = "";
  selectedInStock.value = false;
  selectedOnSale.value = false;
  clearDraftVehicleFilter();
  clearAppliedVehicleFilter();
  minPrice.value = "";
  maxPrice.value = "";
  currentPage.value = 1;
  await loadVehicleOptionsForDraft();
  await pushQueryAndScrollToResults({ resetPage: true });
};

const handleRemoveActiveFilter = async (key: CatalogActiveFilterKey) => {
  if (key === "vehicle") {
    clearDraftVehicleFilter();
    clearAppliedVehicleFilter();
    await loadVehicleOptionsForDraft();
  } else if (key === "category") {
    setSelectedCategoryId(null);
  } else if (key === "brand") {
    selectedBrand.value = "";
  } else if (key === "placement") {
    selectedPlacement.value = "";
  } else if (key === "side") {
    selectedSide.value = "";
  } else if (key === "price") {
    minPrice.value = "";
    maxPrice.value = "";
  } else if (key === "in_stock") {
    selectedInStock.value = false;
  } else if (key === "on_sale") {
    selectedOnSale.value = false;
  }

  await pushQueryAndScrollToResults({ resetPage: true });
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

syncControlsFromRoute(route.query, { syncVehicleDraft: true });
await Promise.all([
  loadCategories(),
  loadVehicleMakes(),
  loadVehicleOptionsForDraft(),
  loadProducts(),
]);
hasInitialized.value = true;

watch(
  () => route.fullPath,
  async () => {
    const shouldSyncVehicleDraft = hasVehicleRouteChanged(route.query);
    closeMobileFilterSheet();
    syncControlsFromRoute(route.query, {
      syncVehicleDraft: shouldSyncVehicleDraft,
    });
    if (shouldSyncVehicleDraft) {
      await loadVehicleOptionsForDraft();
    }
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

onMounted(() => {
  hasHydrated.value = true;
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
            :brands="mappedBrands"
            :placements="mappedPlacementOptions"
            :sides="mappedSideOptions"
            :vehicle-makes="vehicleMakesResponse"
            :vehicle-models="vehicleModelsResponse"
            :vehicle-years="vehicleYearsResponse"
            :vehicle-engines="vehicleEnginesResponse"
            :vehicle-make="draftVehicleMake"
            :vehicle-model="draftVehicleModel"
            :vehicle-year="draftVehicleYear"
            :vehicle-engine="draftVehicleEngine"
            :vehicle-engine-display-value="draftVehicleEngineDisplayValue"
            :vehicle-engine-options-ready="hasHydrated"
            :vehicle-options-pending="vehicleOptionsPending"
            :vehicle-options-error="showVehicleOptionsError"
            :has-invalid-vehicle="hasInvalidDraftVehicle"
            :has-applied-vehicle="hasActiveVehicleFilter"
            :selected-category-id="selectedCategoryId"
            :selected-category-slug="selectedCategorySlug"
            :selected-brand="selectedBrand"
            :selected-placement="selectedPlacement"
            :selected-side="selectedSide"
            :in-stock="selectedInStock"
            :on-sale="selectedOnSale"
            :min-price="minPrice"
            :max-price="maxPrice"
            :disabled="productsPending"
            @update:vehicle-make="handleDesktopVehicleMakeUpdate"
            @update:vehicle-model="handleDesktopVehicleModelUpdate"
            @update:vehicle-year="handleDesktopVehicleYearUpdate"
            @update:vehicle-engine="handleDesktopVehicleEngineUpdate"
            @update:selected-category-id="setSelectedCategoryId"
            @update:selected-brand="selectedBrand = $event"
            @update:selected-placement="selectedPlacement = $event"
            @update:selected-side="selectedSide = $event"
            @update:in-stock="selectedInStock = $event"
            @update:on-sale="selectedOnSale = $event"
            @update:min-price="minPrice = $event"
            @update:max-price="maxPrice = $event"
            @reset-vehicle="handleResetVehicleFilter"
            @apply="handleApplyFilters"
            @reset="handleResetFilters"
          />
        </div>

        <div
          ref="resultsStartRef"
          class="flex flex-col gap-2 scroll-mt-28 lg:scroll-mt-40"
        >
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
              :active-filters="activeFilterChips"
              :disabled="productsPending"
              @update:sort="handleSortUpdate"
              @remove-filter="handleRemoveActiveFilter"
              @clear-all="handleClearCatalogState"
            />
          </div>

          <div
            v-if="hasNonBlockingError"
            class="rounded-lg border border-warning/30 bg-surface px-4 py-3 text-sm text-text-secondary"
          >
            კატალოგის განახლება ვერ მოხერხდა. ნაჩვენებია ბოლოს ჩატვირთული
            შედეგები.
          </div>

          <div>
            <ProductGrid
              :products="mappedProducts"
              :vehicle-filter="selectedVehicleCardFilter"
              :loading="isRefreshingProducts"
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
        :brands="mappedBrands"
        :placements="mappedPlacementOptions"
        :sides="mappedSideOptions"
        :vehicle-makes="vehicleMakesResponse"
        :vehicle-models="vehicleModelsResponse"
        :vehicle-years="vehicleYearsResponse"
        :vehicle-engines="vehicleEnginesResponse"
        :vehicle-make="draftVehicleMake"
        :vehicle-model="draftVehicleModel"
        :vehicle-year="draftVehicleYear"
        :vehicle-engine="draftVehicleEngine"
        :vehicle-engine-display-value="draftVehicleEngineDisplayValue"
        :vehicle-engine-options-ready="hasHydrated"
        :vehicle-options-pending="vehicleOptionsPending"
        :vehicle-options-error="showVehicleOptionsError"
        :has-invalid-vehicle="hasInvalidDraftVehicle"
        :selected-category-id="selectedCategoryId"
        :selected-category-slug="selectedCategorySlug"
        :selected-brand="selectedBrand"
        :selected-placement="selectedPlacement"
        :selected-side="selectedSide"
        :in-stock="selectedInStock"
        :on-sale="selectedOnSale"
        :min-price="minPrice"
        :max-price="maxPrice"
        :sort="selectedSort"
        :sort-options="sortOptions"
        :disabled="productsPending"
        @update:vehicle-make="handleDraftVehicleMakeUpdate"
        @update:vehicle-model="handleDraftVehicleModelUpdate"
        @update:vehicle-year="handleDraftVehicleYearUpdate"
        @update:vehicle-engine="handleDraftVehicleEngineUpdate"
        @reset-vehicle-draft="handleResetVehicleDraft"
        @close="handleMobileFilterClose"
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
