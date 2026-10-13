import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = process.env.FLEXDRIVE_FRONTEND_ROOT || resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(resolve(root, "package.json"));
const vue = require("vue");
const ts = require("typescript");
const { parse } = require("@vue/compiler-sfc");
const { createError } = require("h3");
const source = (path) => readFileSync(resolve(root, path), "utf8");
const compiled = (code) => ts.transpileModule(code.replaceAll("import.meta.client", "false"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const loader = (mocks) => (name) => mocks[name] ?? (name.endsWith(".vue") || name.endsWith(".css") ? {} : require(name));
function execute(path, globals = {}, mocks = {}) {
  return new Function("require", "exports", ...Object.keys(globals), `${compiled(source(path))}\nreturn exports;`)(loader(mocks), {}, ...Object.values(globals));
}
async function setup(path, globals, mocks, suffix = "", truncate = null) {
  let code = parse(source(path)).descriptor.scriptSetup.content;
  if (truncate) code = code.split(truncate)[0];
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  return new AsyncFunction("require", "exports", ...Object.keys(globals), `${compiled(code)}\n${suffix}`)(loader(mocks), {}, ...Object.values(globals));
}
const publicErrors = execute("app/utils/publicPageError.ts", {}, { "~/utils/httpError": execute("app/utils/httpError.ts") });
const schemaImages = execute("app/utils/productSchemaImage.ts");
const indexing = execute("app/utils/seoIndexing.ts");
const paths = execute("app/utils/routePaths.ts", {}, { "~/utils/seoIndexing": indexing });
const collection = execute("app/utils/cmsCollectionSeo.ts", {}, { "~/utils/seoIndexing": indexing, "~/utils/routePaths": paths });
const response = { count: 1, results: [], total_pages: 1, page_size: 15, facets: {} };
function context(path = "/catalog", query = {}) {
  const route = vue.reactive({ path, fullPath: path, query, params: { slug: "part-fd-02-0001" } });
  const globals = {
    ...vue, useRoute: () => route, useRouter: () => ({ currentRoute: vue.ref(route) }),
    useRuntimeConfig: () => ({ public: { siteUrl: "https://flexdrive.ge", allowIndexing: true, defaultSeoImage: "/brand-logo.png" } }),
    useSiteSettings: () => ({ settings: vue.ref({}) }), useGlobalStore: () => ({ setCurrentMenu() {} }),
    definePageMeta() {}, defineProps: () => ({}), onMounted() {}, onBeforeUnmount() {}, onUnmounted() {},
    watch() {}, useHead() {}, useSeoMeta() {}, createError, showError() {},
  };
  const policy = execute("app/composables/useIndexingPolicy.ts", globals, { "~/utils/seoIndexing": indexing });
  const mocks = {
    pinia: { storeToRefs: (store) => store }, "swiper/vue": {}, "swiper/css": {},
    "@vueuse/core": { useMediaQuery: () => vue.ref(false), watchDebounced() {} },
    "~/utils/publicPageError": publicErrors, "~/utils/productSchemaImage": schemaImages,
    "~/utils/routePaths": paths, "~/utils/cmsCollectionSeo": collection, "~/utils/structuredData": execute("app/utils/structuredData.ts"),
    "~/utils/pageScrollCoordinator": { markPagePending() {}, markPageReady() {} },
    "~/composables/useIndexingPolicy": policy,
    "~/composables/catalog/useCatalogSearchAnalytics": { useCatalogSearchAnalytics: () => ({ captureSearch: () => ({}), recordSearchResults() {} }) },
  };
  return { route, globals, mocks };
}
function catalogApi(overrides = {}) {
  return {
    getCatalogProducts: async () => ({ data: vue.ref(response), error: vue.ref(null) }),
    getCatalogProductsRaw: async () => response,
    getCatalogCategories: async () => ({ data: vue.ref([]), error: vue.ref(null) }),
    getVehicleMakes: async () => [], getVehicleModels: async () => [], getVehicleYears: async () => [], getVehicleEngines: async () => [],
    ...overrides,
  };
}
async function catalog(c, api) {
  c.mocks["~/composables/catalog/useCatalogApi"] = { useCatalogApi: () => api };
  return setup("app/components/SmartComponents/ProductCatalog/ProductCatalog.vue", c.globals, c.mocks,
    "return { loadProducts, productsResponse, productsError, categoryRobots, selectedCategory, loadRouteCategory, routeCategory }; ");
}
async function product(c, request) {
  c.globals.useCartStore = () => ({ items: [] });
  c.globals.useEcommerceAnalytics = () => ({ trackAddToCart() {}, trackViewItem() {} });
  c.mocks["~/stores/useBuyNowStore"] = { useBuyNowStore: () => ({}) };
  c.mocks["~/composables/helpers"] = execute("app/composables/helpers.ts");
  c.mocks["~/composables/commerce/errorUtils"] = {};
  c.mocks["~/composables/catalog/useCatalogPlaceholderMedia"] = execute("app/composables/catalog/useCatalogPlaceholderMedia.ts");
  c.mocks["~/composables/catalog/useCatalogApi"] = { useCatalogApi: () => ({ getCatalogProduct: request }) };
  return setup("app/pages/catalog/[slug].vue", c.globals, c.mocks,
    "return { productSchema, galleryImages, productSeoImage };", "const retryLoad =");
}

test("public errors preserve explicit 404/429/5xx while network failure becomes 503 without raw provider messages", () => {
  for (const status of [404, 429, 500, 502, 503, 504]) assert.equal(publicErrors.publicPageError({ statusCode: status }, "დროებითი შეფერხება").statusCode, status);
  for (const error of [null, new Error("private diagnostic"), { statusCode: 200 }, { statusCode: 401 }]) {
    assert.deepEqual(publicErrors.publicPageError(error, "დროებითი შეფერხება"), { statusCode: 503, statusMessage: "Service Unavailable", message: "დროებითი შეფერხება" });
  }
});

test("actual product setup throws HTTP errors for 503, 404 and thrown network failure", async () => {
  for (const status of [503, 404, 429]) {
    await assert.rejects(product(context(), async () => ({ data: vue.ref(null), error: vue.ref({ statusCode: status, message: "private diagnostic" }) })),
      (error) => error.statusCode === status && !error.statusMessage.includes("private"));
  }
  await assert.rejects(product(context(), async () => { throw new Error("offline"); }), (error) => error.statusCode === 503);
  await assert.rejects(product(context(), async () => ({ data: vue.ref(null), error: vue.ref(null) })), (error) => error.statusCode === 503);
});

test("catalog and blog initial failures are HTTP errors rather than successful empty content", async () => {
  await assert.rejects(catalog(context(), catalogApi({ getCatalogProducts: async () => ({ data: vue.ref(null), error: vue.ref({ statusCode: 502 }) }) })),
    (error) => error.statusCode === 502);
  await assert.rejects(catalog(context(), catalogApi({ getCatalogProducts: async () => { throw new Error("offline"); } })),
    (error) => error.statusCode === 503);
  const c = context("/blogs");
  c.mocks["~/composables/blog/useBlogApi"] = { useBlogApi: () => ({ fetchBlogPosts: async () => { throw { statusCode: 503 }; } }) };
  await assert.rejects(setup("app/components/SmartComponents/BlogList/BlogList.vue", c.globals, c.mocks), (error) => error.statusCode === 503);
});

test("an unknown category is 404, a failed lookup is 503, and a real empty category is 200 with noindex", async () => {
  for (const status of [404, 503]) {
    await assert.rejects(catalog(context("/catalog/category/empty"), catalogApi({
      getCatalogCategory: async () => ({ data: vue.ref(null), error: vue.ref({ statusCode: status }) }),
    })), (error) => error.statusCode === status);
  }
  const c = await catalog(context("/catalog/category/empty"), catalogApi({
    getCatalogProducts: async () => ({ data: vue.ref({ ...response, count: 0 }), error: vue.ref(null) }),
    getCatalogCategory: async () => ({ data: vue.ref({ id: 1, name: "Empty", slug: "empty", product_count: 0 }), error: vue.ref(null) }),
  }));
  assert.equal(c.selectedCategory.value.slug, "empty");
  assert.match(c.categoryRobots.value, /^noindex/);
});

test("later catalog refresh failure retains already loaded results", async () => {
  const c = await catalog(context(), catalogApi({ getCatalogProductsRaw: async () => { throw { statusCode: 503 }; } }));
  const loaded = c.productsResponse.value;
  await c.loadProducts();
  assert.equal(c.productsResponse.value, loaded);
  assert.equal(c.productsError.value.statusCode, 503);
});

test("stale category replies and failures cannot replace a newer route's category", async () => {
  const c = context();
  let rejectOld;
  let resolveNew;
  const result = await catalog(c, catalogApi({ getCatalogCategoryRaw: (slug) => slug === "old"
    ? new Promise((_resolve, reject) => { rejectOld = reject; })
    : new Promise((resolve) => { resolveNew = resolve; }),
  }));
  c.route.path = "/catalog/category/old";
  const old = result.loadRouteCategory();
  c.route.path = "/catalog/category/new";
  const current = result.loadRouteCategory();
  resolveNew({ id: 2, name: "New", slug: "new", product_count: 1 });
  await current;
  rejectOld({ statusCode: 404 });
  await old;
  assert.equal(result.routeCategory.value.slug, "new");
});

test("Product schema ignores gallery/site placeholders while genuine mobile-only and explicit SEO photos work", async () => {
  assert.equal(schemaImages.productSchemaImage({ seo: { image: "https://cdn.example/images/catalog/fallback-product.png?q=1" } }), undefined);
  assert.equal(schemaImages.productSchemaImage({ images: [{ is_primary: true, image: { mobile: "/real-mobile.jpg" } }] }), "/real-mobile.jpg");
  assert.equal(schemaImages.productSchemaImage({ seo: { image: "/real-seo.jpg" } }), "/real-seo.jpg");
  assert.equal(schemaImages.productSchemaImage({ images: [
    { is_primary: true, image: { desktop: null, tablet: null, mobile: null } },
    { is_primary: false, image: { mobile: "/another-real.jpg" } },
  ] }), "/another-real.jpg");
  const c = await product(context(), async () => ({ data: vue.ref({
    id: 1, name: "ნაწილი", sku: "FD-02-0001", price: "10", price_available: true, in_stock: false,
    specs: [], images: [], fitments: [], category: { id: 1, name: "Parts", slug: "parts" }, seo: {},
  }), error: vue.ref(null) }));
  assert.equal("image" in c.productSchema.value, false);
  assert.equal(c.galleryImages.value[0].id, -1);
  assert.match(c.productSeoImage.value, /fallback-product|brand-logo/);
});
