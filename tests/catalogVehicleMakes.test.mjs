import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { ref } = require("vue");
const ts = require("typescript");
const source = readFileSync(new URL("../app/composables/catalog/useCatalogVehicleMakes.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const makes = [{ id: 1, slug: "toyota", name: "Toyota" }];
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

function context(fetch) {
  let app, now = 1000;
  const exports = {};
  const useState = (key, init) => app.state[key] ??= ref(init());
  new Function("require", "exports", "useNuxtApp", "useState", "Date", output)(
    () => ({ apiFetchRaw: fetch }), exports, () => app, useState, { now: () => now },
  );
  return {
    app(state = {}) { app = { state }; return app; },
    use(target) { app = target; return exports.useCatalogVehicleMakes(); },
    advance(ms) { now += ms; },
  };
}

test("header and catalog share a pending make request and then reuse its result", async () => {
  const response = deferred();
  let calls = 0;
  const c = context(() => { calls++; return response.promise; });
  const app = c.app();
  const header = c.use(app), catalog = c.use(app);
  const first = header.getVehicleMakes(), second = catalog.getVehicleMakes();
  assert.equal(first, second);
  assert.equal(calls, 1);
  response.resolve(makes);
  assert.deepEqual(await first, makes);
  assert.deepEqual(await c.use(app).getVehicleMakes(), makes);
  assert.equal(calls, 1);
});

test("five-minute expiry refreshes the make list and a genuine empty result is cached", async () => {
  let calls = 0;
  const c = context(async () => { calls++; return calls === 1 ? [] : makes; });
  const api = c.use(c.app());
  assert.deepEqual(await api.getVehicleMakes(), []);
  c.advance(5 * 60 * 1000 - 1);
  assert.deepEqual(await api.getVehicleMakes(), []);
  assert.equal(calls, 1);
  c.advance(1);
  assert.deepEqual(await api.getVehicleMakes(), makes);
  assert.equal(calls, 2);
});

test("failed initial loads and failed expiry refreshes stay retryable", async () => {
  let fail = true, calls = 0;
  const c = context(async () => { calls++; if (fail) throw new Error("offline"); return makes; });
  const api = c.use(c.app());
  await assert.rejects(api.getVehicleMakes(), /offline/);
  fail = false;
  assert.deepEqual(await api.getVehicleMakes(), makes);
  c.advance(5 * 60 * 1000);
  fail = true;
  await assert.rejects(api.getVehicleMakes(), /offline/);
  fail = false;
  assert.deepEqual(await api.getVehicleMakes(), makes);
  assert.equal(calls, 4);
});

test("hydration uses serialized SSR data and separate Nuxt apps never share requests or data", async () => {
  const pending = [deferred(), deferred()];
  let calls = 0;
  const c = context(() => pending[calls++].promise);
  const firstApp = c.app(), secondApp = c.app();
  const first = c.use(firstApp).getVehicleMakes();
  const second = c.use(secondApp).getVehicleMakes();
  assert.notEqual(first, second);
  assert.equal(calls, 2);
  pending[0].resolve(makes);
  pending[1].resolve([]);
  await Promise.all([first, second]);
  assert.deepEqual(await c.use(secondApp).getVehicleMakes(), []);
  const hydrationState = JSON.parse(JSON.stringify(Object.fromEntries(
    Object.entries(firstApp.state).map(([key, value]) => [key, value.value]),
  )));
  const hydratedApp = c.app(Object.fromEntries(Object.entries(hydrationState).map(([key, value]) => [key, ref(value)])));
  assert.deepEqual(await c.use(hydratedApp).getVehicleMakes(), makes);
  assert.equal(calls, 2);
});
