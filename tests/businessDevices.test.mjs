import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
const require = createRequire(import.meta.url), ts = require("typescript"), vue = require("vue");
const { parse, compileScript } = require("@vue/compiler-sfc"), { renderToString } = require("@vue/server-renderer");
const execute = (source, globals = {}, mocks = {}) => {
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  return new Function("require", "exports", ...Object.keys(globals), `${outputText}\nreturn exports;`)((name) => mocks[name] ?? require(name), {}, ...Object.values(globals));
};
const source = (path) => readFileSync(new URL(`../app/${path}`, import.meta.url), "utf8");
const devices = execute(source("utils/businessDevices.ts"));
const reportUtils = execute(source("utils/businessReport.ts"));
const marketing = execute(source("utils/businessMarketing.ts"));
const http = execute(source("utils/httpError.ts"));
const period = { start: "2026-11-01", end: "2026-11-20" };
const render = async (data, { loading = false, error = "" } = {}) => {
  const { descriptor } = parse(source("components/business/BusinessDevices.vue"));
  const compiled = compileScript(descriptor, { id: "devices", inlineTemplate: true });
  const component = execute(compiled.content, { computed: vue.computed, onMounted: vue.onMounted, watch: vue.watch }, {
    "~/utils/businessDevices": devices, "~/utils/businessReport": reportUtils, "~/utils/businessMarketing": marketing,
    "~/composables/useBusinessDevices": { useBusinessDevices: () => ({ report: vue.ref(data), loading: vue.ref(loading), errorMessage: vue.ref(error), load() {} }) },
  }).default;
  return renderToString(vue.createSSRApp(component, { period }));
};
const data = () => ({ status: "ready", period, fetched_at: "2026-11-20T06:19:00Z", timezone: "Asia/Tbilisi", totals: { sessions: 100, purchases: 4 }, rows: [
  { category: "mobile", label: "მობილური", sessions: 75, purchases: 2, session_share: 75, purchase_share: 50 },
  { category: "desktop", label: "კომპიუტერი / ლეპტოპი", sessions: 25, purchases: 2, session_share: 25, purchase_share: 50 },
] });
test("actual device card renders separate visit and purchase shares, dates, Tbilisi time and coverage", async () => {
  const html = await render(data());
  for (const text of ["მობილური", "კომპიუტერი / ლეპტოპი", "75%", "25%", "50%", "10:19", "შესყიდვები Google-ში", "კონკრეტული შეკვეთის მოწყობილობას არ ადგენს", "ფინანსური შეკვეთების სრულ რაოდენობას შეიძლება არ ემთხვეოდეს"]) assert.ok(html.includes(text), text);
  assert.match(html, /overflow-x-auto/); assert.match(html, /scope="col"/);
});
test("no Google purchases show unknown shares and do not claim no real sales", async () => {
  const report = data(); report.totals.purchases = 0;
  report.rows.forEach((row) => { row.purchases = 0; row.purchase_share = null; });
  const html = await render(report);
  assert.match(html, /ეს რეალური შეკვეთების არქონას არ ნიშნავს/);
  assert.match(html, /—/); assert.doesNotMatch(html, /50%/);
  for (const value of [null, undefined, NaN]) assert.equal(devices.deviceShare(value), "—");
  assert.equal(devices.deviceShare(0), "0%");
});
test("failure, loading, missing config and stale data remain distinct", async () => {
  for (const report of [{ status: "unavailable", message: "დროებით მიუწვდომელია" }, { status: "not_configured" }]) {
    const html = await render(report); assert.doesNotMatch(html, /<table/); assert.doesNotMatch(html, /რეალური შეკვეთების არქონას/);
  }
  assert.match(await render(data(), { loading: true }), /იტვირთება/);
  assert.doesNotMatch(await render(data(), { error: "REPORT ERROR" }), /<table/);
  const stale = data(); stale.status = "stale"; stale.warnings = ["კონფიდენციალურობის ზღვარი"];
  const html = await render(stale); assert.match(html, /ძველი პასუხი/); assert.match(html, /კონფიდენციალურობის ზღვარი/); assert.match(html, /75%/);
});
const context = () => {
  const calls = [], navigations = [], user = vue.ref({ id: 1 }); let unmount;
  const module = execute(source("composables/useBusinessDevices.ts"), {
    ref: vue.ref, shallowRef: vue.shallowRef, useBusinessAuth: () => ({ user }), useApiBaseUrl: () => "/api", useRoute: () => ({ path: "/business/users" }),
    navigateTo: async (target) => navigations.push(target), onBeforeUnmount: (callback) => { unmount = callback; },
    $fetch: { create(options) { assert.equal(options.credentials, "include"); assert.equal(options.cache, "no-store"); assert.equal(options.retry, 0);
      return (path, input) => new Promise((resolve, reject) => calls.push({ path, input, resolve, reject })); } },
  }, { "~/utils/httpError": http });
  return { ...module.useBusinessDevices(), calls, navigations, user, unmount: () => unmount() };
};
test("period change and unmount abort requests and reject old private responses", async () => {
  const c = context(), input = { ...period }, first = c.load(input); input.start = "2026-10-01";
  const second = c.load(input); assert.equal(c.calls[0].input.query.start, period.start);
  assert.equal(c.calls[0].input.signal.aborted, true); assert.equal(c.calls[1].path, "/business/devices/");
  c.calls[1].resolve({ rows: ["new"] }); await second; c.calls[0].resolve({ rows: ["old"] }); await first;
  assert.deepEqual(c.report.value.rows, ["new"]);
  const third = c.load(period); c.unmount(); c.calls[2].resolve({ rows: ["late"] }); await third; assert.equal(c.report.value, null);
});
test("revoked device report access clears data and returns to business login", async () => {
  for (const statusCode of [401, 403]) {
    const c = context(), pending = c.load(period); c.calls[0].reject({ statusCode }); await pending;
    assert.equal(c.user.value, null); assert.equal(c.report.value, null); assert.equal(c.navigations[0].query.next, "/business/users");
  }
});
