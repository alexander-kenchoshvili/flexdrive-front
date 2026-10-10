import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const vue = require("vue");
const { createRouter, createMemoryHistory } = require("vue-router");

function execute(path, globals = {}, mocks = {}, client = true) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8").replaceAll("import.meta.client", String(client));
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  return new Function("require", "exports", ...Object.keys(globals), `${outputText}\nreturn exports;`)(
    (name) => mocks[name] ?? require(name), exports, ...Object.values(globals),
  );
}
const normalization = execute("app/utils/searchAnalytics.ts");
const routing = execute("app/utils/businessRouting.ts");
const trackingHost = execute("app/utils/trackingHost.ts");

async function context(t, location = "/catalog?q=ფარი", { consent = true, client = true, gtmId = "GTM-EXAMPLE1", hostname = "flexdrive.ge" } = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/:pathMatch(.*)*", component: { render: () => null } }],
  });
  await router.push(location);
  const trackingConsentGranted = vue.ref(consent);
  const states = new Map();
  const window = { location: { pathname: router.currentRoute.value.path, hostname }, localStorage: { removeItem() {} } };
  const scope = vue.effectScope();
  t.after(() => scope.stop());
  const globals = {
    ...vue, window, useRouter: () => router,
    useState: (key, init) => {
      if (!states.has(key)) states.set(key, vue.ref(init()));
      return states.get(key);
    },
    useCookieConsent: () => ({ trackingConsentGranted }),
    useRuntimeConfig: () => ({ public: { gtmId } }),
  };
  const analytics = execute("app/composables/useEcommerceAnalytics.ts", globals, {
    "~/utils/businessRouting": routing, "~/utils/searchAnalytics": normalization,
    "~/utils/trackingHost": trackingHost,
  }, client);
  globals.useEcommerceAnalytics = analytics.useEcommerceAnalytics;
  const catalog = execute("app/composables/catalog/useCatalogSearchAnalytics.ts", globals, {}, client);
  let tracking;
  let events;
  scope.run(() => {
    events = analytics.useEcommerceAnalytics();
    tracking = catalog.useCatalogSearchAnalytics();
  });
  return {
    ...tracking, events, trackingConsentGranted, window,
    remount: () => scope.run(() => catalog.useCatalogSearchAnalytics()),
    go: async (path) => {
      await router.push(path);
      window.location.pathname = router.currentRoute.value.path;
      await vue.nextTick();
    },
    layer: () => window.dataLayer ?? [],
  };
}

test("successful search uses the API total, including zero, not current page length", async (t) => {
  const c = await context(t);
  c.recordSearchResults(c.captureSearch({ q: "ფარი" }), 83);
  assert.deepEqual(c.layer(), [{ event: "search", search_term: "ფარი", search_result_count: 83,
    search_outcome: "results", search_filtered: "no", search_tracking_version: "2" }]);
  await c.go("/catalog?q=უცნობი");
  c.recordSearchResults(c.captureSearch({ q: "უცნობი" }), 0);
  assert.equal(c.layer()[1].search_outcome, "no_results");
  assert.equal(c.layer()[1].search_result_count, 0);
});

test("pagination, sorting, retry, filtering and category remount do not duplicate the same search", async (t) => {
  const c = await context(t);
  c.recordSearchResults(c.captureSearch({ q: "ფარი" }), 83);
  for (const path of ["/catalog?q=ფარი&page=2", "/catalog?q=ფარი&ordering=price_asc", "/catalog/category/lights?q=ფარი&in_stock=true"]) {
    await c.go(path);
    const remount = c.remount();
    const snapshot = remount.captureSearch({ q: "ფარი", in_stock: true });
    remount.recordSearchResults(snapshot, 50);
    remount.recordSearchResults(snapshot, 50);
  }
  assert.equal(c.layer().length, 1);
});

test("empty search resets deduplication; returning to catalog is a new search view", async (t) => {
  const c = await context(t);
  c.recordSearchResults(c.captureSearch({ q: "ფარი" }), 5);
  await c.go("/catalog");
  c.recordSearchResults(c.captureSearch({}), 2037);
  await c.go("/catalog?q=ფარი");
  c.recordSearchResults(c.captureSearch({ q: "ფარი" }), 5);
  await c.go("/catalog/FD-01-0001");
  await c.go("/catalog?q=ფარი");
  c.remount().recordSearchResults(c.captureSearch({ q: "ფარი" }), 5);
  assert.equal(c.layer().length, 3);
});

test("stale results cannot attach to a newer route or a later identical search", async (t) => {
  const c = await context(t);
  const old = c.captureSearch({ q: "ფარი" });
  await c.go("/catalog?q=სარკე");
  c.recordSearchResults(old, 0);
  await c.go("/catalog?q=ფარი");
  c.recordSearchResults(old, 0);
  assert.deepEqual(c.layer(), []);
  const current = c.captureSearch({ q: "ფარი" });
  await c.go("/catalog?q=ფარი&page=2");
  c.recordSearchResults(current, 0);
  assert.deepEqual(c.layer(), []);
  c.recordSearchResults(c.captureSearch({ q: "ფარი", page: 2 }), 9);
  assert.equal(c.layer()[0].search_result_count, 9);
});

test("failed/missing/invalid counts are never converted to zero and a valid retry can count", async (t) => {
  const c = await context(t);
  const snapshot = c.captureSearch({ q: "ფარი" });
  for (const count of [undefined, null, "0", NaN, Infinity, -1, 1.5]) c.recordSearchResults(snapshot, count);
  assert.deepEqual(c.layer(), []);
  c.recordSearchResults(snapshot, 7);
  assert.equal(c.layer()[0].search_result_count, 7);
});

test("filtered searches are marked; pagination/sort do not imply a filtered search", async (t) => {
  const c = await context(t);
  assert.equal(c.captureSearch({ q: "ფარი", page: 2, ordering: "price_asc", in_stock: false }).filtered, false);
  c.recordSearchResults(c.captureSearch({ q: "ფარი", min_price: 0, make: "subaru" }), 0);
  assert.equal(c.layer()[0].search_filtered, "yes");
});

test("denied searches are not replayed after consent; the next search is allowed", async (t) => {
  const c = await context(t, undefined, { consent: false });
  const snapshot = c.captureSearch({ q: "ფარი" });
  c.recordSearchResults(snapshot, 0);
  c.trackingConsentGranted.value = true;
  await vue.nextTick();
  c.recordSearchResults(snapshot, 0);
  assert.deepEqual(c.layer(), []);
  await c.go("/catalog?q=სარკე");
  c.recordSearchResults(c.captureSearch({ q: "სარკე" }), 2);
  assert.equal(c.layer().length, 1);
});

test("SSR, invalid GTM and private business routes emit no search or selection events", async (t) => {
  for (const options of [{ client: false }, { gtmId: "invalid" }]) {
    const c = await context(t, undefined, options);
    c.recordSearchResults(c.captureSearch({ q: "ფარი" }), 0);
    c.events.trackSearch("ფარი", 0);
    c.events.trackSearchSelection("ფარი", "FD-01-0001");
    assert.deepEqual(c.layer(), []);
  }
  const c = await context(t, "/business?q=ფარი");
  c.events.trackSearch("ფარი", 0);
  c.events.trackSearchSelection("ფარი", "FD-01-0001");
  assert.deepEqual(c.layer(), []);
});

test("suggestion selection is separate from result counts and requires a company code", async (t) => {
  const c = await context(t);
  c.events.trackSearchSelection(" ფარი ", "FD-01-0001");
  c.events.trackSearchSelection("ფარი", "");
  assert.deepEqual(c.layer(), [{ event: "select_search_result", search_term: "ფარი",
    selected_item_id: "FD-01-0001", search_tracking_version: "2" }]);
});

test("analytics copy is bounded and masks obvious contacts without altering company/OEM codes", () => {
  assert.equal(normalization.normalizeSearchAnalyticsTerm("  ფარი  a@example.com +995 599 12 34 56  "), "ფარი [email] [phone]");
  assert.equal(normalization.normalizeSearchAnalyticsTerm("FD-01-0001 1234567890"), "FD-01-0001 1234567890");
  assert.equal(normalization.normalizeSearchAnalyticsTerm("x".repeat(255)).length, 100);
});

test("actual catalog setup reports its loaded API count after mount and ignores failed refreshes", async (t) => {
  const { parse } = require("@vue/compiler-sfc");
  const source = readFileSync(new URL("../app/components/SmartComponents/ProductCatalog/ProductCatalog.vue", import.meta.url), "utf8");
  const { descriptor } = parse(source);
  const { outputText } = ts.transpileModule(descriptor.scriptSetup.content.replaceAll("import.meta.client", "true"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const mounted = [];
  const stops = [];
  const recorded = [];
  const route = vue.reactive({ path: "/catalog", fullPath: "/catalog?q=ფარი", query: { q: "ფარი" } });
  const response = { count: 83, results: [{ id: 1 }], total_pages: 6, page_size: 15, facets: {} };
  let fail = false;
  const api = {
    getCatalogProducts: async () => ({ data: vue.ref(response), error: vue.ref(null) }),
    getCatalogProductsRaw: async () => { if (fail) throw new Error("offline"); return { ...response, count: 42 }; },
    getCatalogCategories: async () => ({ data: vue.ref([]), error: vue.ref(null) }),
    getCatalogCategoriesRaw: async () => [], getVehicleMakes: async () => [],
  };
  const mocks = {
    "~/utils/pageScrollCoordinator": { markPagePending() {}, markPageReady() {} },
    "@vueuse/core": { useMediaQuery: () => vue.ref(false) },
    pinia: { storeToRefs: () => ({ settings: vue.ref({}) }) },
    "~/composables/useIndexingPolicy": { useIndexingPolicy: () => ({ robots: vue.ref("") }) },
    "~/composables/catalog/useCatalogApi": { useCatalogApi: () => api },
    "~/composables/catalog/useCatalogSearchAnalytics": { useCatalogSearchAnalytics: () => ({
      captureSearch: (params) => ({ term: params.q, path: route.fullPath }),
      recordSearchResults: (...args) => recorded.push(args),
    }) },
    "~/utils/routePaths": { getCatalogCategorySlugFromPath: () => null },
    "~/utils/cmsCollectionSeo": {}, "~/utils/structuredData": {},
  };
  const globals = {
    ...vue, defineProps: () => ({}), useRoute: () => route,
    useRouter: () => ({ currentRoute: vue.ref(route) }),
    useRuntimeConfig: () => ({ public: {} }), useSiteSettings: () => ({}),
    watch: (...args) => { const stop = vue.watch(...args); stops.push(stop); return stop; },
    onMounted: (callback) => mounted.push(callback), useHead() {}, useSeoMeta() {},
  };
  t.after(() => stops.forEach((stop) => stop()));
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const catalog = await new AsyncFunction("require", "exports", ...Object.keys(globals), `${outputText}\nreturn { loadProducts };`)(
    (name) => mocks[name] ?? (name.endsWith(".vue") ? {} : require(name)), {}, ...Object.values(globals),
  );
  assert.deepEqual(recorded, []); // SSR/setup itself is not an analytics event.
  mounted.forEach((callback) => callback());
  assert.equal(recorded[0][0].term, "ფარი");
  assert.equal(recorded[0][1], 83); // One rendered card, 83 matching products.
  await catalog.loadProducts();
  assert.equal(recorded[1][1], 42);
  fail = true;
  await catalog.loadProducts();
  assert.equal(recorded.length, 2); // An API error is not zero results.
});


test("nonproduction hosts emit no search, selection, cart or purchase events despite granted consent", async (t) => {
  const item = { sku: "FD-01-0001", name: "Headlight", price: 40, quantity: 1 };
  for (const hostname of ["localhost", "127.0.0.1", "flexdrive-front.vercel.app",
    "flexdrive-prod-front-pdzcv.ondigitalocean.app", "staging.flexdrive.ge", "www.flexdrive.ge", "flexdrive.ge.evil.test", ""]) {
    const c = await context(t, undefined, { hostname });
    c.recordSearchResults(c.captureSearch({ q: "ფარი" }), 2);
    c.events.trackSearch("ფარი", 2);
    c.events.trackSearchSelection("ფარი", item.sku);
    c.events.trackViewItem(item);
    c.events.trackAddToCart(item, 1);
    c.events.trackPurchase({ transactionId: "test-order", items: [item], value: 40 });
    assert.equal(c.window.dataLayer, undefined, hostname);
  }
});

test("canonical production host preserves cart and purchase event IDs and values", async (t) => {
  const c = await context(t);
  const item = { sku: "FD-01-0001", name: "Headlight", price: 40, quantity: 1 };
  c.events.trackAddToCart(item, 1);
  c.events.trackPurchase({ transactionId: "test-order", items: [item], value: 40 });
  const events = c.layer().filter((entry) => entry.event);
  assert.deepEqual(events.map((entry) => entry.event), ["add_to_cart", "purchase"]);
  assert.equal(events[1].ecommerce.event_id, "purchase-test-order");
  assert.equal(events[1].ecommerce.currency, "GEL");
  assert.equal(events[1].ecommerce.value, 40);
  assert.equal(events[1].ecommerce.items[0].item_id, item.sku);
});
