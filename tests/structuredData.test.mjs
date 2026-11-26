import assert from "node:assert/strict";
import { socialImageRuntime, socialImages } from "./helpers/socialImage.mjs";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import { catalogSearchTextRuntime } from "./helpers/catalogSearchText.mjs";

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
    "~/composables/catalog/useVehicleInterestTracking": { useVehicleInterestTracking: () => ({ capture() {} }) },
    "~/composables/useSocialImage": socialImageRuntime(globals),
    "~/composables/catalog/useCatalogSearchText": { useCatalogSearchText: catalogSearchTextRuntime(() => route) },
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

async function productContext(t, overrides = {}, client = false, withDefaults = false) {
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
  // These browser-only warmups are loaded from their real modules; lifecycle
  // hooks stay inert in this standalone SSR harness (no DOM/image requests).
  const media = execute("app/composables/media/useCloudinaryImage.ts");
  const preloadMocks = { "../media/useCloudinaryImage": media, vue: { ...vue, onMounted() {}, onBeforeUnmount() {} } };
  c.mocks["~/composables/catalog/useProductGalleryPreload"] = execute("app/composables/catalog/useProductGalleryPreload.ts", {}, preloadMocks);
  c.mocks["~/composables/catalog/useProductZoomPreload"] = execute("app/composables/catalog/useProductZoomPreload.ts", {}, preloadMocks);
  if (withDefaults) addSocialDefaults(c);
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

// Render actual Nuxt SEO sources with Unhead: crawlers see these initial tags.
function addSocialDefaults(c) {
  c.mocks["~/utils/seoTitle"] = execute("app/utils/seoTitle.ts");
  execute("app/composables/useSeoDefaults.ts", c.globals, c.mocks).useSeoDefaults(c.settingsStore);
}
function assertSocialPreview(headTags, url, common = false) {
  const tags = [...headTags.matchAll(/<meta\b[^>]*>/g)].map(([tag]) => tag);
  for (const [attribute, key] of [["property", "og:image"], ["name", "twitter:image"]]) {
    const matches = tags.filter((tag) => tag.includes(`${attribute}="${key}"`));
    assert.equal(matches.length, 1, `${key} must have one authoritative image`);
    assert.ok(matches[0].includes(`content="${url}"`), matches[0]);
  }
  for (const [key, expected] of [["width", "1200"], ["height", "630"], ["type", "image/jpeg"]]) {
    const matches = tags.filter((tag) => tag.includes(`property="og:image:${key}"`));
    assert.equal(matches.length, common ? 1 : 0, `wrong inherited image ${key}`);
    if (common) assert.ok(matches[0].includes(`content="${expected}"`), matches[0]);
  }
}

test("home, catalog/search, categories, blog listing and ordinary pages share the bundled banner despite saved CMS images", async (t) => {
  for (const path of ["/", "/catalog", "/catalog/category/lights", "/blogs", "/contact", "/terms"]) {
    await t.test(path, async (subtest) => {
      const c = context(subtest, path, { query: path === "/catalog" ? { q: "Subaru" } : {} });
      c.settingsStore.settings.value.default_seo_image = "/old-site-image.jpg";
      c.globals.useRuntimeConfig = () => ({ public: {
        siteUrl: "https://flexdrive.ge", defaultSeoImage: "/favicon.ico",
      } });
      c.globals.useGlobalStore = () => ({
        pageSeo: vue.ref({ title: "CMS title", image: "/old-page-image.jpg" }),
        components: {}, isSingleView: false,
      });
      c.mocks["~/composables/useSocialImage"] = socialImageRuntime(c.globals);
      addSocialDefaults(c);
      await setup("app/pages/[...slug].vue", c.globals, c.mocks);
      const { headTags } = await schemas(c.head);
      assertSocialPreview(headTags, `https://flexdrive.ge${socialImages.DEFAULT_SOCIAL_IMAGE.path}`, true);
      assert.doesNotMatch(headTags, /old-site-image|old-page-image|favicon/);
    });
  }
});

test("category component cannot replace the common banner with a category photo", async (t) => {
  const c = context(t, "/catalog/category/lights");
  addSocialDefaults(c);
  const category = { id: 1, slug: "lights", name: "ფარები", product_count: 1, seo: { image: "/old-category.jpg" } };
  c.mocks["~/composables/catalog/useCatalogSearchAnalytics"] = { useCatalogSearchAnalytics: () => ({ captureSearch: () => ({}), recordSearchResults() {} }) };
  c.mocks["~/composables/catalog/useCatalogApi"] = { useCatalogApi: () => ({
    getCatalogProducts: async () => ({ data: vue.ref({ count: 1, results: [], total_pages: 1, page_size: 15, facets: {} }), error: vue.ref(null) }),
    getCatalogCategories: async () => ({ data: vue.ref([category]), error: vue.ref(null) }),
    getCatalogCategory: async () => ({ data: vue.ref(category), error: vue.ref(null) }),
    getVehicleMakes: async () => [],
  }) };
  await setup("app/components/SmartComponents/ProductCatalog/ProductCatalog.vue", c.globals, c.mocks);
  const { headTags } = await schemas(c.head);
  assertSocialPreview(headTags, `https://flexdrive.ge${socialImages.DEFAULT_SOCIAL_IMAGE.path}`, true);
  assert.doesNotMatch(headTags, /old-category/);
});

test("a real product SEO photo survives default metadata without inheriting the banner dimensions", async (t) => {
  const c = await productContext(t, {}, false, true);
  assertSocialPreview((await schemas(c.head)).headTags, "https://flexdrive.ge/real-product.jpg");
});

test("actual product primary/tablet-only photos stay dynamic and missing photos use the common banner", async (t) => {
  const photo = { id: 1, is_primary: true, image: { desktop: null, tablet: "/real-tablet.webp", mobile: null } };
  const withPhoto = await productContext(t, { seo: {}, images: [photo] });
  assertSocialPreview((await schemas(withPhoto.head)).headTags, "https://flexdrive.ge/real-tablet.webp");
  const withoutPhoto = await productContext(t, { seo: {}, images: [] });
  const { headTags, data } = await schemas(withoutPhoto.head);
  assertSocialPreview(headTags, `https://flexdrive.ge${socialImages.DEFAULT_SOCIAL_IMAGE.path}`, true);
  // A marketing banner must not become fabricated Product schema photography.
  assert.equal("image" in data.find((item) => item["@type"] === "Product"), false);
});

test("article photos remain dynamic, and reused CMS navigation restores the common banner and correct dimensions", async (t) => {
  const c = context(t, "/blogs/1-article", { client: true });
  const state = vue.shallowReactive({
    isSingleView: true,
    pageSeo: vue.ref({ title: "სტატია", image: "/article-cover.jpg" }),
    components: { article: { conf: { componentName: "BlogInner" } } },
  });
  c.globals.useGlobalStore = () => state;
  addSocialDefaults(c);
  await setup("app/pages/[...slug].vue", c.globals, c.mocks);
  assertSocialPreview((await schemas(c.head)).headTags, "https://flexdrive.ge/article-cover.jpg");

  c.route.path = "/contact";
  state.isSingleView = false;
  state.components = {};
  state.pageSeo.value = { title: "კონტაქტი", image: "/old-contact.jpg" };
  await vue.nextTick();
  assertSocialPreview((await schemas(c.head)).headTags, `https://flexdrive.ge${socialImages.DEFAULT_SOCIAL_IMAGE.path}`, true);

  c.route.path = "/blogs/2-next";
  state.isSingleView = true;
  state.components = { article: { conf: { componentName: "BlogInner" } } };
  state.pageSeo.value = { title: "სხვა სტატია", image: "https://media.example.test/second.webp" };
  await vue.nextTick();
  assertSocialPreview((await schemas(c.head)).headTags, "https://media.example.test/second.webp");
  state.pageSeo.value = { title: "უსურათო სტატია", image: null };
  await vue.nextTick();
  assertSocialPreview((await schemas(c.head)).headTags, `https://flexdrive.ge${socialImages.DEFAULT_SOCIAL_IMAGE.path}`, true);
});

test("each environment has an absolute common image URL without an image ENV or CMS setting", async (t) => {
  for (const siteUrl of ["https://flexdrive.ge", "https://localhost:3000/", "https://staging.example.test/"]) {
    const c = context(t, "/");
    c.globals.useRuntimeConfig = () => ({ public: { siteUrl } });
    const runtime = socialImageRuntime(c.globals);
    runtime.useSocialImage();
    assertSocialPreview((await schemas(c.head)).headTags, new URL(socialImages.DEFAULT_SOCIAL_IMAGE.path, siteUrl).href, true);
  }
});

test("initial article HTML keeps the API-selected photo while a non-blog single view uses the common banner", async (t) => {
  for (const componentName of ["BlogInner", "OtherInner"]) {
    const c = context(t, "/blogs/1-article");
    c.globals.useGlobalStore = () => ({
      isSingleView: true, pageSeo: vue.ref({ title: "სტატია", image: "/api-article-photo.webp" }),
      components: { item: { conf: { componentName } } },
    });
    addSocialDefaults(c);
    await setup("app/pages/[...slug].vue", c.globals, c.mocks);
    const article = componentName === "BlogInner";
    assertSocialPreview((await schemas(c.head)).headTags,
      article ? "https://flexdrive.ge/api-article-photo.webp" : `https://flexdrive.ge${socialImages.DEFAULT_SOCIAL_IMAGE.path}`, !article);
  }
});
