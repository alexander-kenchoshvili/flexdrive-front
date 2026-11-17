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
const pages = execute(source("utils/businessPages.ts"));
const decisions = execute(source("utils/businessDecisions.ts"));
const reportUtils = execute(source("utils/businessReport.ts"));
const marketing = execute(source("utils/businessMarketing.ts"));
const http = execute(source("utils/httpError.ts"));
const period = { start: "2026-11-01", end: "2026-11-17" };
const component = (name, globals = {}) => {
  const { descriptor } = parse(source(`components/business/${name}.vue`));
  const compiled = compileScript(descriptor, { id: name, inlineTemplate: true });
  return execute(compiled.content, { ref: vue.ref, computed: vue.computed, onMounted: vue.onMounted, watch: vue.watch, ...globals }, {
    "~/utils/businessPages": pages, "~/utils/businessDecisions": decisions,
    "~/utils/businessReport": reportUtils, "~/utils/businessMarketing": marketing,
  }).default;
};
test("active time is readable, handles rounding boundaries and never invents unknown duration", () => {
  assert.equal(pages.activeTime(25.1), "25 წმ");
  assert.equal(pages.activeTime(59.9), "1 წთ 0 წმ");
  assert.equal(pages.activeTime(0), "0 წმ");
  for (const value of [undefined, null, NaN, -1]) assert.equal(pages.activeTime(value), "—");
});
test("funnel renders unknown as a dash and exposes both routes without claiming zero", async () => {
  const html = await renderToString(vue.createSSRApp(component("BusinessFunnel"), { funnel: { status: "ready", steps: [
    { event: "view_item", label: "პროდუქტი ნახა", users: 6, lost: null },
    { event: "purchase", label: "იყიდა", users: null, lost: null },
  ] } }));
  assert.match(html, /ახლავე ყიდვით/); assert.match(html, /კალათით/);
  assert.match(html, /Google-მა ამ ეტაპის რაოდენობა არ დააბრუნა/); assert.match(html, /—/);
  assert.doesNotMatch(html, /არ გადასულა: 6/);
});
test("Meta distinguishes available pixel status from unverified server delivery", async () => {
  const html = await renderToString(vue.createSSRApp(component("BusinessMetaTechnical"), { report: {
    pixel: { status: "ready", name: "FlexDrive Web Pixel", id: "1020718363721235", fetched_at: "2026-11-17T10:00:00Z" },
    technical: { capi_configured: true },
  } }));
  assert.match(html, /eventsmanager.facebook.com/); assert.match(html, /FlexDrive Web Pixel/);
  assert.match(html, /პარამეტრების არსებობა კონკრეტული შეძენის მიღების მტკიცებულება არ არის/);
});
test("page results render active time, stale warning and original timestamp", async () => {
  const data = { status: "stale", fetched_at: "2026-11-17T10:00:00Z", row_count: 24, rows: [{ path: "/catalog/test-part", views: 3, users: 2, average_active_seconds: 25.1 }] };
  const html = await renderToString(vue.createSSRApp(component("BusinessPagePerformance", {
    useBusinessPages: () => ({ report: vue.ref(data), loading: vue.ref(false), errorMessage: vue.ref(""), load() {} }),
  }), { period }));
  assert.match(html, /25 წმ/); assert.match(html, /ძველი პასუხი/); assert.match(html, /24/);
  assert.match(html, /პროდუქტის გვერდი/); assert.match(html, /სრულ/);
});
const context = () => {
  const calls = [], navigations = [], user = vue.ref({ id: 1 }); let unmount;
  const module = execute(source("composables/useBusinessPages.ts"), {
    ref: vue.ref, shallowRef: vue.shallowRef, useBusinessAuth: () => ({ user }), useApiBaseUrl: () => "/api", useRoute: () => ({ path: "/business/users" }),
    navigateTo: async (target) => navigations.push(target), onBeforeUnmount: (callback) => { unmount = callback; },
    $fetch: { create(options) { assert.equal(options.credentials, "include"); assert.equal(options.cache, "no-store"); assert.equal(options.retry, 0);
      return (path, input) => new Promise((resolve, reject) => calls.push({ path, input, resolve, reject })); } },
  }, { "~/utils/httpError": http });
  return { ...module.useBusinessPages(), calls, navigations, user, unmount: () => unmount() };
};
test("page period changes abort old requests and do not restore old private data", async () => {
  const c = context(), input = { ...period }, first = c.load(input); input.start = "2026-10-01";
  const second = c.load(input); assert.equal(c.calls[0].input.query.start, period.start);
  assert.equal(c.calls[0].input.signal.aborted, true); assert.equal(c.calls[1].path, "/business/pages/");
  c.calls[1].resolve({ rows: ["new"] }); await second; c.calls[0].resolve({ rows: ["old"] }); await first;
  assert.deepEqual(c.report.value.rows, ["new"]);
  const third = c.load(period); c.unmount(); c.calls[2].resolve({ rows: ["late"] }); await third; assert.equal(c.report.value, null);
});
test("revoked page access clears private data and returns to business login", async () => {
  for (const statusCode of [401, 403]) {
    const c = context(), pending = c.load(period); c.calls[0].reject({ statusCode }); await pending;
    assert.equal(c.user.value, null); assert.equal(c.report.value, null);
    assert.equal(c.navigations[0].query.next, "/business/users");
  }
});
