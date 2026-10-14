import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const pinia = require("pinia");
function execute(path, globals = {}, mocks = {}, client = false) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
    .replaceAll("import.meta.client", String(client)).replaceAll("import.meta.server", String(!client));
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return new Function("require", "exports", ...Object.keys(globals), `${code}\nreturn exports;`)(
    (name) => mocks[name] ?? require(name), {}, ...Object.values(globals),
  );
}
const indexing = execute("app/utils/seoIndexing.ts");
const paths = execute("app/utils/routePaths.ts", {}, { "~/utils/seoIndexing": indexing });
const http = execute("app/utils/httpError.ts");
function context(client = false) {
  pinia.setActivePinia(pinia.createPinia());
  const calls = [], redirects = [];
  const apiFetchRaw = async (url, options) => {
    calls.push({ url, options });
    if (options?.body?.single_id && options.body.slug !== "blogs") throw { statusCode: 404 };
    return { secondary: { page: { conf: { componentName: "BlogInner" }, data: { title: "Article" } } },
      seo: { title: "Article", canonical: "/blogs/108-real-article" },
      canonical_path: options?.body?.single_slug === "old-article" ? "/blogs/108-real-article" : null };
  };
  const mocks = {
    pinia, "~/composables/apiFetch": { apiFetchRaw }, "~/utils/httpError": http,
    "~/utils/seoIndexing": indexing, "~/utils/routePaths": paths,
    "./useMenu": { useMenu: () => ({ findMenuBySlug: () => null }) },
    "~/utils/pageScrollCoordinator": { markPagePending() {} },
    h3: { createError: (data) => Object.assign(new Error(data.statusMessage), data) },
  };
  const store = execute("app/stores/useGlobalStore.ts", {}, mocks).useGlobalStore();
  const middleware = execute("app/middleware/pageLoader.global.ts", {
    defineNuxtRouteMiddleware: (handler) => handler,
    useGlobalStore: () => store,
    navigateTo: (target, options) => { redirects.push({ target, options }); return { redirected: true }; },
  }, mocks, client).default;
  return { store, middleware, calls, redirects };
}
const route = (path, query = {}, meta = {}) => ({ path, fullPath: path, query, meta });

test("actual CMS store refuses invented nested paths without requesting a real parent page", async () => {
  for (const path of ["/about-us/invented", "/about-us/invented/deeper", "/blogs/0-invalid", "/blogs/108-real-article/extra", "/catalog/category/lights/extra"]) {
    const c = context();
    await assert.rejects(c.store.initPage(path), (error) => error.statusCode === 404);
    assert.equal(c.calls.length, 0);
    assert.equal(c.store.isComponentsLoad, false);
  }
});

test("root, ordinary CMS pages and real catalog category paths retain their existing API requests", async () => {
  for (const [path, slug] of [["/", "main"], ["/about-us", "about-us"], ["/blogs", "blogs"], ["/catalog", "catalog"], ["/catalog/category/lights", "catalog"]]) {
    const c = context();
    await c.store.initPage(path);
    assert.deepEqual(c.calls[0].options.body, { slug });
    assert.equal(c.store.isComponentsLoad, true);
  }
});

test("actual CMS store sends article IDs/slugs to the authoritative backend and propagates wrong-prefix 404", async () => {
  const c = context();
  await c.store.initPage("/blogs/108-real-article");
  assert.deepEqual(c.calls[0].options.body, { slug: "blogs", single_id: 108, single_slug: "real-article" });
  const originalError = console.error;
  console.error = () => {};
  try {
    await assert.rejects(c.store.initPage("/invented/108-real-article"), (error) => error.statusCode === 404);
  } finally { console.error = originalError; }
  assert.equal(c.store.isComponentsLoad, false);
  assert.deepEqual(c.store.components, {});
});

test("real route middleware returns 404 for invented nested paths on server and client", async () => {
  for (const client of [false, true]) {
    const c = context(client);
    await assert.rejects(c.middleware(route("/about-us/invented"), route("/")), (error) => error.statusCode === 404);
    assert.equal(c.calls.length, 0);
    assert.equal(c.redirects.length, 0);
  }
});

test("old article slug redirects permanently to the backend's real canonical path and retains query", async () => {
  for (const client of [false, true]) {
    const c = context(client);
    const query = { source: "shared" };
    await c.middleware(route("/blogs/108-old-article", query), route("/"));
    assert.deepEqual(c.redirects, [{ target: { path: "/blogs/108-real-article", query }, options: { redirectCode: 301, replace: true } }]);
  }
});

test("dedicated product/private routes keep skipCmsLoader behavior and do not call the CMS API", async () => {
  for (const path of ["/catalog/part-fd-01-0001", "/profile/orders/token", "/checkout", "/business/users"]) {
    const c = context();
    await c.middleware(route(path, {}, { skipCmsLoader: true }), route("/"));
    assert.equal(c.calls.length, 0);
    assert.equal(c.redirects.length, 0);
  }
});
