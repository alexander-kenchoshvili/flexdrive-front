import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript"), vue = require("vue");
const { parse, compileTemplate } = require("@vue/compiler-sfc");
const execute = (path, globals = {}, mocks = {}) => {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  return new Function("require", "exports", ...Object.keys(globals), `${outputText}\nreturn exports;`)(
    (name) => mocks[name] ?? require(name), {}, ...Object.values(globals));
};
const utils = execute("app/utils/businessMarketing.ts"), http = execute("app/utils/httpError.ts");
const period = { start: "2026-10-01", end: "2026-10-09" };
const ready = { status: "ready", period, ads: { status: "ready", currency: "USD", summary: { spend: "50.00", impressions: 200, clicks: 10, website_purchases: "2.5" } }, instagram: { activity: { status: "ready", reach: 70 } } };
const context = () => {
  const calls = [], navigations = [], user = vue.ref({ id: 7 }), customer = vue.ref({ id: 9 });
  let unmount;
  const module = execute("app/composables/useBusinessMarketing.ts", {
    ref: vue.ref, shallowRef: vue.shallowRef, useBusinessAuth: () => ({ user }), useApiBaseUrl: () => "/api",
    navigateTo: async (target, options) => navigations.push({ target, options }), onBeforeUnmount: (callback) => { unmount = callback; },
    $fetch: { create(options) {
      assert.equal(options.credentials, "include"); assert.equal(options.cache, "no-store");
      assert.equal(options.retry, 0); assert.equal(options.timeout, 90000);
      return (path, input) => new Promise((resolve, reject) => calls.push({ path, input, resolve, reject }));
    } },
  }, { "~/utils/httpError": http });
  return { ...module.useBusinessMarketing(), calls, navigations, user, customer, unmount: () => unmount() };
};

test("missing sources stay unknown and currency is never replaced with GEL", () => {
  for (const status of ["unavailable", "range_limit"]) assert.equal(utils.metaHasData({ status }), false);
  for (const status of ["ready", "empty", "stale"]) assert.equal(utils.metaHasData({ status }), true);
  assert.equal(utils.marketingMoney(null, "USD"), "—");
  assert.equal(utils.marketingMoney("50.00"), "—");
  assert.equal(utils.marketingMoney("50.00", "USD"), new Intl.NumberFormat("ka-GE", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(50));
});

test("automatic analysis only describes observed counts and labels stale data", () => {
  const insight = utils.marketingInsight(ready);
  assert.match(insight, /200 ჩვენება და 10 დაწკაპუნება/);
  assert.match(insight, /70 ანგარიშამდე/);
  assert.doesNotMatch(insight, /მოგებ|გამოწვეულ|გაყიდვ/);
  assert.equal(utils.marketingInsight({ status: "not_configured" }), "");
  assert.match(utils.marketingInsight({ ...ready, status: "partial", ads: { ...ready.ads, status: "stale" } }), /ბოლო წარმატებული/);
  assert.match(utils.marketingInsight({ ...ready, status: "partial", instagram: { activity: { status: "stale", reach: 70 } } }), /Instagram-ის რიცხვები ბოლო წარმატებული/);
  assert.doesNotMatch(utils.marketingInsight({ ...ready, instagram: { activity: { status: "unavailable" } } }), /Instagram/);
  assert.match(utils.marketingInsight({ ...ready, ads: { status: "empty", currency: "USD", summary: { spend: "0.00", impressions: 0, clicks: 0 } } }), /აქტივობა არ არის/);
});

test("changing periods cancels earlier requests and preserves a query snapshot", async () => {
  const c = context(), input = { ...period }, first = c.load(input);
  input.start = "2026-09-01";
  assert.equal(c.calls[0].input.query.start, period.start);
  const second = c.load(input);
  assert.equal(c.calls[0].input.signal.aborted, true);
  assert.equal(c.calls[1].path, "/business/marketing/");
  c.calls[1].resolve(ready); await second;
  c.calls[0].resolve({ status: "outdated" }); await first;
  assert.equal(c.report.value, ready); assert.equal(c.loading.value, false);
});

test("server states are preserved and transport failures clear previous statistics", async () => {
  const c = context(), pending = c.load(period), unavailable = { status: "not_configured", message: "setup" };
  c.calls[0].resolve(unavailable); await pending;
  assert.equal(c.report.value, unavailable);
  const refresh = c.load(period); assert.equal(c.report.value, null);
  c.calls[1].reject({ statusCode: 503 }); await refresh;
  assert.equal(c.report.value, null); assert.match(c.errorMessage.value, /ხელახლა/);
});

test("revoked business access does not change the customer account", async () => {
  for (const status of [401, 403]) {
    const c = context(), pending = c.load(period);
    c.calls[0].reject({ statusCode: status }); await pending;
    assert.equal(c.user.value, null); assert.equal(c.customer.value.id, 9);
    assert.equal(c.navigations[0].target.path, "/business/login");
    assert.equal(c.navigations[0].target.query.next, "/business/marketing");
    assert.equal(c.navigations[0].target.query.reason, status === 403 ? "denied" : undefined);
    assert.equal(c.navigations[0].options.replace, true);
  }
});

test("unmount cancels requests and prevents a late response restoring private data", async () => {
  const c = context(), pending = c.load(period); c.unmount();
  assert.equal(c.calls[0].input.signal.aborted, true);
  c.calls[0].resolve(ready); await pending;
  assert.equal(c.report.value, null);
});

test("marketing and lazy chart templates compile using the actual Vue compiler", () => {
  for (const name of ["BusinessMarketing", "BusinessMarketingChart"]) {
    const source = readFileSync(new URL(`../app/components/business/${name}.vue`, import.meta.url), "utf8");
    const { descriptor } = parse(source);
    const result = compileTemplate({ source: descriptor.template.content, filename: `${name}.vue`, id: name, compilerOptions: { expressionPlugins: ["typescript"] } });
    assert.deepEqual(result.errors, []);
    assert.equal(descriptor.styles.length, 0);
  }
});
