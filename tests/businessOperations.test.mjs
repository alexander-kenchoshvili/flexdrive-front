import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const vue = require("vue");
const execute = (path, globals = {}, mocks = {}) => {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  return new Function("require", "exports", ...Object.keys(globals), `${outputText}\nreturn exports;`)(
    (name) => mocks[name] ?? require(name), {}, ...Object.values(globals),
  );
};
const reports = execute("app/utils/businessReport.ts");
const utils = execute("app/utils/businessOperations.ts", {}, { "./businessReport": reports });
const http = execute("app/utils/httpError.ts");
const context = () => {
  const calls = [], navigations = [];
  const user = vue.ref({ id: 7 }), customer = vue.ref({ id: 9 });
  let unmount;
  const module = execute("app/composables/useBusinessOperations.ts", {
    ref: vue.ref, shallowRef: vue.shallowRef,
    useBusinessAuth: () => ({ user }), useApiBaseUrl: () => "/api",
    navigateTo: async (target, options) => navigations.push({ target, options }),
    onBeforeUnmount: (callback) => { unmount = callback; },
    $fetch: { create(options) {
      assert.equal(options.credentials, "include");
      assert.equal(options.cache, "no-store");
      assert.equal(options.retry, 0);
      assert.equal(options.timeout, 20000);
      return (path, input) => new Promise((resolve, reject) => calls.push({ path, input, resolve, reject }));
    } },
  }, { "~/utils/httpError": http });
  return { ...module.useBusinessOperations(), calls, navigations, user, customer, unmount: () => unmount() };
};

test("operations defaults are independent, missing amounts remain unknown and dates use Tbilisi", () => {
  const first = utils.operationsQuery(); first.stock_page = 5;
  assert.equal(utils.operationsQuery().stock_page, 1);
  assert.equal(utils.operationsMoney(null), "—");
  assert.equal(utils.operationsDate(null), "—");
  assert.match(utils.operationsDate("2026-10-08T20:00:00Z"), /09\.10\.2026/);
  assert.match(utils.operationsMoney("10.00", "USD"), /USD/);
  assert.doesNotMatch(utils.operationsMoney("10.00", "USD"), /GEL/);
});

test("filter and pagination changes abort stale requests and snapshot mutable query objects", async () => {
  const c = context(), query = utils.operationsQuery();
  const first = c.load(query);
  query.returns = "received"; query.returns_page = 2;
  assert.equal(c.calls[0].input.query.returns, "awaiting");
  const second = c.load(query);
  assert.equal(c.calls[0].input.signal.aborted, true);
  assert.equal(c.calls[1].path, "/business/operations/");
  assert.equal(c.calls[1].input.query.returns_page, 2);
  c.calls[1].resolve({ stock: { summary: { units: 2 } } }); await second;
  c.calls[0].resolve({ stock: { summary: { units: 999 } } }); await first;
  assert.equal(c.report.value.stock.summary.units, 2);
  assert.equal(c.loading.value, false);
});

test("failed refresh clears old operational values and never substitutes zeros", async () => {
  const c = context();
  const initial = c.load(utils.operationsQuery());
  c.calls[0].resolve({ stock: { summary: { units: 5 } } }); await initial;
  const refresh = c.load(utils.operationsQuery());
  assert.equal(c.report.value, null);
  c.calls[1].reject({ statusCode: 503 }); await refresh;
  assert.equal(c.report.value, null);
  assert.match(c.errorMessage.value, /ხელახლა/);
  assert.equal(c.loading.value, false);
});

test("expired or revoked operations access only clears business login and returns to operations", async () => {
  for (const status of [401, 403]) {
    const c = context(), pending = c.load(utils.operationsQuery());
    c.calls[0].reject({ statusCode: status }); await pending;
    assert.equal(c.report.value, null);
    assert.equal(c.user.value, null);
    assert.equal(c.customer.value.id, 9);
    assert.equal(c.navigations[0].target.path, "/business/login");
    assert.equal(c.navigations[0].target.query.next, "/business/operations");
    assert.equal(c.navigations[0].target.query.reason, status === 403 ? "denied" : undefined);
  }
});

test("leaving operations aborts pending requests and prevents private data from reappearing", async () => {
  const c = context(), pending = c.load(utils.operationsQuery());
  c.unmount();
  assert.equal(c.calls[0].input.signal.aborted, true);
  c.calls[0].resolve({ payments: { items: [{ id: 1 }] } }); await pending;
  assert.equal(c.report.value, null);
});
