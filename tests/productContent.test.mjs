import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const root = process.env.FLEXDRIVE_FRONTEND_ROOT || resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(resolve(root, "package.json"));
const vue = require("vue");
const { createRouter, createMemoryHistory, RouterLink } = require("vue-router");
const { renderToString } = require("vue/server-renderer");
const { parse, compileScript } = require("@vue/compiler-sfc");
const ts = require("typescript");
const { createHead, renderSSRHead } = await import(pathToFileURL(require.resolve("@unhead/vue/server")));
const headApi = await import(pathToFileURL(require.resolve("@unhead/vue")));
const source = (path) => readFileSync(resolve(root, path), "utf8");
const stub = vue.defineComponent({ render: () => null });
function execute(code, globals = {}, mocks = {}) {
  const exports = {};
  const compiled = ts.transpileModule(code.replaceAll("import.meta.client", "false"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return new Function("require", "exports", ...Object.keys(globals), `${compiled}\nreturn exports;`)(
    (name) => {
      try { return mocks[name] ?? (name.endsWith(".vue") ? { default: stub } : name.endsWith(".css") ? {} : require(name)); }
      catch (error) { throw new Error(`Could not load ${name}: ${error.message}`, { cause: error }); }
    },
    exports, ...Object.values(globals),
  );
}
function component(path, globals = {}, mocks = {}) {
  return execute(compileScript(parse(source(path), { filename: path }).descriptor, {
    id: "product-content-test", inlineTemplate: true,
  }).content, { ...vue, ...globals }, mocks).default;
}
const helpers = execute(source("app/composables/helpers.ts"));
const structured = execute(source("app/utils/structuredData.ts"));
const publicErrors = execute(source("app/utils/publicPageError.ts"), {}, { "~/utils/httpError": execute(source("app/utils/httpError.ts")) });
const schemaImages = execute(source("app/utils/productSchemaImage.ts"));
const indexing = execute(source("app/utils/seoIndexing.ts"));
const paths = execute(source("app/utils/routePaths.ts"), {}, { "~/utils/seoIndexing": indexing });
const fitmentsComponent = component("app/components/catalog/ProductFitments.vue", {}, { "~/composables/helpers": helpers });
const fitment = (overrides = {}) => ({
  id: 1, make: { id: 1, name: "Subaru", slug: "subaru" }, model: { id: 1, name: "Forester", slug: "forester" },
  engine: null, year_from: 2012, year_to: 2018, notes: "", ...overrides,
});
const htmlFitments = (props) => renderToString(vue.createSSRApp({ render: () => vue.h(fitmentsComponent, props) }));

test("all real model/year/engine rows and public notes render in initial visible HTML without combining gaps", async () => {
  const html = await htmlFitments({ fitments: [
    fitment({ engine: { id: 1, name: "2.0 ბენზინი", slug: "20-petrol" }, notes: "მხოლოდ facelift ვერსია" }),
    fitment({ id: 2, year_from: 2021, year_to: 2024 }),
    fitment({ id: 3, model: { id: 2, name: "XV", slug: "xv" }, year_from: 2015, year_to: 2015 }),
  ] });
  assert.match(html, /მანქანასთან შესაბამისობა/);
  for (const expected of ["Subaru Forester", "2012–2018", "2021–2024", "2.0 ბენზინი", "მხოლოდ facelift ვერსია", "Subaru XV", "2015"]) assert.ok(html.includes(expected), expected);
  assert.doesNotMatch(html, /2012–2024|ყველა ძრავი|display:\s*none|hidden|<details/);
  assert.equal((html.match(/<li\b/g) || []).length, 3);
});

test("missing fitments omit the section and universal state never invents model/year compatibility", async () => {
  for (const props of [{}, { fitments: null }, { fitments: [] }]) assert.doesNotMatch(await htmlFitments(props), /<section|მანქანასთან შესაბამისობა/);
  const html = await htmlFitments({ universal: true, fitments: [fitment()] });
  assert.match(html, /უნივერსალური ნაწილი/);
  assert.doesNotMatch(html, /Forester|2012|ყველა მანქანა/);
});

test("fitment text is escaped and complete lists are not cut down to the first model", async () => {
  const entries = Array.from({ length: 31 }, (_, index) => fitment({ id: index + 1, notes: `ვარიანტი ${index + 1}` }));
  entries[0].notes = '<img src=x onerror="alert(1)"> & ქართული';
  const html = await htmlFitments({ fitments: entries });
  assert.equal((html.match(/<li\b/g) || []).length, 31);
  assert.ok(html.includes("ვარიანტი 31"));
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img/);
});

async function page(overrides = {}) {
  const head = createHead({ disableDefaults: true });
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: "/catalog/:slug", component: stub }, { path: "/:pathMatch(.*)*", component: stub },
  ] });
  await router.push("/catalog/mirror-fd-02-0001");
  const product = {
    id: 1, slug: "mirror-fd-02-0001", name: "სარკის ხუფი", sku: "FD-02-0001", manufacturer_part_number: "91059-SG000",
    short_description: "Subaru Forester", description: "მარჯვენა სარკის ხუფი", price: "120.50", old_price: null,
    price_available: true, purchasable: true, in_stock: true, stock_qty: 3, is_new: false, is_universal_fitment: false,
    category: { id: 2, name: "სარკეები", slug: "sarkeebi" }, brand: { id: 1, name: "TYG", slug: "tyg" },
    images: [], related_products: [], specs: [{ key: "OEM", value: "91059-SG000", sort_order: 0 }],
    fitments: [fitment()], seo: { title: "სარკის ხუფი", description: "Subaru Forester 2012–2018", noindex: false },
    ...overrides,
  };
  let requests = 0;
  const globals = {
    useRoute: () => router.currentRoute.value, useRuntimeConfig: () => ({ public: { siteUrl: "https://flexdrive.ge" } }),
    useGlobalStore: () => ({ setCurrentMenu() {} }), useSiteSettings: () => ({ settings: vue.ref({ site_name: "FlexDrive" }) }),
    useCartStore: () => ({ items: [], itemCount: 0, totalPrice: 0 }), useEcommerceAnalytics: () => ({ trackAddToCart() {}, trackViewItem() {} }),
    definePageMeta() {}, createError: (data) => Object.assign(new Error(data.statusMessage), data),
    useHead: (input) => headApi.useHead(input, { head }), useSeoMeta: (input) => headApi.useSeoMeta(input, { head }),
  };
  const mocks = {
    pinia: { storeToRefs: (store) => store }, "swiper/css": {}, "swiper/vue": { Swiper: stub, SwiperSlide: stub },
    "~/components/catalog/ProductFitments.vue": { default: fitmentsComponent },
    "~/utils/publicPageError": publicErrors, "~/utils/productSchemaImage": schemaImages,
    "~/composables/helpers": helpers, "~/utils/structuredData": structured, "~/utils/routePaths": paths,
    "~/composables/useIndexingPolicy": { useIndexingPolicy: () => ({ robots: vue.ref("noindex, nofollow") }) },
    "~/stores/useBuyNowStore": { useBuyNowStore: () => ({}) }, "~/composables/commerce/errorUtils": {},
    "~/composables/catalog/useCatalogPlaceholderMedia": execute(source("app/composables/catalog/useCatalogPlaceholderMedia.ts")),
    "~/composables/catalog/useCatalogApi": { useCatalogApi: () => ({ getCatalogProduct: async () => {
      requests++; return { data: vue.ref(product), error: vue.ref(null) };
    } }) },
  };
  const detail = component("app/pages/catalog/[slug].vue", globals, mocks);
  const app = vue.createSSRApp({ render: () => vue.h(detail) });
  app.use(router).component("NuxtLink", RouterLink);
  const html = await renderToString(app);
  const { headTags } = await renderSSRHead(head);
  const productSchema = [...headTags.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)]
    .map((match) => JSON.parse(match[1])).find((schema) => schema["@type"] === "Product");
  assert.equal(requests, 1);
  return { html, headTags, productSchema };
}

test("actual product default-description SSR omits the header OEM row and visibly contains fitments", async () => {
  const { html, headTags, productSchema } = await page();
  assert.doesNotMatch(html, /OEM \/ ნაწილის ნომერი:/);
  assert.doesNotMatch(html, /91059-SG000/);
  assert.match(html, /მანქანასთან შესაბამისობა/);
  assert.match(html, /Subaru Forester/);
  assert.match(html, /2012–2018/);
  assert.match(html, /მარჯვენა სარკის ხუფი/);
  assert.doesNotMatch(html, /<span[^>]*>\s*OEM\s*<\/span>/); // The specifications tab is still closed.
  assert.equal(productSchema.mpn, "91059-SG000");
  assert.equal(productSchema.sku, "FD-02-0001");
  assert.equal(productSchema.offers.price, "120.50");
  assert.equal(productSchema.offers.priceCurrency, "GEL");
  assert.equal(productSchema.offers.availability, "https://schema.org/InStock");
  assert.equal(productSchema.url, "https://flexdrive.ge/catalog/mirror-fd-02-0001");
  assert.match(headTags, /name="robots" content="noindex, nofollow"/);
});

test("missing OEM and fitments produce no invented number, compatibility section or metadata", async () => {
  const { html, productSchema } = await page({ manufacturer_part_number: "   ", fitments: [], specs: [] });
  assert.doesNotMatch(html, /OEM \/ ნაწილის ნომერი:|მანქანასთან შესაბამისობა/);
  assert.equal("mpn" in productSchema, false);
  assert.equal(productSchema.sku, "FD-02-0001");
});

test("part number stays out of the visible header and retains its safely serialized exact value in JSON-LD", async () => {
  const number = '00-A</script><img src=x onerror="alert(1)"> & ქართული';
  const { html, headTags, productSchema } = await page({ manufacturer_part_number: number, specs: [] });
  assert.doesNotMatch(html, /00-A|OEM \/ ნაწილის ნომერი:/);
  assert.doesNotMatch(html, /<img src=x/);
  assert.equal(productSchema.mpn, number);
  assert.doesNotMatch(headTags, /<img src=x/);
});
