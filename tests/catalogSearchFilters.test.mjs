import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const vue = require("vue");
const ts = require("typescript");
const { parse } = require("@vue/compiler-sfc");
const { createRouter, createMemoryHistory } = require("vue-router");

async function catalog(t, location, facets = {}) {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: "/:pathMatch(.*)*", component: { render: () => null } }] });
  await router.push(location);
  const requests = [];
  const categoryRequests = [];
  const response = { count: 0, results: [], total_pages: 1, page_size: 15, facets };
  const categories = [{ id: 1, slug: "lights", name: "ფარები", product_count: 3 }, { id: 2, slug: "mirrors", name: "სარკეები", product_count: 4 }];
  const api = {
    getCatalogProducts: async (params) => { requests.push(params); return { data: vue.ref(response), error: vue.ref(null) }; },
    getCatalogProductsRaw: async (params) => { requests.push(params); return response; },
    getCatalogCategories: async (includeEmpty = false) => { categoryRequests.push(includeEmpty); return { data: vue.ref(categories), error: vue.ref(null) }; },
    getCatalogCategoriesRaw: async (includeEmpty = false) => { categoryRequests.push(includeEmpty); return categories; },
    getVehicleMakes: async () => [], getVehicleModels: async () => [], getVehicleYears: async () => [],
  };
  const mocks = {
    "~/utils/pageScrollCoordinator": { markPagePending() {}, markPageReady() {} },
    "@vueuse/core": { useMediaQuery: () => vue.ref(false) },
    pinia: { storeToRefs: () => ({ settings: vue.ref({}) }) },
    "~/composables/useIndexingPolicy": { useIndexingPolicy: () => ({ robots: vue.ref("") }) },
    "~/composables/catalog/useCatalogApi": { useCatalogApi: () => api },
    "~/composables/catalog/useCatalogSearchAnalytics": { useCatalogSearchAnalytics: () => ({ captureSearch() {}, recordSearchResults() {} }) },
    "~/utils/routePaths": { getCatalogCategorySlugFromPath: (path) => /^\/catalog\/category\/([^/]+)/.exec(path)?.[1] || null, buildCatalogCategoryPath: (slug) => `/catalog/category/${slug}` },
    "~/utils/cmsCollectionSeo": {}, "~/utils/structuredData": {}, "~/utils/publicPageError": {},
  };
  const stops = [];
  const globals = {
    ...vue, defineProps: () => ({}), useRoute: () => router.currentRoute.value, useRouter: () => router,
    useRuntimeConfig: () => ({ public: {} }), useSiteSettings: () => ({}),
    watch: (...args) => { const stop = vue.watch(...args); stops.push(stop); return stop; },
    onMounted() {}, useHead() {}, useSeoMeta() {},
  };
  t.after(() => stops.forEach((stop) => stop()));
  const { descriptor } = parse(readFileSync(new URL("../app/components/SmartComponents/ProductCatalog/ProductCatalog.vue", import.meta.url), "utf8"));
  const output = ts.transpileModule(descriptor.scriptSetup.content.replaceAll("import.meta.client", "false"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const controls = await new AsyncFunction("require", "exports", ...Object.keys(globals), `${output}\nreturn { buildParamsFromControls, buildRouteQueryFromControls, buildRoutePathFromControls, selectedCategoryLabel, setSelectedCategorySlugs, selectedSort, handleMobileFilterApply, handleResetFilters, loadCategories, activeFilterChips, hasActiveMobileSheetControls };`)(
    (name) => mocks[name] ?? (name.endsWith(".vue") ? {} : require(name)), {}, ...Object.values(globals),
  );
  return { ...controls, requests, categoryRequests, router };
}

test("initial catalog request, pagination and sorting preserve all header filters", async (t) => {
  const c = await catalog(t, "/catalog?q=part&make=subaru&model=forester&year=2018&categories=lights,mirrors");
  assert.deepEqual(c.requests[0], { page: 1, page_size: 15, q: "part", make: "subaru", model: "forester", year: 2018, categories: "lights,mirrors" });
  assert.equal(c.selectedCategoryLabel.value, "ფარები, სარკეები");
  c.selectedSort.value = "price_asc";
  assert.deepEqual(c.buildRouteQueryFromControls(2), { q: "part", categories: "lights,mirrors", make: "subaru", model: "forester", year: "2018", ordering: "price_asc", page: "2" });
  assert.equal(c.buildRoutePathFromControls(), "/catalog");
});

test("removing a selected category updates API and route conditions together", async (t) => {
  const c = await catalog(t, "/catalog?categories=lights,mirrors");
  c.setSelectedCategorySlugs(["mirrors"]);
  assert.equal(c.buildParamsFromControls().categories, "mirrors");
  assert.equal(c.buildRouteQueryFromControls(1).categories, "mirrors");
  c.setSelectedCategorySlugs([]);
  assert.equal(c.buildParamsFromControls().categories, undefined);
  assert.equal(c.buildRouteQueryFromControls(1).categories, undefined);
});

test("mobile filter apply preserves category selections and reset clears them", async (t) => {
  const c = await catalog(t, "/catalog?categories=lights,mirrors");
  await c.handleMobileFilterApply({ selectedCategoryId: null, selectedCategorySlugs: ["lights", "mirrors"], minPrice: "10", maxPrice: "", sort: "price_asc", selectedBrand: "", selectedPlacement: "", selectedSide: "", inStock: true, onSale: false, vehicle: { make: "", model: "", year: "", engine: "" } });
  assert.equal(c.router.currentRoute.value.query.categories, "lights,mirrors");
  assert.equal(c.router.currentRoute.value.query.in_stock, "true");
  await c.handleResetFilters();
  assert.equal(c.router.currentRoute.value.query.categories, undefined);
});

test("API helpers carry the same category and vehicle conditions to products and suggestions", async () => {
  const endpoints = [];
  const source = readFileSync(new URL("../app/composables/catalog/useCatalogApi.ts", import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  const fetch = async (endpoint) => { endpoints.push(endpoint); return []; };
  const module = new Function("require", "exports", "apiFetch", `${output}\nreturn exports;`)(() => ({ apiFetchRaw: fetch }), exports, fetch);
  const api = module.useCatalogApi();
  const filters = { make: "subaru", model: "forester", year: 2018, categories: "lights,mirrors" };
  await api.getCatalogProductsRaw({ q: "17A 853 651", ...filters });
  await api.getCatalogProductSuggestions("17A 853 651", filters);
  const queries = endpoints.map((endpoint) => Object.fromEntries(new URL(endpoint, "https://example.test").searchParams));
  assert.deepEqual(queries[0], queries[1]);
  assert.deepEqual(queries[0], { q: "17A 853 651", make: "subaru", model: "forester", year: "2018", categories: "lights,mirrors" });
  await api.getCatalogCategoriesRaw();
  assert.equal(endpoints[2], "/catalog/categories/");
});


test("catalog category lists exclude empty categories on initial load and reload", async (t) => {
  const c = await catalog(t, "/catalog");
  await c.loadCategories();
  assert.deepEqual(c.categoryRequests, [false, false]);
});

for (const legacyValue of ["true", "false"]) {
  test(`obsolete has_image=${legacyValue} links cannot filter products or survive new listing links`, async (t) => {
    const c = await catalog(t, `/catalog?q=part&has_image=${legacyValue}&in_stock=true&on_sale=true`);
    assert.deepEqual(c.requests[0], { page: 1, page_size: 15, q: "part", in_stock: true, on_sale: true });
    assert.deepEqual(c.buildRouteQueryFromControls(2), { q: "part", in_stock: "true", on_sale: "true", page: "2" });
    assert.equal(c.activeFilterChips.value.some((chip) => chip.key === "has_image"), false);
  });
}


test("category-only searches mark mobile filters active, including multiple categories", async (t) => {
  const c = await catalog(t, "/catalog?categories=lights,mirrors");
  assert.equal(c.hasActiveMobileSheetControls.value, true);
  c.setSelectedCategorySlugs([]);
  assert.equal(c.hasActiveMobileSheetControls.value, false);
});


test("zero-result selected brands retain their real chip label for slug and ID links", async (t) => {
  for (const brand of ["tyc", "46"]) {
    const c = await catalog(t, `/catalog?brand=${brand}&side=left&on_sale=true`, {
      brands: [{ id: 46, slug: "tyc", name: "TYC", count: 0 }],
      sides: [{ value: "left", label: "მარცხენა", count: 0 }],
    });
    assert.equal(c.activeFilterChips.value.find((chip) => chip.key === "brand").value, "TYC");
    assert.equal(c.activeFilterChips.value.find((chip) => chip.key === "side").value, "მარცხენა");
  }
});
