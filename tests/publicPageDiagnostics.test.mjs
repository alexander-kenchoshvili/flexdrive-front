import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
const require = createRequire(import.meta.url), ts = require("typescript");
const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const execute = (path, globals = {}, mocks = {}) => {
  const output = ts.transpileModule(source(path), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  return new Function("require", "exports", ...Object.keys(globals), `${output}\nreturn exports;`)((name) => mocks[name] ?? require(name), {}, ...Object.values(globals));
};
const context = () => {
  let now = 120_000;
  const module = execute("server/utils/publicPageDiagnostics.ts", { Date: { now: () => now } });
  const lines = [];
  return { log: (error, event) => module.recordPublicPageFailure(error, event, (line) => lines.push(JSON.parse(line))), lines, tick: () => { now += 60_001; } };
};
const event = (path = "/catalog/", method = "GET") => ({ path, method, context: {} });
const failure = () => Object.assign(new Error("https://api.example.test/private?token=SECRET user@example.test"), {
  statusCode: 500, stack: "Error: SECRET\n at render (file:///workspace/.output/server/chunks/build/ProductCatalog-AB12.mjs:123:4)\n at request (https://private.test/?token=SECRET)",
});
test("public failures retain build location and causal status without private messages or query strings", () => {
  const c = context(), error = failure(); error.cause = Object.assign(new Error("private upstream body SECRET"), { name: "FetchError", statusCode: 503 });
  c.log(error, event("/catalog/private-slug?email=private@example.test"));
  assert.equal(c.lines[0].route, "product"); assert.equal(c.lines[0].errors[1].status, 503);
  assert.deepEqual(c.lines[0].errors[0].locations, ["chunks/build/ProductCatalog-AB12.mjs:123:4"]);
  assert.doesNotMatch(JSON.stringify(c.lines), /SECRET|@|token|private-slug|https:/);
});
test("private routes, API requests, writes and normal 4xx never log", () => {
  const c = context();
  for (const path of ["/business", "/profile/orders/secret", "/checkout/success/secret", "/api/catalog/products/", "/catalog/category/brakes", "/catalog/%73ecret"])
    c.log(failure(), event(path));
  c.log(failure(), event("/", "POST"));
  c.log({ statusCode: 404 }, event()); c.log({ statusCode: 429 }, event());
  assert.equal(c.lines.length, 0);
});
test("Nuxt and Nitro hooks share request deduplication and have a bounded rate", () => {
  const c = context(), request = event(); c.log(failure(), request); c.log(failure(), request);
  assert.equal(c.lines.length, 1);
  for (let i = 0; i < 30; i++) c.log(failure(), event("/"));
  assert.equal(c.lines.length, 20); c.tick(); c.log(failure(), event("/")); assert.equal(c.lines.length, 21);
});
test("cycles, invalid values, getters and logging failures cannot break responses", () => {
  const c = context(), error = failure(); error.cause = error; c.log(error, event());
  assert.equal(c.lines[0].errors.length, 1);
  for (const value of [undefined, null, "SECRET", { get message() { throw Error("SECRET"); } }]) assert.doesNotThrow(() => c.log(value, event()));
  const module = execute("server/utils/publicPageDiagnostics.ts");
  assert.doesNotThrow(() => module.recordPublicPageFailure(failure(), event(), () => { throw Error("log failed"); }));
});
test("real Nuxt and Nitro plugin callbacks register early and preserve errors", () => {
  const hooks = {}, calls = [], request = event(), error = failure();
  const mock = { recordPublicPageFailure: (...args) => calls.push(args) };
  const plugin = execute("app/plugins/public-page-diagnostics.server.ts", { defineNuxtPlugin: (value) => value, useRequestEvent: () => request }, { "~~/server/utils/publicPageDiagnostics": mock }).default;
  assert.equal(plugin.enforce, "pre"); plugin.setup({ hook: (name, callback) => { hooks[name] = callback; } }); hooks["app:error"](error);
  const nitro = execute("server/plugins/public-page-diagnostics.ts", { defineNitroPlugin: (value) => value }, { "../utils/publicPageDiagnostics": mock }).default;
  nitro({ hooks: { hook: (name, callback) => { hooks[name] = callback; } } }); hooks.error(error, { event: request });
  assert.equal(calls.length, 2); assert.strictEqual(calls[0][0], error); assert.strictEqual(calls[1][1], request);
});
