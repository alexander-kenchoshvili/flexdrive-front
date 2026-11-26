import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ts = require("typescript");

function execute(path, globals = {}, mocks = {}) {
  const source = readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return new Function("require", "exports", ...Object.keys(globals), `${code}\nreturn exports;`)(
    (name) => mocks[name] ?? require(name), {}, ...Object.values(globals),
  );
}

export const socialImages = execute("app/utils/socialImage.ts");
export const socialImageRuntime = (globals) => execute("app/composables/useSocialImage.ts", globals, {
  "~/utils/socialImage": socialImages,
});
