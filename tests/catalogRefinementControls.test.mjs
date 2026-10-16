import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const vue = require("vue");
const ts = require("typescript");
const { parse } = require("@vue/compiler-sfc");

function controls(t, name, supplied = {}) {
  const { descriptor } = parse(readFileSync(new URL(`../app/components/SmartComponents/ProductCatalog/parts/${name}.vue`, import.meta.url), "utf8"));
  const output = ts.transpileModule(descriptor.scriptSetup.content.replaceAll("import.meta.client", "false"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const scope = vue.effectScope();
  t.after(() => scope.stop());
  const emitted = [];
  const globals = {
    ...vue,
    defineProps: () => supplied,
    withDefaults: (props, defaults) => ({ ...Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, typeof value === "function" ? value() : value])), ...props }),
    defineEmits: () => (...args) => emitted.push(args),
    onMounted() {}, onBeforeUnmount() {},
  };
  return scope.run(() => new Function("require", "exports", ...Object.keys(globals), `${output}\nreturn { brandOptions, placementOptions, sideOptions, brandModel, placementModel, sideModel };`)(
    (id) => id.endsWith(".vue") ? {} : id === "@vueuse/core" ? { useDebounceFn: (fn) => fn } : require(id),
    {}, ...Object.values(globals),
  ));
}

for (const name of ["CatalogFilters", "CatalogMobileFilterSheet"]) {
  test(`${name}: empty facet lists still offer an explicit All choice`, (t) => {
    const c = controls(t, name);
    assert.deepEqual(c.brandOptions.value, [{ label: "ყველა ბრენდი", value: "" }]);
    assert.deepEqual(c.placementOptions.value, [{ label: "ყველა მდებარეობა", value: "" }]);
    assert.deepEqual(c.sideOptions.value, [{ label: "ყველა მხარე", value: "" }]);
  });

  test(`${name}: zero-count selected options keep their labels and remain selectable`, (t) => {
    const c = controls(t, name, {
      selectedBrand: "tyc", selectedPlacement: "rear", selectedSide: "left",
      brands: [{ id: 46, slug: "tyc", name: "TYC", count: 0 }],
      placements: [{ value: "rear", label: "უკანა", count: 0 }],
      sides: [{ value: "left", label: "მარცხენა", count: 0 }],
    });
    assert.deepEqual(c.brandOptions.value[1], { label: "TYC (0)", value: "tyc" });
    assert.deepEqual(c.placementOptions.value[1], { label: "უკანა (0)", value: "rear" });
    assert.deepEqual(c.sideOptions.value[1], { label: "მარცხენა (0)", value: "left" });
    assert.equal(c.brandModel.value, "tyc");
    assert.equal(c.sideModel.value, "left");
    c.brandModel.value = "";
    c.sideModel.value = "";
  });

  test(`${name}: numeric brand URLs match the selected option instead of displaying an ID`, (t) => {
    const c = controls(t, name, { selectedBrand: "46", brands: [{ id: 46, slug: "tyc", name: "TYC", count: 0 }] });
    assert.equal(c.brandOptions.value[1].value, c.brandModel.value);
    assert.equal(c.brandOptions.value[1].label, "TYC (0)");
  });
}
