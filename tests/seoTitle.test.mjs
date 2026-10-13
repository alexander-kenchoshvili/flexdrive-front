import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const vue = require("vue");
const { createHead, renderSSRHead } = await import(pathToFileURL(require.resolve("@unhead/vue/server")));
const headApi = await import(pathToFileURL(require.resolve("@unhead/vue")));
function execute(path, globals = {}, mocks = {}) {
  const code = ts.transpileModule(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return new Function("require", "exports", ...Object.keys(globals), `${code}\nreturn exports;`)(
    (name) => mocks[name] ?? require(name), {}, ...Object.values(globals),
  );
}
const titles = execute("app/utils/seoTitle.ts");

test("automatic and existing branded titles have one final site suffix", () => {
  for (const title of ["სარკე", "სარკე | FlexDrive", "სარკე | FlexDrive | FlexDrive", "სარკე — flexdrive"]) {
    assert.equal(titles.formatSeoTitle(title, "FlexDrive"), "სარკე | FlexDrive");
  }
});

test("manual branding at the beginning and site names with punctuation are preserved", () => {
  assert.equal(titles.formatSeoTitle("FlexDrive — ჩემი სათაური", "FlexDrive"), "FlexDrive — ჩემი სათაური");
  assert.equal(titles.formatSeoTitle("სარკე | Parts (+)", "Parts (+)"), "სარკე | Parts (+)");
  assert.equal(titles.formatSeoTitle("FlexDriveParts სარკე", "FlexDrive"), "FlexDriveParts სარკე | FlexDrive");
  assert.equal(titles.formatSeoTitle("", "FlexDrive"), "FlexDrive");
  assert.equal(titles.formatSeoTitle("სარკე", ""), "სარკე");
});

test("actual global title template renders automatic and manual product titles once", async () => {
  for (const title of ["Subaru Forester 2012–2018 — სარკის მარჯვენა ხუფი", "ჩემი სათაური | FlexDrive", "ჩემი სათაური | FlexDrive | FlexDrive"]) {
    const head = createHead({ disableDefaults: true });
    const defaults = execute("app/composables/useSeoDefaults.ts", {
      ...vue, useRoute: () => ({ path: "/catalog/part-fd-02-0001" }),
      useRuntimeConfig: () => ({ public: { siteUrl: "https://flexdrive.ge", siteName: "FlexDrive" } }),
      useSiteSettings: () => ({ settings: vue.ref({ site_name: "FlexDrive" }) }),
      useHead: (input) => headApi.useHead(input, { head }),
      useSeoMeta: (input) => headApi.useSeoMeta(input, { head }),
    }, {
      pinia: { storeToRefs: (store) => store },
      "~/utils/seoTitle": titles,
      "~/composables/useIndexingPolicy": { useIndexingPolicy: () => ({ robots: vue.ref("noindex, nofollow") }) },
    });
    defaults.useSeoDefaults();
    headApi.useSeoMeta({ title }, { head });
    const { headTags } = await renderSSRHead(head);
    assert.match(headTags, /name="robots" content="noindex, nofollow"/);
    const actual = headTags.match(/<title>(.*?)<\/title>/s)[1];
    assert.equal(actual, titles.formatSeoTitle(title, "FlexDrive"));
    assert.equal((actual.match(/FlexDrive/g) || []).length, 1);
  }
});
