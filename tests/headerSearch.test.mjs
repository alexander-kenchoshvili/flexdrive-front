import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const vue = require("vue");
const { createRouter, createMemoryHistory, useRoute, useRouter } = require("vue-router");
const { parse } = require("@vue/compiler-sfc");
const source = readFileSync(new URL("../app/components/LAYOUTS/HeaderSearch.vue", import.meta.url), "utf8");
const { descriptor } = parse(source);
const { outputText } = ts.transpileModule(
  descriptor.scriptSetup.content.replaceAll("import.meta.client", "true"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
);
const renderer = vue.createRenderer({
  createComment: () => ({}), createText: () => ({}), createElement: () => ({}),
  insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {},
  parentNode: () => null, nextSibling: () => null,
});
const flush = async () => { await vue.nextTick(); await vue.nextTick(); };

// Execute the actual component setup and watchers with real Vue and an in-memory router.
// Replace only browser storage, Nuxt macros, API calls and unrelated integrations.
async function mountSearch(location, options = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/:pathMatch(.*)*", component: { render: () => null } }],
  });
  await router.push(location);
  const trackedSearches = [];
  const trackedSelections = [];
  const mocks = {
    "@vueuse/core": {
      onClickOutside() {}, useMediaQuery: () => options.mobileViewport ?? vue.ref(false), useDebounceFn: options.debounce ?? ((fn) => fn),
    },
    "~/components/common/BasePicture.vue": {},
    "./HeaderSearchFilters.vue": {},
    "~/composables/catalog/useCatalogApi": {
      useCatalogApi: () => ({ getCatalogCategoriesRaw: options.fetchCategories ?? (async () => []), getCatalogProductSuggestions: options.fetchSuggestions ?? (async () => []), getVehicleMakes: async () => [], getVehicleModels: options.fetchModels ?? (async () => []), getVehicleYears: options.fetchYears ?? (async () => []) }),
    },
    "~/composables/catalog/useCatalogPlaceholderMedia": { useCatalogPlaceholderMedia: () => ({ cardPlaceholderImage: {} }) },
    "~/utils/routePaths": { getCatalogCategorySlugFromPath: (path) => /^\/catalog\/category\/([^/]+)\/?$/.exec(path)?.[1] || null },
    "~/utils/pageScrollCoordinator": { waitForPageReady: async () => {} },
  };
  const globals = {
    ...vue, useRoute, useRouter,
    defineEmits: () => () => {}, defineProps: () => ({}),
    withDefaults: (props, defaults) => ({ ...defaults, ...props }), defineExpose() {},
    useEcommerceAnalytics: () => ({ trackSearch: (q) => trackedSearches.push(q), trackSearchSelection: (...args) => trackedSelections.push(args) }),
    navigateTo: (path) => router.push(path),
    useCookieConsent: () => ({ functionalityConsentGranted: vue.ref(false) }),
    window: { localStorage: { removeItem() {} }, requestAnimationFrame() {} },
    document: { body: { style: {} } },
  };
  let search;
  const app = renderer.createApp({
    setup() {
      search = new Function("require", "exports", ...Object.keys(globals),
        `${outputText}\nreturn { searchText, clearFilters, selectedMake, selectedModel, selectedYear, selectedCategories, updateMake, updateModel, models, years, vehiclePending, filterError, ensureFiltersLoaded, handleInputKeydown, submitSearch, goToSuggestion, openDesktopPanel, closeDesktopPanel, openMobileSheet, closeMobileSheet, suggestions, suggestionsPending, suggestionsError, showSuggestionList, showNoResults, lastCompletedQuery };`,
      )((name) => mocks[name] ?? require(name), {}, ...Object.values(globals));
      return () => null;
    },
  });
  app.use(router);
  app.mount({});
  await flush();
  const input = async (value) => {
    search.searchText.value = value;
    await flush();
  };
  return { search, router, input, trackedSearches, trackedSelections, app };
}

const term = "ფარი";

test("choosing a suggestion records selection with public company SKU, not another search", async (t) => {
  const context = await mountSearch("/");
  t.after(() => context.app.unmount());
  await context.input("ფარი");
  await context.search.goToSuggestion({ name: "ფარი", slug: "FD-01-0001", sku: "FD-01-0001", display_sku: "FD-01-0001" });
  assert.deepEqual(context.trackedSearches, []);
  assert.deepEqual(context.trackedSelections, [["ფარი", "FD-01-0001"]]);
  assert.equal(context.router.currentRoute.value.path, "/catalog/FD-01-0001");
});

test("clearing and selecting filters remain a draft until explicit submission", async (t) => {
  const context = await mountSearch({ path: "/catalog", query: { q: term, make: "subaru", page: "3" } });
  t.after(() => context.app.unmount());
  const original = context.router.currentRoute.value.fullPath;
  await context.input("");
  context.search.updateMake("volkswagen");
  context.search.selectedCategories.value = ["lights", "mirrors"];
  await flush();
  assert.equal(context.router.currentRoute.value.fullPath, original);
  await context.search.submitSearch();
  assert.deepEqual(context.router.currentRoute.value.query, { make: "volkswagen", categories: "lights,mirrors" });
});

test("text and all supported filters are submitted together without engine or old pagination", async (t) => {
  const context = await mountSearch({ path: "/catalog", query: { q: term, make: "subaru", engine: "2", page: "3" } });
  t.after(() => context.app.unmount());
  await context.input("სარკე");
  context.search.selectedModel.value = "forester";
  context.search.selectedYear.value = "2018";
  context.search.selectedCategories.value = ["mirrors", "body"];
  await context.search.submitSearch();
  assert.deepEqual(context.router.currentRoute.value.query, { q: "სარკე", make: "subaru", model: "forester", year: "2018", categories: "mirrors,body" });
  assert.deepEqual(context.trackedSearches, []);
});

test("a make change clears dependent model and year, and model change clears year", async (t) => {
  const context = await mountSearch("/catalog?make=subaru&model=forester&year=2018");
  t.after(() => context.app.unmount());
  context.search.updateModel("xv");
  assert.equal(context.search.selectedYear.value, "");
  context.search.selectedYear.value = "2020";
  context.search.updateMake("volkswagen");
  assert.equal(context.search.selectedModel.value, "");
  assert.equal(context.search.selectedYear.value, "");
  assert.equal(context.router.currentRoute.value.query.make, "subaru");
});

test("reset clears the draft only, and submitting it opens the unfiltered catalog", async (t) => {
  const context = await mountSearch("/catalog?q=part&make=subaru&categories=lights,mirrors");
  t.after(() => context.app.unmount());
  context.search.clearFilters();
  assert.equal(context.search.searchText.value, "");
  assert.deepEqual(context.search.selectedCategories.value, []);
  assert.equal(context.router.currentRoute.value.query.make, "subaru");
  await context.search.submitSearch();
  assert.equal(context.router.currentRoute.value.fullPath, "/catalog");
});

test("one-character queries do not submit, while text-only and filter-only searches work", async (t) => {
  const context = await mountSearch("/");
  t.after(() => context.app.unmount());
  await context.input("ფ");
  await context.search.submitSearch();
  assert.equal(context.router.currentRoute.value.path, "/");
  await context.input("ფარი");
  await context.search.submitSearch();
  assert.deepEqual(context.router.currentRoute.value.query, { q: "ფარი" });
});

test("Enter submits the same filter draft as the search button", async (t) => {
  const context = await mountSearch("/");
  t.after(() => context.app.unmount());
  context.search.selectedCategories.value = ["lights"];
  let prevented = false;
  await context.search.handleInputKeydown({ key: "Enter", preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.deepEqual(context.router.currentRoute.value.query, { categories: "lights" });
});

test("route synchronization and browser back restore text and all filter selections", async (t) => {
  const context = await mountSearch("/catalog?q=part&make=subaru&model=forester&year=2018&categories=lights,mirrors");
  t.after(() => context.app.unmount());
  await context.router.push("/catalog/category/body?q=bumper");
  await flush();
  assert.deepEqual(context.search.selectedCategories.value, ["body"]);
  assert.equal(context.search.selectedMake.value, "");
  const restored = new Promise((resolve) => { const remove = context.router.afterEach(() => { remove(); resolve(); }); });
  context.router.back();
  await restored;
  await flush();
  assert.equal(context.search.searchText.value, "part");
  assert.equal(context.search.selectedModel.value, "forester");
  assert.equal(context.search.selectedYear.value, "2018");
  assert.deepEqual(context.search.selectedCategories.value, ["lights", "mirrors"]);
});

function deferredSearchOptions() {
  const queued = [];
  const requests = [];
  return {
    queued, requests,
    debounce: (fn) => (query) => queued.push(() => fn(query)),
    fetchSuggestions: (query) => new Promise((resolve, reject) => requests.push({ query, resolve, reject })),
  };
}

test("an old response cannot appear while the new input is waiting for debounce", async (t) => {
  const options = deferredSearchOptions();
  const context = await mountSearch("/", options);
  t.after(() => context.app.unmount());
  await context.search.openDesktopPanel();
  await context.input("სარკე");
  options.queued.shift()();
  await context.input("ფარი");
  options.requests[0].resolve([{ id: 1, name: "სარკე" }]);
  await flush();
  assert.deepEqual(context.search.suggestions.value, []);
  assert.equal(context.search.suggestionsPending.value, true);
  assert.equal(context.search.showSuggestionList.value, false);
  assert.equal(context.search.showNoResults.value, false);
  options.queued.shift()();
  options.requests[1].resolve([]);
  await flush();
  assert.equal(context.search.lastCompletedQuery.value, "ფარი");
  assert.equal(context.search.showNoResults.value, true);
});

test("clearing or shortening the input invalidates an in-flight result and error", async (t) => {
  for (const nextInput of ["", "ფ"]) {
    const options = deferredSearchOptions();
    const context = await mountSearch("/", options);
    t.after(() => context.app.unmount());
    await context.search.openDesktopPanel();
    await context.input("სარკე");
    options.queued.shift()();
    await context.input(nextInput);
    options.requests[0].reject(new Error("Old request failed"));
    await flush();
    assert.deepEqual(context.search.suggestions.value, []);
    assert.equal(context.search.suggestionsPending.value, false);
    assert.equal(context.search.suggestionsError.value, null);
    assert.equal(context.search.lastCompletedQuery.value, "");
  }
});

test("obsolete queued debounces do not send requests", async (t) => {
  const options = deferredSearchOptions();
  const context = await mountSearch("/", options);
  t.after(() => context.app.unmount());
  await context.search.openDesktopPanel();
  await context.input("სარკე");
  await context.input("ფარი");
  options.queued.shift()();
  assert.equal(options.requests.length, 0);
  options.queued.shift()();
  assert.equal(options.requests.length, 1);
  assert.equal(options.requests[0].query, "ფარი");
  options.requests[0].resolve([{ id: 2, name: "ფარი" }]);
  await flush();
  assert.equal(context.search.showSuggestionList.value, true);
});

test("closing the search ignores pending and queued requests", async (t) => {
  const options = deferredSearchOptions();
  const context = await mountSearch("/", options);
  t.after(() => context.app.unmount());
  await context.search.openDesktopPanel();
  await context.input("სარკე");
  options.queued.shift()();
  await context.input("ფარი");
  context.search.closeDesktopPanel();
  options.queued.shift()();
  options.requests[0].resolve([{ id: 1, name: "სარკე" }]);
  await flush();
  assert.equal(options.requests.length, 1);
  assert.deepEqual(context.search.suggestions.value, []);
  assert.equal(context.search.suggestionsPending.value, false);
});

test("older responses and failures cannot overwrite newer completed results", async (t) => {
  const options = deferredSearchOptions();
  const context = await mountSearch("/", options);
  t.after(() => context.app.unmount());
  await context.search.openDesktopPanel();
  await context.input("სარკე");
  options.queued.shift()();
  await context.input("ფარი");
  options.queued.shift()();
  options.requests[1].resolve([{ id: 2, name: "ფარი" }]);
  await flush();
  options.requests[0].reject(new Error("Old request failed"));
  await flush();
  assert.equal(context.search.suggestions.value[0].id, 2);
  assert.equal(context.search.lastCompletedQuery.value, "ფარი");
  assert.equal(context.search.suggestionsError.value, null);
});


test("mobile reopening with unchanged input reloads suggestions", async (t) => {
  const requests = [];
  const context = await mountSearch("/", {
    mobileViewport: vue.ref(true),
    fetchSuggestions: async (query) => { requests.push(query); return [{ id: 1, name: query }]; },
  });
  t.after(() => context.app.unmount());
  await context.search.openMobileSheet();
  await context.input("სარკე");
  assert.equal(context.search.showSuggestionList.value, true);
  context.search.closeMobileSheet();
  await context.search.openMobileSheet();
  await flush();
  assert.equal(context.search.searchText.value, "სარკე");
  assert.deepEqual(requests, ["სარკე", "სარკე"]);
  assert.equal(context.search.showSuggestionList.value, true);
});

test("mobile opening fetches an existing route query", async (t) => {
  const requests = [];
  const context = await mountSearch({ path: "/catalog", query: { q: "სარკე" } }, {
    mobileViewport: vue.ref(true),
    fetchSuggestions: async (query) => { requests.push(query); return [{ id: 1, name: query }]; },
  });
  t.after(() => context.app.unmount());
  await context.search.openMobileSheet();
  await flush();
  assert.deepEqual(requests, ["სარკე"]);
  assert.equal(context.search.showSuggestionList.value, true);
});

test("a closed mobile request cannot overwrite the reopened search", async (t) => {
  const options = { ...deferredSearchOptions(), mobileViewport: vue.ref(true) };
  const context = await mountSearch("/", options);
  t.after(() => context.app.unmount());
  await context.search.openMobileSheet();
  await context.input("სარკე");
  options.queued.shift()();
  context.search.closeMobileSheet();
  await context.search.openMobileSheet();
  assert.equal(options.requests.length, 2);
  options.requests[0].resolve([{ id: 1, name: "obsolete" }]);
  await flush();
  assert.deepEqual(context.search.suggestions.value, []);
  assert.equal(context.search.suggestionsPending.value, true);
  options.requests[1].resolve([{ id: 2, name: "current" }]);
  await flush();
  assert.equal(context.search.suggestions.value[0].id, 2);
  assert.equal(context.search.showSuggestionList.value, true);
});

test("changing filters invalidates old suggestions even when the text is unchanged", async (t) => {
  const options = deferredSearchOptions();
  const receivedFilters = [];
  const fetch = options.fetchSuggestions;
  options.fetchSuggestions = (query, filters) => { receivedFilters.push(filters); return fetch(query); };
  const context = await mountSearch("/", options);
  t.after(() => context.app.unmount());
  await context.search.openDesktopPanel();
  await context.input("სარკე");
  options.queued.shift()();
  context.search.selectedCategories.value = ["mirrors"];
  options.requests[0].resolve([{ id: 1, name: "old" }]);
  await flush();
  assert.equal(context.search.showSuggestionList.value, false);
  options.queued.shift()();
  assert.deepEqual(receivedFilters[1], { categories: "mirrors" });
  options.requests[1].resolve([{ id: 2, name: "current" }]);
  await flush();
  assert.equal(context.search.suggestions.value[0].id, 2);
});

test("late make/model option responses cannot replace the latest vehicle choices", async (t) => {
  const pendingModels = [];
  const pendingYears = [];
  const context = await mountSearch("/", {
    fetchModels: (make) => new Promise((resolve) => pendingModels.push({ make, resolve })),
    fetchYears: (make, model) => new Promise((resolve) => pendingYears.push({ make, model, resolve })),
  });
  t.after(() => context.app.unmount());
  await context.search.openDesktopPanel();
  context.search.updateMake("subaru");
  await flush();
  context.search.updateMake("volkswagen");
  await flush();
  pendingModels[1].resolve([{ slug: "golf", name: "Golf" }]);
  pendingYears[1].resolve([{ year: 2020 }]);
  await flush();
  pendingModels[0].resolve([{ slug: "forester", name: "Forester" }]);
  pendingYears[0].resolve([{ year: 2018 }]);
  await flush();
  assert.equal(context.search.models.value[0].slug, "golf");
  assert.deepEqual(context.search.years.value, [{ year: 2020 }]);
  assert.equal(context.search.vehiclePending.value, false);
});

test("category load failure is recoverable and does not erase selected filters", async (t) => {
  let calls = 0;
  const context = await mountSearch("/catalog?categories=lights", {
    fetchCategories: async () => { if (++calls === 1) throw Error("offline"); return [{ id: 1, slug: "lights", name: "Lights" }]; },
  });
  t.after(() => context.app.unmount());
  await context.search.openDesktopPanel();
  await flush();
  await context.search.ensureFiltersLoaded();
  assert.equal(context.search.filterError.value, "");
  assert.deepEqual(context.search.selectedCategories.value, ["lights"]);
  assert.ok(calls >= 2);
});


test("desktop and mobile search load category lists without opting into empty categories", async (t) => {
  for (const open of ["openDesktopPanel", "openMobileSheet"]) {
    const requestedEmpty = [];
    const context = await mountSearch("/", {
      fetchCategories: async (includeEmpty = false) => { requestedEmpty.push(includeEmpty); return []; },
    });
    t.after(() => context.app.unmount());
    await context.search[open]();
    await flush();
    assert.deepEqual(requestedEmpty, [false], open);
  }
});


test("catalog refinements preserve an unsubmitted header draft and submit together", async (t) => {
  const c = await mountSearch("/catalog");
  t.after(() => c.app.unmount());
  c.search.updateMake("subaru");
  c.search.updateModel("forester");
  c.search.selectedYear.value = "2018";
  c.search.selectedCategories.value = ["lights", "mirrors"];
  await c.router.push("/catalog?brand=tyc&side=left&in_stock=true&ordering=price_asc&page=2");
  await flush();
  assert.equal(c.search.selectedMake.value, "subaru");
  assert.equal(c.search.selectedModel.value, "forester");
  assert.equal(c.search.selectedYear.value, "2018");
  assert.deepEqual(c.search.selectedCategories.value, ["lights", "mirrors"]);
  await c.search.submitSearch();
  assert.deepEqual(c.router.currentRoute.value.query, { brand: "tyc", side: "left", in_stock: "true", ordering: "price_asc", make: "subaru", model: "forester", year: "2018", categories: "lights,mirrors" });
});

test("header resubmission retains applied catalog refinements and resets pagination", async (t) => {
  const c = await mountSearch("/catalog?make=subaru&model=forester&year=2018&categories=lights&brand=tyc&placement=rear&side=left&in_stock=true&on_sale=true&min_price=10&max_price=200&ordering=price_desc&page=3&has_image=true");
  t.after(() => c.app.unmount());
  await c.search.submitSearch();
  assert.deepEqual(c.router.currentRoute.value.query, { brand: "tyc", placement: "rear", side: "left", in_stock: "true", on_sale: "true", min_price: "10", max_price: "200", ordering: "price_desc", make: "subaru", model: "forester", year: "2018", categories: "lights" });
});

test("header Clear explicitly clears catalog refinements on submit", async (t) => {
  const c = await mountSearch("/catalog?make=subaru&categories=lights&brand=tyc&side=left&in_stock=true&min_price=10");
  t.after(() => c.app.unmount());
  c.search.clearFilters();
  await c.router.push("/catalog?make=subaru&categories=lights&brand=tyg&side=left&in_stock=true&min_price=10");
  await flush();
  await c.search.submitSearch();
  assert.equal(c.router.currentRoute.value.fullPath, "/catalog");
});

test("applied vehicle and category route changes still replace the header draft", async (t) => {
  const c = await mountSearch("/catalog?make=subaru&model=forester&year=2018&categories=lights");
  t.after(() => c.app.unmount());
  await c.router.push("/catalog?make=volkswagen&model=jetta&year=2019&categories=mirrors&brand=tyc");
  await flush();
  assert.equal(c.search.selectedMake.value, "volkswagen");
  assert.equal(c.search.selectedModel.value, "jetta");
  assert.equal(c.search.selectedYear.value, "2019");
  assert.deepEqual(c.search.selectedCategories.value, ["mirrors"]);
});
