import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const vue = require("vue");
const { createRouter, createMemoryHistory, useRoute, useRouter } = require("vue-router");
const { parse } = require("@vue/compiler-sfc");
const { baseParse } = require("@vue/compiler-dom");
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
async function mountSearch(location) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/:pathMatch(.*)*", component: { render: () => null } }],
  });
  await router.push(location);
  const trackedSearches = [];
  const mocks = {
    "@vueuse/core": {
      onClickOutside() {}, useMediaQuery: () => vue.ref(false), useDebounceFn: (fn) => fn,
    },
    "~/components/common/BasePicture.vue": {},
    "~/composables/catalog/useCatalogApi": {
      useCatalogApi: () => ({ getCatalogCategoriesRaw: async () => [], getCatalogProductSuggestions: async () => [] }),
    },
    "~/composables/catalog/useCatalogPlaceholderMedia": { useCatalogPlaceholderMedia: () => ({ cardPlaceholderImage: {} }) },
    "~/utils/routePaths": { buildCatalogCategoryPath: (slug) => `/catalog/category/${slug}` },
    "~/utils/pageScrollCoordinator": { waitForPageReady: async () => {} },
  };
  const globals = {
    ...vue, useRoute, useRouter,
    defineEmits: () => () => {}, defineProps: () => ({}),
    withDefaults: (props, defaults) => ({ ...defaults, ...props }), defineExpose() {},
    useEcommerceAnalytics: () => ({ trackSearch: (q) => trackedSearches.push(q) }),
    useCookieConsent: () => ({ functionalityConsentGranted: vue.ref(false) }),
    window: { localStorage: { removeItem() {} }, requestAnimationFrame() {} },
    document: { body: { style: {} } },
  };
  let search;
  const app = renderer.createApp({
    setup() {
      search = new Function("require", "exports", ...Object.keys(globals),
        `${outputText}\nreturn { searchText, handleSearchInput, submitSearch };`,
      )((name) => mocks[name] ?? require(name), {}, ...Object.values(globals));
      return () => null;
    },
  });
  app.use(router);
  app.mount({});
  await flush();
  const input = async (value) => {
    search.searchText.value = value;
    await search.handleSearchInput({ target: { value } });
    await flush();
  };
  return { search, router, input, trackedSearches, app };
}

const term = "ფარი";

test("manual clearing removes the applied search before changing vehicle make", async (t) => {
  const context = await mountSearch({ path: "/catalog", query: { q: term, make: "subaru", page: "3", ordering: "price" } });
  t.after(() => context.app.unmount());
  await context.input("");
  assert.deepEqual(context.router.currentRoute.value.query, { make: "subaru", ordering: "price" });
  await context.router.push({ path: "/catalog", query: { ...context.router.currentRoute.value.query, make: "volkswagen" } });
  await flush();
  assert.equal(context.search.searchText.value, "");
  assert.equal(context.router.currentRoute.value.query.q, undefined);
  assert.deepEqual(context.trackedSearches, []);
});

test("clearing preserves the category, hash and all other filters", async (t) => {
  const filters = { make: "subaru", model: "xv", year: "2017", engine: "2", category: "lights", brand: "suo-lun", side: "left", placement: "front", in_stock: "true", on_sale: "true", has_image: "true", min_price: "10", max_price: "300", ordering: "-price", extra: ["a", "b"] };
  const context = await mountSearch({ path: "/catalog/category/lights", query: { ...filters, q: term, page: "2" }, hash: "#results" });
  t.after(() => context.app.unmount());
  await context.input("   ");
  assert.equal(context.router.currentRoute.value.path, "/catalog/category/lights");
  assert.equal(context.router.currentRoute.value.hash, "#results");
  assert.deepEqual(context.router.currentRoute.value.query, filters);
});

test("editing a nonempty term keeps the existing submit-search behavior", async (t) => {
  const context = await mountSearch({ path: "/catalog", query: { q: term, make: "subaru" } });
  t.after(() => context.app.unmount());
  await context.input("სარკე");
  assert.deepEqual(context.router.currentRoute.value.query, { q: term, make: "subaru" });
  await context.search.submitSearch();
  await flush();
  assert.deepEqual(context.router.currentRoute.value.query, { q: "სარკე" });
  assert.deepEqual(context.trackedSearches, ["სარკე"]);
});

test("clearing outside catalog listings does not navigate or alter query parameters", async (t) => {
  for (const path of ["/", "/catalog/FD-01-0001", "/profile"]) {
    const context = await mountSearch({ path, query: { q: term, page: "2" } });
    t.after(() => context.app.unmount());
    const previous = context.router.currentRoute.value.fullPath;
    await context.input("");
    assert.equal(context.router.currentRoute.value.fullPath, previous);
  }
});

test("clearing an unapplied draft does not reset filters or pagination", async (t) => {
  const context = await mountSearch({ path: "/catalog/", query: { make: "subaru", page: "3" } });
  t.after(() => context.app.unmount());
  await context.input("ფ");
  await context.input("");
  assert.deepEqual(context.router.currentRoute.value.query, { make: "subaru", page: "3" });
});

test("browser back restores the prior applied search and clearing supports array queries", async (t) => {
  const context = await mountSearch({ path: "/catalog/", query: { q: [term, "other"], make: "subaru" } });
  t.after(() => context.app.unmount());
  await context.input("");
  const restored = new Promise((resolve) => {
    const remove = context.router.afterEach(() => { remove(); resolve(); });
  });
  context.router.back();
  await restored;
  await flush();
  assert.equal(context.search.searchText.value, term);
  assert.deepEqual(context.router.currentRoute.value.query.q, [term, "other"]);
});

test("both desktop and mobile search inputs handle user clearing", () => {
  const inputs = [];
  const visit = (node) => {
    if (node.tag === "input" && node.props?.some((prop) => prop.name === "model" && prop.exp?.content === "searchText")) inputs.push(node);
    for (const child of node.children ?? []) visit(child);
  };
  visit(baseParse(descriptor.template.content));
  assert.equal(inputs.length, 2);
  for (const input of inputs) {
    assert.ok(input.props.some((prop) => prop.name === "on" && prop.arg?.content === "input" && prop.exp?.content === "handleSearchInput"));
  }
});
