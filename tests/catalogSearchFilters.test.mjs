import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const vue = require("vue");
const ts = require("typescript");
const { parse } = require("@vue/compiler-sfc");
const { createRouter, createMemoryHistory } = require("vue-router");

async function catalog(t, location, facets = {}, options = {}) {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: "/:pathMatch(.*)*", component: { render: () => null } }] });
  await router.push(location);
  const requests = [];
  const categoryRequests = [];
  const response = { count: 0, results: [], total_pages: 1, page_size: 15, facets };
  const categories = [{ id: 1, slug: "lights", name: "ფარები", product_count: 3 }, { id: 2, slug: "mirrors", name: "სარკეები", product_count: 4 }];
  const api = {
    getCatalogProducts: async (params) => { requests.push(params); return { data: vue.ref(response), error: vue.ref(null) }; },
    getCatalogProductsRaw: async (params) => { requests.push(params); return options.getCatalogProductsRaw ? options.getCatalogProductsRaw(params) : response; },
    getCatalogCategories: async (includeEmpty = false) => { categoryRequests.push(includeEmpty); return { data: vue.ref(categories), error: vue.ref(null) }; },
    getCatalogCategoriesRaw: async (includeEmpty = false) => { categoryRequests.push(includeEmpty); return categories; },
    getVehicleMakes: options.getVehicleMakes ?? (async () => []),
    getVehicleModels: options.getVehicleModels ?? (async () => []),
    getVehicleYears: options.getVehicleYears ?? (async () => []),
    getVehicleEngines: options.getVehicleEngines ?? (async () => []),
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
  const unmountCallbacks = [];
  const globals = {
    ...vue, defineProps: () => ({}), useRoute: () => new Proxy({}, { get: (_, key) => router.currentRoute.value[key] }), useRouter: () => router,
    useRuntimeConfig: () => ({ public: {} }), useSiteSettings: () => ({}),
    watch: (...args) => { const stop = vue.watch(...args); stops.push(stop); return stop; },
    onMounted() {}, onBeforeUnmount: (callback) => unmountCallbacks.push(callback), useHead() {}, useSeoMeta() {},
  };
  t.after(() => stops.forEach((stop) => stop()));
  const { descriptor } = parse(readFileSync(new URL("../app/components/SmartComponents/ProductCatalog/ProductCatalog.vue", import.meta.url), "utf8"));
  const output = ts.transpileModule(descriptor.scriptSetup.content.replaceAll("import.meta.client", String(Boolean(options.client))), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const controls = await new AsyncFunction("require", "exports", ...Object.keys(globals), `${output}\nreturn { buildParamsFromControls, buildRouteQueryFromControls, buildRoutePathFromControls, selectedCategoryLabel, setSelectedCategorySlugs, selectedSort, handleMobileFilterApply, handleResetFilters, loadCategories, activeFilterChips, hasActiveMobileSheetControls, vehicleMakesResponse, vehicleMakesPending, vehicleMakesError, vehicleMakesRequest, handleDesktopVehicleMakeUpdate, handleDesktopVehicleModelUpdate, handleDesktopVehicleYearUpdate, handleDraftVehicleMakeUpdate, loadVehicleOptionsForDraft, vehicleModelsResponse, vehicleYearsResponse, vehicleOptionsError, desktopFiltersDisabled };`)(
    (name) => mocks[name] ?? (name.endsWith(".vue") ? {} : require(name)), {}, ...Object.values(globals),
  );
  return { ...controls, requests, categoryRequests, router, unmount: () => unmountCallbacks.forEach((callback) => callback()) };
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
  const module = new Function("require", "exports", "apiFetch", `${output}\nreturn exports;`)(() => ({ apiFetchRaw: fetch, useCatalogVehicleMakes: () => ({ getVehicleMakes: () => fetch("/catalog/vehicles/makes/") }) }), exports, fetch);
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

test("client catalog products become ready while make options are still loading", async (t) => {
  let resolve;
  const pending = new Promise((yes) => { resolve = yes; });
  const c = await catalog(t, "/catalog", {}, { client: true, getVehicleMakes: () => pending });
  assert.equal(c.requests.length, 1);
  assert.equal(c.vehicleMakesPending.value, true);
  resolve([{ id: 1, name: "Toyota", slug: "toyota" }]);
  await c.vehicleMakesRequest;
  assert.equal(c.vehicleMakesPending.value, false);
  assert.equal(c.vehicleMakesResponse.value[0].slug, "toyota");
});

test("SSR waits for make options and returns a complete initial filter", async (t) => {
  let resolve, finished = false;
  const pending = new Promise((yes) => { resolve = yes; });
  const setup = catalog(t, "/catalog", {}, { getVehicleMakes: () => pending }).then((c) => { finished = true; return c; });
  for (let i = 0; i < 5; i++) await vue.nextTick();
  assert.equal(finished, false);
  resolve([{ id: 1, name: "Toyota", slug: "toyota" }]);
  const c = await setup;
  assert.equal(c.vehicleMakesResponse.value[0].slug, "toyota");
  assert.equal(c.vehicleMakesPending.value, false);
});

for (const fail of [false, true]) {
  test(`late make ${fail ? "failure" : "response"} cannot update a departed catalog`, async (t) => {
    let resolve, reject;
    const pending = new Promise((yes, no) => { resolve = yes; reject = no; });
    const c = await catalog(t, "/catalog", {}, { client: true, getVehicleMakes: () => pending });
    c.unmount();
    if (fail) reject(new Error("offline"));
    else resolve([{ id: 1, name: "Toyota", slug: "toyota" }]);
    await c.vehicleMakesRequest;
    assert.deepEqual(c.vehicleMakesResponse.value, []);
    assert.equal(c.vehicleMakesError.value, null);
  });
}

test("make loading failure does not prevent client catalog products from rendering", async (t) => {
  const c = await catalog(t, "/catalog", {}, { client: true, getVehicleMakes: async () => { throw new Error("offline"); } });
  await c.vehicleMakesRequest;
  assert.equal(c.requests.length, 1);
  assert.equal(c.vehicleMakesPending.value, false);
  assert.match(c.vehicleMakesError.value.message, /offline/);
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

const flushCatalog = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

test("vehicle steps reuse models and years while products filter once per selection", async (t) => {
  const calls = [];
  const c = await catalog(t, "/catalog", {}, {
    getVehicleModels: async (make) => { calls.push(["models", make]); return []; },
    getVehicleYears: async (make, model) => { calls.push(["years", make, model]); return []; },
    getVehicleEngines: async (...args) => { calls.push(["engines", ...args]); return []; },
  });
  await c.handleDesktopVehicleMakeUpdate("subaru");
  await flushCatalog();
  await c.handleDesktopVehicleModelUpdate("ascent");
  await flushCatalog();
  await c.handleDesktopVehicleYearUpdate("2020");
  await flushCatalog();
  await c.handleDesktopVehicleYearUpdate("2021");
  await flushCatalog();
  await c.loadVehicleOptionsForDraft();
  assert.deepEqual(calls, [
    ["models", "subaru"], ["years", "subaru", undefined],
    ["years", "subaru", "ascent"],
    ["engines", "subaru", "ascent", 2020],
    ["engines", "subaru", "ascent", 2021],
  ]);
  assert.equal(c.requests.length, 5);
  assert.deepEqual(c.requests.at(-1), { page: 1, page_size: 15, make: "subaru", model: "ascent", year: 2021 });
  await c.handleDesktopVehicleMakeUpdate("toyota");
  await flushCatalog();
  assert.deepEqual(calls.slice(-2), [["models", "toyota"], ["years", "toyota", undefined]]);
  assert.deepEqual(c.requests.at(-1), { page: 1, page_size: 15, make: "toyota" });
});

test("desktop filters stay continuously disabled from option loading through product completion", async (t) => {
  const models = deferred(), years = deferred(), products = deferred();
  const c = await catalog(t, "/catalog", {}, {
    getVehicleModels: () => models.promise,
    getVehicleYears: () => years.promise,
    getCatalogProductsRaw: () => products.promise,
  });
  const transitions = [];
  const stop = vue.watch(c.desktopFiltersDisabled, (value) => transitions.push(value), { flush: "sync" });
  t.after(stop);
  const updating = c.handleDesktopVehicleMakeUpdate("subaru");
  assert.equal(c.desktopFiltersDisabled.value, true);
  models.resolve([]);
  await flushCatalog();
  assert.equal(c.requests.length, 1);
  years.resolve([]);
  await updating;
  assert.equal(c.requests.length, 2);
  assert.equal(c.desktopFiltersDisabled.value, true);
  assert.deepEqual(transitions, [true]);
  products.resolve({ count: 0, results: [], total_pages: 1, page_size: 15, facets: {} });
  await flushCatalog();
  assert.deepEqual(transitions, [true, false]);
});

test("failed vehicle options remain retryable and product errors release desktop filters", async (t) => {
  let fail = true, modelCalls = 0;
  const c = await catalog(t, "/catalog", {}, {
    getVehicleModels: async () => { modelCalls++; if (fail) throw new Error("offline"); return []; },
    getCatalogProductsRaw: async () => { throw new Error("products offline"); },
  });
  await c.handleDesktopVehicleMakeUpdate("subaru");
  await flushCatalog();
  assert.equal(c.desktopFiltersDisabled.value, false);
  assert.match(c.vehicleOptionsError.value.message, /offline/);
  fail = false;
  await c.handleDesktopVehicleMakeUpdate("subaru");
  await flushCatalog();
  assert.equal(modelCalls, 2);
  assert.equal(c.vehicleOptionsError.value, null);
  assert.equal(c.desktopFiltersDisabled.value, false);
});

test("late vehicle responses cannot replace the latest draft or populate a departed catalog", async (t) => {
  const oldModels = deferred();
  const c = await catalog(t, "/catalog", {}, {
    getVehicleModels: async (make) => make === "subaru" ? oldModels.promise : [{ slug: "camry", name: "Camry" }],
    getVehicleYears: async (make) => [{ year: make === "subaru" ? 2019 : 2020 }],
  });
  const first = c.handleDraftVehicleMakeUpdate("subaru");
  await c.handleDraftVehicleMakeUpdate("toyota");
  oldModels.resolve([{ slug: "ascent", name: "Ascent" }]);
  await first;
  assert.equal(c.vehicleModelsResponse.value[0].slug, "camry");
  assert.equal(c.vehicleYearsResponse.value[0].year, 2020);

  const late = deferred();
  const departed = await catalog(t, "/catalog", {}, { getVehicleModels: () => late.promise });
  const loading = departed.handleDraftVehicleMakeUpdate("subaru");
  departed.unmount();
  late.resolve([{ slug: "ascent", name: "Ascent" }]);
  await loading;
  assert.deepEqual(departed.vehicleModelsResponse.value, []);
});
