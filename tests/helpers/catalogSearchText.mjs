import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const vue = require("vue");
const ts = require("typescript");
const source = readFileSync(new URL("../../app/composables/catalog/useCatalogSearchText.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;

export function catalogSearchTextRuntime(useRoute, useState) {
  const states = new Map();
  useState ??= (key, init) => {
    if (!states.has(key)) states.set(key, vue.ref(init()));
    return states.get(key);
  };
  const exports = {};
  new Function("exports", "computed", "watch", "useRoute", "useState", output)(exports, vue.computed, vue.watch, useRoute, useState);
  return exports.useCatalogSearchText;
}
