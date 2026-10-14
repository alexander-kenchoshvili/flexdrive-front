import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const root = process.env.FLEXDRIVE_FRONTEND_ROOT || resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(resolve(root, "package.json"));
const ts = require("typescript");
const vue = require("vue");
const { parse } = require("@vue/compiler-sfc");
const { createHead, renderSSRHead } = await import(pathToFileURL(require.resolve("@unhead/vue/server")));
const headApi = await import(pathToFileURL(require.resolve("@unhead/vue")));
const { createHead: createClientHead } = await import(pathToFileURL(require.resolve("@unhead/vue/client")));
const source = (path) => readFileSync(resolve(root, path), "utf8");
const transpile = (code) => ts.transpileModule(
  code.replaceAll("import.meta.client", "false").replaceAll("import.meta.server", "true"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;
const load = (mocks) => (name) => mocks[name] ?? (
  name.endsWith(".vue") || name.endsWith(".css") ? {} : require(name)
);
function execute(path, globals = {}, mocks = {}) {
  return new Function("require", "exports", ...Object.keys(globals), `${transpile(source(path))}\nreturn exports;`)(
    load(mocks), {}, ...Object.values(globals),
  );
}
async function setup(path, globals, mocks, suffix = "", truncateAt = null) {
  let code = parse(source(path)).descriptor.scriptSetup.content;
  if (truncateAt) code = code.split(truncateAt)[0];
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  return new AsyncFunction("require", "exports", ...Object.keys(globals), `${transpile(code)}\n${suffix}`)(
    load(mocks), {}, ...Object.values(globals),
  );
}

const indexing = execute("app/utils/seoIndexing.ts");
const paths = execute("app/utils/routePaths.ts", {}, { "~/utils/seoIndexing": indexing });
const structured = execute("app/utils/structuredData.ts");
const publicErrors = execute("app/utils/publicPageError.ts", {}, { "~/utils/httpError": execute("app/utils/httpError.ts") });
const schemaImages = execute("app/utils/productSchemaImage.ts");
const collection = execute("app/utils/cmsCollectionSeo.ts", {}, {
  "~/utils/seoIndexing": indexing, "~/utils/routePaths": paths,
});

function context(t, path, { query = {}, props = {}, client = false } = {}) {
  // Matches Nuxt's current non-legacy server head configuration.
  const head = client
    ? createClientHead({ document: { head: { querySelector: () => null } }, domOptions: { render() {} } })
    : createHead({ disableDefaults: true });
  const scope = vue.effectScope();
  const route = vue.reactive({ path, fullPath: path, query, params: { slug: "part-fd-02-0001" } });
  const settingsStore = { settings: vue.ref({ site_name: "FlexDrive" }) };
  const globalStore = { setCurrentMenu() {} };
  const disposers = [];
  const globals = {
    ...vue, useRoute: () => route, useRouter: () => ({ currentRoute: vue.ref(route) }),
    useRuntimeConfig: () => ({ public: { siteUrl: "https://flexdrive.ge", allowIndexing: false, siteName: "FlexDrive" } }),
    useSiteSettings: () => settingsStore, useGlobalStore: () => globalStore,
    definePageMeta() {}, defineProps: () => props,
    useHead: (input) => scope.run(() => headApi.useHead(input, { head })),
    useSeoMeta: (input) => scope.run(() => headApi.useSeoMeta(input, { head })),
    watch: (...args) => { const stop = vue.watch(...args); disposers.push(stop); return stop; },
    onMounted() {}, onBeforeUnmount() {}, onUnmounted() {},
    createError: (data) => Object.assign(new Error(data.statusMessage), data),
  };
  const policy = execute("app/composables/useIndexingPolicy.ts", globals, { "~/utils/seoIndexing": indexing });
  const mocks = {
    pinia: { storeToRefs: (store) => store },
    "swiper/css": {}, "swiper/vue": {},
    "~/composables/useIndexingPolicy": policy,
    "~/utils/routePaths": paths, "~/utils/cmsCollectionSeo": collection,
    "~/utils/structuredData": structured, "~/utils/publicPageError": publicErrors, "~/utils/productSchemaImage": schemaImages,
    "@vueuse/core": { useMediaQuery: () => vue.ref(false), watchDebounced() {} },
    "~/utils/pageScrollCoordinator": { markPagePending() {}, markPageReady() {} },
  };
  t.after(() => disposers.forEach((stop) => stop()));
  t.after(() => scope.stop());
  return { head, route, globals, mocks, settingsStore };
}

async function schemas(head) {
  const { headTags } = await renderSSRHead(head);
  const scripts = [...headTags.matchAll(/<script\b([^>]*type="application\/ld\+json"[^>]*)>(.*?)<\/script>/gs)];
  const data = scripts.map((match) => {
    assert.doesNotMatch(match[1], /\bchildren=/);
    assert.ok(match[2].trim(), "JSON-LD must have a nonempty script body");
    return JSON.parse(match[2]);
  });
  return { headTags, data };
}

async function productContext(t, overrides = {}, client = false) {
  const c = context(t, "/catalog/part-fd-02-0001", { client });
  const product = vue.reactive({
    id: 1, name: "სარკის ხუფი", sku: "FD-02-0001", price: "120.50",
    price_available: true, in_stock: false, stock_qty: 0, specs: [], images: [],
    category: { id: 2, name: "სარკეები", slug: "sarkeebi" },
    seo: { title: "სარკის ხუფი | FlexDrive", description: "Subaru Forester 2012–2018", image: "/real-product.jpg", canonical: "/catalog/part-fd-02-0001", noindex: false },
    ...overrides,
  });
  c.globals.useCartStore = () => ({ items: [] });
  c.globals.useEcommerceAnalytics = () => ({ trackAddToCart() {}, trackViewItem() {} });
  c.mocks["~/stores/useBuyNowStore"] = { useBuyNowStore: () => ({}) };
  c.mocks["~/composables/catalog/useCatalogPlaceholderMedia"] = execute("app/composables/catalog/useCatalogPlaceholderMedia.ts");
  c.mocks["~/composables/helpers"] = execute("app/composables/helpers.ts");
  c.mocks["~/composables/commerce/errorUtils"] = {};
  c.mocks["~/composables/catalog/useCatalogApi"] = { useCatalogApi: () => ({
    getCatalogProduct: async () => ({ data: vue.ref(product), error: vue.ref(null) }),
  }) };
  await setup("app/pages/catalog/[slug].vue", c.globals, c.mocks, "", "const retryLoad =");
  return { ...c, product };
}

test("product and breadcrumb JSON-LD survive actual source rendering with exact offer values", async (t) => {
  const c = await productContext(t);
  const rendered = await schemas(c.head);
  assert.equal(rendered.data.length, 2);
  const product = rendered.data.find((item) => item["@type"] === "Product");
  assert.equal(product.sku, "FD-02-0001");
  assert.equal(product.offers.price, "120.50");
  assert.equal(product.offers.priceCurrency, "GEL");
  assert.equal(product.offers.availability, "https://schema.org/OutOfStock");
  assert.equal(product.url, "https://flexdrive.ge/catalog/part-fd-02-0001");
  const breadcrumb = rendered.data.find((item) => item["@type"] === "BreadcrumbList");
  assert.equal(breadcrumb.itemListElement.at(-1).item, product.url);
  assert.match(rendered.headTags, /name="robots" content="noindex, nofollow"/);

});

test("client head updates price and stock without duplicate structured data", async (t) => {
  const c = await productContext(t, {}, true);
  assert.equal((await schemas(c.head)).data.length, 2);
  c.product.price = "150.00";
  c.product.in_stock = true;
  await vue.nextTick();
  const updated = await schemas(c.head);
  assert.equal(updated.data.length, 2);
  const offer = updated.data.find((item) => item["@type"] === "Product").offers;
  assert.equal(offer.price, "150.00");
  assert.equal(offer.availability, "https://schema.org/InStock");
});

test("unknown-price products do not acquire a fabricated offer", async (t) => {
  const c = await productContext(t, { price_available: false });
  const { data } = await schemas(c.head);
  assert.equal("offers" in data.find((item) => item["@type"] === "Product"), false);
});

test("catalog category emits a parseable breadcrumb from its actual source", async (t) => {
  const c = context(t, "/catalog/category/lights");
  c.mocks["~/composables/catalog/useCatalogSearchAnalytics"] = { useCatalogSearchAnalytics: () => ({ captureSearch: () => ({}), recordSearchResults() {} }) };
  c.mocks["~/composables/catalog/useCatalogApi"] = { useCatalogApi: () => ({
    getCatalogProducts: async () => ({ data: vue.ref({ count: 1, results: [], total_pages: 1, page_size: 15, facets: {} }), error: vue.ref(null) }),
    getCatalogCategories: async () => ({ data: vue.ref([{ id: 1, slug: "lights", name: "ფარები", seo: { title: "ფარები", noindex: false } }]), error: vue.ref(null) }),
    getVehicleMakes: async () => [],
    getCatalogCategory: async () => ({ data: vue.ref({ id: 1, slug: "lights", name: "ფარები", product_count: 1, seo: { title: "ფარები", noindex: false } }), error: vue.ref(null) }),
  }) };
  await setup("app/components/SmartComponents/ProductCatalog/ProductCatalog.vue", c.globals, c.mocks);
  const { data } = await schemas(c.head);
  assert.equal(data.length, 1);
  assert.equal(data[0]["@type"], "BreadcrumbList");
  assert.equal(data[0].itemListElement.at(-1).name, "ფარები");
  assert.equal(data[0].itemListElement.at(-1).item, "https://flexdrive.ge/catalog/category/lights");
});

test("blog listing emits its own paginated breadcrumb", async (t) => {
  const c = context(t, "/blogs", { query: { page: "2" } });
  c.mocks["~/composables/blog/useBlogApi"] = { useBlogApi: () => ({
    fetchBlogPosts: async () => ({ count: 10, results: [], total_pages: 2, page_size: 9, facets: {} }),
  }) };
  await setup("app/components/SmartComponents/BlogList/BlogList.vue", c.globals, c.mocks);
  const { data } = await schemas(c.head);
  assert.equal(data.length, 1);
  assert.equal(data[0]["@type"], "BreadcrumbList");
  assert.equal(data[0].itemListElement.at(-1).item, "https://flexdrive.ge/blogs?page=2");
});

test("article and breadcrumb JSON-LD preserve Georgian text, dates and author", async (t) => {
  const c = context(t, "/blogs/1-example", { props: { data: {
    title: "როგორ შევარჩიოთ ფარი", updated_at: "2026-10-13T09:00:00Z",
    blog_meta: { excerpt: "ავტონაწილის შერჩევა", author_name: "FlexDrive", published_at: "2026-10-12T09:00:00Z" },
  } } });
  c.mocks["~/stores/useSiteSettings"] = { useSiteSettings: c.globals.useSiteSettings };
  c.mocks["~/composables/helpers"] = execute("app/composables/helpers.ts");
  await setup("app/components/SmartComponents/BlogInner/BlogInner.vue", c.globals, c.mocks);
  const { data } = await schemas(c.head);
  assert.equal(data.length, 2);
  const article = data.find((item) => item["@type"] === "Article");
  assert.equal(article.headline, "როგორ შევარჩიოთ ფარი");
  assert.equal(article.datePublished, "2026-10-12T09:00:00Z");
  assert.equal(article.dateModified, "2026-10-13T09:00:00Z");
  assert.equal(article.author.name, "FlexDrive");
  assert.equal(article.url, "https://flexdrive.ge/blogs/1-example");
});

test("article dates follow API modification dates and preserve publication independently", async (t) => {
  for (const dates of [
    { published_at: "2026-10-09T09:00:00Z", updated_at: "2026-10-13T10:00:00Z", modified: "2026-10-13T10:00:00Z" },
    { published_at: "2026-10-10T09:00:00Z", updated_at: null, modified: "2026-10-10T09:00:00Z" },
    { published_at: null, updated_at: null, modified: undefined },
  ]) {
    await t.test(JSON.stringify(dates), async (caseTest) => {
      const c = context(caseTest, "/blogs/1-example", { props: { data: {
        title: "Article", updated_at: dates.updated_at,
        blog_meta: { published_at: dates.published_at },
      } } });
      c.mocks["~/stores/useSiteSettings"] = { useSiteSettings: c.globals.useSiteSettings };
      c.mocks["~/composables/helpers"] = execute("app/composables/helpers.ts");
      await setup("app/components/SmartComponents/BlogInner/BlogInner.vue", c.globals, c.mocks);
      const { data } = await schemas(c.head);
      const article = data.find((item) => item["@type"] === "Article");
      assert.equal(article.datePublished, dates.published_at || undefined);
      assert.equal(article.dateModified, dates.modified);
    });
  }
});

test("organization data exists on home/contact and is removed on other routes", async (t) => {
  const c = context(t, "/", { client: true });
  c.globals.useMenu = () => ({ fetchMenu: async () => {} });
  c.globals.useFooter = () => ({ footer: vue.ref({ contact: { email: "support@example.test", city: "თბილისი" }, socials: [{ url: "https://example.test/flexdrive" }] }), fetchFooter: async () => {} });
  c.mocks["~/utils/businessRouting"] = execute("app/utils/businessRouting.ts");
  await setup("app/app.vue", c.globals, c.mocks);
  for (const path of ["/", "/contact"]) {
    c.route.path = path;
    await vue.nextTick();
    const { data } = await schemas(c.head);
    assert.equal(data.length, 1);
    assert.equal(data[0]["@type"], "Organization");
    assert.equal(data[0].name, "FlexDrive");
    assert.equal(data[0].url, "https://flexdrive.ge");
    assert.equal(data[0].contactPoint[0].email, "support@example.test");
  }
  c.route.path = "/catalog";
  await vue.nextTick();
  assert.equal((await schemas(c.head)).data.length, 0);
});

test("script-closing strings cannot escape JSON-LD and round-trip unchanged", async (t) => {
  const text = 'ქართული "ტექსტი" & </ScRiPt><script id="unexpected">alert(1)</script>';
  const c = await productContext(t, { seo: { title: text, description: text, canonical: "/catalog/part-fd-02-0001" } });
  const { data, headTags } = await schemas(c.head);
  const product = data.find((item) => item["@type"] === "Product");
  assert.equal(product.name, text);
  assert.equal(product.description, text);
  assert.doesNotMatch(headTags, /<script id="unexpected">/);
  assert.equal((headTags.match(/<script type="application\/ld\+json"/g) || []).length, 2);
});
