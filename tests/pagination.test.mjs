import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = process.env.FLEXDRIVE_FRONTEND_ROOT || resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(resolve(root, "package.json"));
const vue = require("vue");
const { createRouter, createMemoryHistory, RouterLink } = require("vue-router");
const { renderToString } = require("vue/server-renderer");
const { parse, compileScript } = require("@vue/compiler-sfc");
const ts = require("typescript");
const source = (path) => readFileSync(resolve(root, path), "utf8");
const transpile = (code) => ts.transpileModule(code.replaceAll("import.meta.client", "false"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function execute(code, globals = {}, mocks = {}) {
  const exports = {};
  return new Function("require", "exports", ...Object.keys(globals), `${transpile(code)}\nreturn exports;`)(
    (name) => mocks[name] ?? (name.endsWith(".vue") ? { default: vue.defineComponent({ render: () => null }) } : require(name)),
    exports, ...Object.values(globals),
  );
}
function component(path, globals = {}, mocks = {}) {
  const { descriptor } = parse(source(path), { filename: path });
  return execute(compileScript(descriptor, { id: "pagination-test", inlineTemplate: true }).content, { ...vue, ...globals }, mocks).default;
}
const pagination = component("app/components/common/AppPagination.vue");
const indexing = execute(source("app/utils/seoIndexing.ts"));
const paths = execute(source("app/utils/routePaths.ts"), {}, { "~/utils/seoIndexing": indexing });
const seo = execute(source("app/utils/cmsCollectionSeo.ts"), {}, { "~/utils/seoIndexing": indexing, "~/utils/routePaths": paths });
const structured = execute(source("app/utils/structuredData.ts"));
const publicErrors = execute(source("app/utils/publicPageError.ts"), {}, { "~/utils/httpError": execute(source("app/utils/httpError.ts")) });
const rawLinks = (html) => [...html.matchAll(/<a\b([^>]+)>(.*?)<\/a>/gs)].map((match) => ({
  attrs: match[1], text: match[2], href: match[1].match(/\bhref="([^"]+)"/)?.[1].replaceAll("&amp;", "&"),
}));
const urlFor = (link) => new URL(link.href, "https://flexdrive.ge");
async function routerAt(path) {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: "/:pathMatch(.*)*", component: { render: () => null } }] });
  await router.push(path);
  return router;
}
async function renderPagination(props, location = "/catalog") {
  const router = await routerAt(location);
  const app = vue.createSSRApp({ render: () => vue.h(pagination, props) });
  app.use(router).component("NuxtLink", RouterLink);
  return renderToString(app);
}

test("SSR emits real adjacent and last-page links before JavaScript, including encoded query values", async () => {
  const html = await renderPagination({ currentPage: 1, totalPages: 20, variant: "catalog",
    pageTo: (page) => ({ path: "/catalog/category/lights", query: { q: "ფარი & ხუფი", ordering: "price_asc", page: String(page) } }),
  });
  const links = rawLinks(html);
  assert.match(html, /<nav[^>]+aria-label="გვერდების ნავიგაცია"/);
  assert.match(html, /aria-current="page"/);
  assert.doesNotMatch(html, /<button|client-only|rel="prev"/);
  for (const link of links) {
    const url = urlFor(link);
    assert.equal(url.pathname, "/catalog/category/lights");
    assert.equal(url.searchParams.get("q"), "ფარი & ხუფი");
    assert.equal(url.searchParams.get("ordering"), "price_asc");
    assert.ok(Number(url.searchParams.get("page")) >= 2);
  }
  assert.equal(urlFor(links.find((link) => /rel="next"/.test(link.attrs))).searchParams.get("page"), "2");
  assert.equal(urlFor(links.find((link) => link.text === "ბოლო")).searchParams.get("page"), "20");
});

test("first/last bounds and single-page lists produce no impossible or unnecessary links", async () => {
  const pageTo = (page) => ({ path: "/blogs", query: page > 1 ? { page: String(page) } : {} });
  const html = await renderPagination({ currentPage: 2, totalPages: 2, variant: "blog-list", pageTo }, "/blogs?page=2");
  const links = rawLinks(html);
  assert.ok(links.every((link) => link.href === "/blogs"));
  assert.match(html, /rel="prev"/);
  assert.doesNotMatch(html, /rel="next"|page=0|page=1|page=3/);
  assert.doesNotMatch(await renderPagination({ currentPage: 1, totalPages: 1, variant: "catalog", pageTo }), /<nav|<a/);
});

test("mobile and desktop share deterministic SSR markup with three/five numbered controls", async () => {
  const html = await renderPagination({ currentPage: 10, totalPages: 50, variant: "catalog", pageTo: (page) => `/catalog?page=${page}` });
  const listItems = [...html.matchAll(/<li\b([^>]*)>(.*?)<\/li>/gs)];
  const numbers = listItems.filter((item) => item[2].includes("catalog-paginate-number"));
  assert.equal(numbers.length, 5);
  assert.equal(numbers.filter((item) => !item[1].includes("pagination-desktop-only")).length, 3);
  assert.match(source("app/components/common/AppPagination.vue"), /@media \(max-width: 640px\)/);
});

async function renderListing(path, componentPath, kind) {
  const router = await routerAt(path);
  const calls = [];
  const catalogResponse = { count: 45, results: [], total_pages: 3, page_size: 15, facets: {} };
  const blogResponse = { count: 27, results: [], total_pages: 3, page_size: 9, facets: {} };
  const api = {
    getCatalogProducts: async (params) => { calls.push(params); return { data: vue.ref(catalogResponse), error: vue.ref(null) }; },
    getCatalogCategories: async () => ({ data: vue.ref([{ id: 1, slug: "lights", name: "ფარები" }]), error: vue.ref(null) }),
    getCatalogCategory: async () => ({ data: vue.ref({ id: 1, slug: "lights", name: "ფარები", product_count: 45 }), error: vue.ref(null) }),
    getVehicleMakes: async () => [], getVehicleModels: async () => [], getVehicleYears: async () => [], getVehicleEngines: async () => [],
    fetchBlogPosts: async (params) => { calls.push(params); return blogResponse; },
  };
  const current = vue.computed(() => router.currentRoute.value);
  const route = new Proxy({}, { get: (_, key) => current.value[key] });
  const listing = component(componentPath, {
    useRoute: () => route, useRouter: () => router, useRuntimeConfig: () => ({ public: { siteUrl: "https://flexdrive.ge" } }),
    useSiteSettings: () => ({ settings: vue.ref({}) }), useHead() {}, useSeoMeta() {},
  }, {
    "~/components/common/AppPagination.vue": { default: pagination },
    "@vueuse/core": { useMediaQuery: () => vue.ref(false), watchDebounced() {} },
    pinia: { storeToRefs: (store) => store },
    "~/composables/useIndexingPolicy": { useIndexingPolicy: () => ({ robots: vue.ref("noindex, nofollow") }) },
    "~/composables/catalog/useCatalogApi": { useCatalogApi: () => api },
    "~/composables/blog/useBlogApi": { useBlogApi: () => api },
    "~/composables/catalog/useCatalogSearchAnalytics": { useCatalogSearchAnalytics: () => ({ captureSearch: () => ({}), recordSearchResults() {} }) },
    "~/utils/pageScrollCoordinator": { markPagePending() {}, markPageReady() {} },
    "~/utils/publicPageError": publicErrors,
    "~/utils/routePaths": paths, "~/utils/cmsCollectionSeo": seo, "~/utils/structuredData": structured,
  });
  const app = vue.createSSRApp({ render: () => vue.h(listing) });
  app.use(router).component("NuxtLink", RouterLink);
  app.component("Icon", { render: () => null });
  const html = await renderToString(app);
  assert.equal(calls.length, 1, `${kind} SSR fetch count`);
  return { html, calls };
}

test("actual catalog SSR links retain category path, vehicle/search/price/stock filters and ordering", async () => {
  const query = { q: "ფარი", ordering: "price_desc", make: "subaru", model: "forester", year: "2018", engine: "2",
    brand: "tyg", side: "right", placement: "front", min_price: "10", max_price: "300", in_stock: "true", on_sale: "true", has_image: "true", page: "2" };
  const { html, calls } = await renderListing(`/catalog/category/lights?${new URLSearchParams(query)}`,
    "app/components/SmartComponents/ProductCatalog/ProductCatalog.vue", "catalog");
  assert.equal(calls[0].page, 2);
  assert.equal(calls[0].category, "lights");
  assert.equal(calls[0].has_image, undefined, "obsolete image filter cannot limit products");
  const links = rawLinks(html).filter((link) => link.attrs.includes("catalog-paginate"));
  assert.ok(links.length > 0, "pagination must be present in actual listing SSR");
  for (const link of links) {
    const url = urlFor(link);
    assert.equal(url.pathname, "/catalog/category/lights");
    for (const [key, value] of Object.entries(query)) if (key !== "page" && key !== "has_image") assert.equal(url.searchParams.get(key), value, key);
    assert.equal(url.searchParams.has("has_image"), false, "pagination drops the removed image filter");
  }
  assert.equal(urlFor(links.find((link) => /rel="prev"/.test(link.attrs))).searchParams.get("page"), null);
  assert.equal(urlFor(links.find((link) => /rel="next"/.test(link.attrs))).searchParams.get("page"), "3");
});

test("actual blog SSR links retain search, category and ordering while first page omits page=1", async () => {
  const { html, calls } = await renderListing("/blogs?category=maintenance&search=ზეთი&ordering=oldest&page=2",
    "app/components/SmartComponents/BlogList/BlogList.vue", "blog");
  assert.equal(calls[0].page, 2);
  const links = rawLinks(html).filter((link) => link.attrs.includes("blog-list-paginate"));
  assert.ok(links.length > 0);
  for (const link of links) {
    const url = urlFor(link);
    assert.equal(url.pathname, "/blogs");
    assert.equal(url.searchParams.get("category"), "maintenance");
    assert.equal(url.searchParams.get("search"), "ზეთი");
    assert.equal(url.searchParams.get("ordering"), "oldest");
  }
  assert.equal(urlFor(links.find((link) => /rel="prev"/.test(link.attrs))).searchParams.get("page"), null);
});

test("plain catalog and blog first pages link to their own second page", async () => {
  for (const [path, componentPath, variant] of [
    ["/catalog", "app/components/SmartComponents/ProductCatalog/ProductCatalog.vue", "catalog"],
    ["/blogs", "app/components/SmartComponents/BlogList/BlogList.vue", "blog-list"],
  ]) {
    const { html } = await renderListing(path, componentPath, variant);
    const next = rawLinks(html).find((link) => /rel="next"/.test(link.attrs));
    assert.equal(next.href, `${path}?page=2`);
  }
});

test("actual link clicks navigate once, preserve modifier clicks and support history back", async () => {
  const node = (type, text = "") => ({ type, text, props: {}, children: [], parent: null });
  const remove = (item) => {
    if (item.parent) item.parent.children.splice(item.parent.children.indexOf(item), 1);
    item.parent = null;
  };
  const renderer = vue.createRenderer({
    createElement: (tag) => node(tag), createText: (text) => node("text", text), createComment: (text) => node("comment", text),
    setText: (item, text) => { item.text = text; },
    setElementText: (item, text) => { item.children = []; item.text = text; },
    patchProp: (item, key, _old, value) => { item.props[key] = value; },
    insert: (item, parent, anchor = null) => {
      remove(item); item.parent = parent;
      parent.children.splice(anchor ? parent.children.indexOf(anchor) : parent.children.length, 0, item);
    },
    remove, parentNode: (item) => item.parent,
    nextSibling: (item) => item.parent?.children[item.parent.children.indexOf(item) + 1] ?? null,
  });
  const router = await routerAt("/catalog/category/lights?q=ფარი&ordering=price_asc");
  let notifications = 0;
  let transitions = 0;
  const stop = vue.watch(() => router.currentRoute.value.fullPath, () => { transitions++; });
  const app = renderer.createApp({ render: () => vue.h(pagination, {
    currentPage: Number(router.currentRoute.value.query.page || 1), totalPages: 5, variant: "catalog",
    pageTo: (page) => ({ path: router.currentRoute.value.path, query: { q: "ფარი", ordering: "price_asc", ...(page > 1 ? { page: String(page) } : {}) } }),
    onNavigate: () => { notifications++; },
  }) });
  app.use(router).component("NuxtLink", RouterLink);
  const container = node("root");
  app.mount(container);
  const anchors = (item) => [ ...(item.type === "a" ? [item] : []), ...item.children.flatMap(anchors) ];
  const next = () => anchors(container).find((item) => item.props.rel === "next");
  const event = (modifiers = {}) => ({ button: 0, defaultPrevented: false,
    currentTarget: { getAttribute: () => null }, preventDefault() { this.defaultPrevented = true; }, ...modifiers });
  try {
    await next().props.onClick(event());
    await vue.nextTick();
    assert.equal(router.currentRoute.value.query.page, "2");
    assert.equal(router.currentRoute.value.query.q, "ფარი");
    assert.equal(router.currentRoute.value.query.ordering, "price_asc");
    assert.equal(transitions, 1);
    assert.equal(notifications, 1);
    const modified = event({ ctrlKey: true });
    await next().props.onClick(modified);
    assert.equal(modified.defaultPrevented, false);
    assert.equal(router.currentRoute.value.query.page, "2");
    assert.equal(notifications, 1);
    router.back();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await vue.nextTick();
    assert.equal(router.currentRoute.value.query.page, undefined);
    assert.equal(transitions, 2);
  } finally {
    stop(); app.unmount();
  }
});

test("pagination navigation scroll notification applies only after successful ordinary clicks", async () => {
  const code = parse(source("app/components/common/AppPagination.vue")).descriptor.scriptSetup.content;
  const events = [];
  const handlers = execute(`${code}\nexports.handleNavigate = handleNavigate;`, {
    ...vue, defineProps: () => ({ currentPage: 1, totalPages: 3 }), defineEmits: () => (...args) => events.push(args),
  });
  for (const modifiers of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { defaultPrevented: true }]) {
    const event = { button: 0, defaultPrevented: false, ...modifiers };
    await handlers.handleNavigate(event, async () => undefined);
  }
  assert.deepEqual(events, []);
  await handlers.handleNavigate({ button: 0 }, async () => ({ type: "aborted" }));
  assert.deepEqual(events, []);
  let finish;
  const pending = handlers.handleNavigate({ button: 0 }, () => new Promise((resolve) => { finish = resolve; }));
  assert.deepEqual(events, []);
  finish();
  await pending;
  assert.deepEqual(events, [["navigate"]]);
});
