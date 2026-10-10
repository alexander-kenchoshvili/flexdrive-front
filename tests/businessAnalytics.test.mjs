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
const utils = execute("app/utils/businessAnalytics.ts");
const http = execute("app/utils/httpError.ts");
const period = { start: "2026-10-01", end: "2026-10-09" };
const ready = {
  status: "ready", period, hostname: "flexdrive.ge", property_id: "538949234", refresh_seconds: 300,
  fetched_at: "2026-10-09T10:00:00Z", summary: { totalUsers: 7, sessions: 10, engagedSessions: 4, screenPageViews: 15 },
  sources: [{ source: "google / organic", sessions: 8, engaged_sessions: 3 }],
  search: { status: "ready", total: 8, no_results: 2, terms: [], row_count: 0 },
};
const context = () => {
  const calls = [], navigations = [], user = vue.ref({ id: 7 }), customer = vue.ref({ id: 9 });
  let unmount;
  const module = execute("app/composables/useBusinessAnalytics.ts", {
    ref: vue.ref, shallowRef: vue.shallowRef,
    useBusinessAuth: () => ({ user }), useApiBaseUrl: () => "/api",
    navigateTo: async (target, options) => navigations.push({ target, options }),
    onBeforeUnmount: (callback) => { unmount = callback; },
    $fetch: { create(options) {
      assert.equal(options.credentials, "include"); assert.equal(options.cache, "no-store");
      assert.equal(options.retry, 0); assert.equal(options.timeout, 40000);
      return (path, input) => new Promise((resolve, reject) => calls.push({ path, input, resolve, reject }));
    } },
  }, { "~/utils/httpError": http });
  return { ...module.useBusinessAnalytics(), calls, navigations, user, customer, unmount: () => unmount() };
};

test("unconfigured and unavailable reports never look like a successful empty period", () => {
  for (const status of ["not_configured", "unavailable"]) {
    assert.equal(utils.analyticsHasData({ status }), false);
    assert.equal(utils.analyticsInsight({ status }), "");
  }
  assert.equal(utils.analyticsHasData({ ...ready, status: "empty" }), true);
  assert.match(utils.analyticsInsight({ ...ready, status: "empty" }), /დროებითი დომენისა და დეველოპმენტის/);
});

test("analysis reports observed counts and unsuccessful views without inventing conversions", () => {
  const insight = utils.analyticsInsight(ready);
  assert.match(insight, /10 ვიზიტი და 7 მომხმარებელი/);
  assert.match(insight, /google \/ organic/);
  assert.match(insight, /25%/);
  assert.doesNotMatch(insight, /მოგებ|გაყიდვ|გამოწვეულ/);
  assert.doesNotMatch(utils.analyticsInsight({ ...ready, search: { status: "unavailable", total: null, no_results: null } }), /ძიების შედეგების გვერდი/);
  assert.doesNotMatch(utils.analyticsInsight({ ...ready, search: { ...ready.search, total: 0, no_results: 0 } }), /NaN|Infinity|%/);
});

test("old period responses cannot overwrite the current period and query values are snapshotted", async () => {
  const c = context(), input = { ...period };
  const first = c.load(input); input.start = "2026-09-01";
  assert.equal(c.calls[0].input.query.start, period.start);
  const second = c.load(input);
  assert.equal(c.calls[0].input.signal.aborted, true);
  assert.equal(c.calls[1].path, "/business/analytics/");
  c.calls[1].resolve(ready); await second;
  c.calls[0].resolve({ ...ready, summary: { sessions: 999 } }); await first;
  assert.equal(c.report.value.summary.sessions, 10);
  assert.equal(c.loading.value, false);
});

test("server connection states are preserved and transport errors clear prior values", async () => {
  const c = context(), pending = c.load(period);
  const unavailable = { status: "not_configured", message: "setup", fetched_at: null };
  c.calls[0].resolve(unavailable); await pending;
  assert.equal(c.report.value, unavailable);
  const refresh = c.load(period);
  assert.equal(c.report.value, null);
  c.calls[1].reject({ statusCode: 503 }); await refresh;
  assert.equal(c.report.value, null); assert.match(c.errorMessage.value, /ხელახლა/);
});

test("expired/revoked business access returns to users without changing the shopper account", async () => {
  for (const status of [401, 403]) {
    const c = context(), pending = c.load(period);
    c.calls[0].reject({ statusCode: status }); await pending;
    assert.equal(c.user.value, null); assert.equal(c.customer.value.id, 9);
    assert.equal(c.navigations[0].target.path, "/business/login");
    assert.equal(c.navigations[0].target.query.next, "/business/users");
    assert.equal(c.navigations[0].target.query.reason, status === 403 ? "denied" : undefined);
    assert.equal(c.navigations[0].options.replace, true);
  }
});

test("unmount aborts a pending request and does not restore private data on late completion", async () => {
  const c = context(), pending = c.load(period); c.unmount();
  assert.equal(c.calls[0].input.signal.aborted, true);
  c.calls[0].resolve(ready); await pending;
  assert.equal(c.report.value, null);
});

test("users template compiles all missing/empty/partial states with the actual Vue compiler", () => {
  const source = readFileSync(new URL("../app/components/business/BusinessUsers.vue", import.meta.url), "utf8");
  const { descriptor } = parse(source);
  const result = compileTemplate({ source: descriptor.template.content, filename: "BusinessUsers.vue", id: "business-users", compilerOptions: { expressionPlugins: ["typescript"] } });
  assert.deepEqual(result.errors, []);
  assert.ok(result.code.includes("report.message"));
  assert.ok(result.code.includes("hasData"));
  assert.ok(result.code.includes("report.search"));
});
