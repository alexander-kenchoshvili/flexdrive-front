import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const vue = require("vue");
const ts = require("typescript");
const { parse } = require("@vue/compiler-sfc");
const { descriptor } = parse(readFileSync(new URL("../app/components/SmartComponents/ProductCatalog/parts/ProductCard.vue", import.meta.url), "utf8"));
const output = ts.transpileModule(descriptor.scriptSetup.content, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;

function badges(t, supplied) {
  const props = vue.reactive(supplied);
  const scope = vue.effectScope();
  t.after(() => scope.stop());
  const globals = { ...vue, defineProps: () => props, withDefaults: (p) => p };
  return scope.run(() => new Function("require", "exports", ...Object.keys(globals), `${output}\nreturn { compatibilityBadge, variantBadge };`)(
    (name) => name.endsWith(".vue") ? {} : name.includes("useCatalogPlaceholderMedia") ? { useCatalogPlaceholderMedia: () => ({ cardPlaceholderImage: {} }) } : {},
    {}, ...Object.values(globals),
  ));
}

test("model/year match never claims full fitment, and supplier version mention is explicit", (t) => {
  const b = badges(t, { product: { price: 100, compatibility: { matched: true, match_type: "vehicle_year", notes: "", variant: { status: "mentioned", labels: ["GLI"] } } }, vehicleFilter: { make: "Volkswagen", model: "Jetta", year: "2017" } });
  assert.equal(b.compatibilityBadge.value, "მოდელი და წელი ემთხვევა");
  assert.equal(b.variantBadge.value, "მითითებულია: GLI");
  assert.ok(!b.variantBadge.value.includes("თავსებადია"));
});

test("unknown or different versions ask for checking, rather than declaring incompatibility", (t) => {
  const b = badges(t, { product: { price: 100, compatibility: { matched: true, match_type: "vehicle_year", notes: "", variant: { status: "unverified", labels: [] } } }, vehicleFilter: { make: "Volkswagen", model: "Jetta", year: "2017" } });
  assert.equal(b.variantBadge.value, "ვერსია გადასამოწმებელია");
});

test("ordinary vehicle and explicit engine filters retain their independent badges", (t) => {
  const b = badges(t, { product: { price: 100, compatibility: { matched: true, match_type: "engine", notes: "" } }, vehicleFilter: { make: "Honda", model: "Accord", year: "2003", engine: "V6" } });
  assert.equal(b.compatibilityBadge.value, "ძრავი ემთხვევა");
  assert.equal(b.variantBadge.value, "");
});
