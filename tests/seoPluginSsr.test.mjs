import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
process.env.NODE_ENV = "production";
const require = createRequire(import.meta.url), ts = require("typescript"), vue = require("vue"), pinia = require("pinia");
const execute = (path, globals = {}, mocks = {}) => {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  return new Function("require", "exports", ...Object.keys(globals), `${output}\nreturn exports;`)((name) => mocks[name] ?? require(name), {}, ...Object.values(globals));
};
const format = execute("app/utils/seoTitle.ts");
function context() {
  const pending = [], heads = [], metas = [];
  const { useSiteSettings } = execute("app/stores/useSiteSettings.ts", {}, { "~/composables/apiFetch": {
    apiFetchRaw: () => new Promise((resolve) => pending.push(resolve)),
  } });
  const { useSeoDefaults } = execute("app/composables/useSeoDefaults.ts", {
    ...vue, useSiteSettings, useRoute: () => ({ path: "/catalog" }),
    useRuntimeConfig: () => ({ public: { siteUrl: "https://flexdrive.ge", siteName: "FlexDrive", defaultSeoTitle: "Catalog", defaultSeoDescription: "Parts", defaultSeoImage: "/logo.png" } }),
    useHead: (value) => heads.push(value), useSeoMeta: (value) => metas.push(value),
  }, { "~/utils/seoTitle": format, "~/composables/useIndexingPolicy": { useIndexingPolicy: () => ({ robots: vue.ref("index, follow") }) } });
  const plugin = execute("app/plugins/seo-defaults.ts", { defineNuxtPlugin: (value) => value, useSiteSettings, useSeoDefaults }).default;
  return { pending, heads, metas, plugin, useSiteSettings };
}
test("SEO retains its request store when active Pinia disappears during the awaited API read", async () => {
  const c = context(), instance = pinia.createPinia(); pinia.setActivePinia(instance);
  const run = c.plugin({ $pinia: instance });
  assert.equal(c.pending.length, 1);
  pinia.setActivePinia(undefined);
  c.pending[0]({ site_name: "Request A", default_seo_title: "A title", default_seo_image: "/a.png" });
  await assert.doesNotReject(run);
  assert.equal(c.metas[0].ogSiteName(), "Request A");
  assert.equal(c.metas[0].ogImage(), "https://flexdrive.ge/a.png");
  assert.equal(c.heads[0]().link[0].href, "https://flexdrive.ge/catalog");
});
test("overlapping SSR requests keep distinct metadata and never resolve the other request's store", async () => {
  const c = context(), a = pinia.createPinia(), b = pinia.createPinia();
  pinia.setActivePinia(b); const first = c.plugin({ $pinia: a });
  pinia.setActivePinia(a); const second = c.plugin({ $pinia: b });
  assert.equal(c.pending.length, 2);
  pinia.setActivePinia(undefined); c.pending[1]({ site_name: "B", default_seo_image: "/b.png" }); await assert.doesNotReject(second);
  pinia.setActivePinia(b); c.pending[0]({ site_name: "A", default_seo_image: "/a.png" }); await assert.doesNotReject(first);
  assert.deepEqual(c.metas.map((meta) => meta.ogSiteName()), ["B", "A"]);
  assert.equal(c.useSiteSettings(a).settings.site_name, "A");
  assert.equal(c.useSiteSettings(b).settings.site_name, "B");
  pinia.setActivePinia(undefined);
});
