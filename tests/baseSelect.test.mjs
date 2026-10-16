import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const vue = require("vue");
const ts = require("typescript");
const { parse, compileScript } = require("@vue/compiler-sfc");
const { renderToString } = require("vue/server-renderer");
const source = readFileSync(new URL("../app/components/common/BaseSelect.vue", import.meta.url), "utf8");
const { descriptor } = parse(source);

function execute(code, globals = {}) {
  const exports = {};
  const output = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  return new Function("require", "exports", ...Object.keys(globals), `${output}\nreturn exports;`)(require, exports, ...Object.values(globals));
}

function select(props) {
  const emitted = [];
  const globals = {
    ...vue, defineOptions() {}, useAttrs: () => ({}), useId: () => "test",
    defineProps: () => props,
    withDefaults: (values, defaults) => ({ ...Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, typeof value === "function" ? value() : value])), ...values }),
    defineEmits: () => (...args) => emitted.push(args),
  };
  const code = ts.transpileModule(descriptor.scriptSetup.content, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const state = new Function("require", "exports", ...Object.keys(globals), `${code}\nreturn { displayLabel, updateValue, searchQuery, filteredOptions, handleSearchKeydown };`)(require, {}, ...Object.values(globals));
  return { ...state, emitted };
}
const options = [{ label: "ფარები", value: "lights" }, { label: "სარკეები", value: "mirrors" }];

test("existing single selects retain scalar events and labels", () => {
  const control = select({ options, modelValue: "lights" });
  assert.equal(control.displayLabel.value, "ფარები");
  control.searchQuery.value = "ფ";
  control.updateValue("mirrors");
  assert.deepEqual(control.emitted, [["update:modelValue", "mirrors"]]);
  assert.equal(control.searchQuery.value, "");
});

test("multi selects show every selection and emit arrays without altering single-value consumers", () => {
  const control = select({ options, multiple: true, selectedValues: ["lights", "mirrors"], searchable: true });
  assert.equal(control.displayLabel.value, "ფარები, სარკეები");
  control.searchQuery.value = "სარკ";
  assert.deepEqual(control.filteredOptions.value, [options[1]]);
  control.updateValue(["mirrors"]);
  assert.deepEqual(control.emitted, [["update:selectedValues", ["mirrors"]]]);
  assert.equal(control.searchQuery.value, "სარკ");
});

test("typing spaces and Enter in the dropdown search cannot trigger listbox selection or form submission", () => {
  const control = select({ options, searchable: true });
  for (const key of [" ", "Enter", "ფ"]) {
    let stopped = false;
    let prevented = false;
    control.handleSearchKeydown({ key, stopPropagation() { stopped = true; }, preventDefault() { prevented = true; } });
    assert.equal(stopped, true);
    assert.equal(prevented, key === "Enter");
  }
});

test("real shared select renders accessible scalar and multi-value controls through Headless UI", async () => {
  const component = execute(compileScript(descriptor, { id: "select-test", inlineTemplate: true }).content, { ...vue }).default;
  for (const props of [{ modelValue: "lights" }, { multiple: true, selectedValues: ["lights", "mirrors"] }]) {
    const html = await renderToString(vue.createSSRApp({ render: () => vue.h(component, { ...props, options, label: "კატეგორიები" }) }));
    assert.match(html, /aria-haspopup="listbox"/);
    assert.match(html, /კატეგორიები/);
    assert.ok(html.includes(props.multiple ? "ფარები, სარკეები" : "ფარები"));
    assert.doesNotMatch(html, /\[object Object\]/);
  }
});
