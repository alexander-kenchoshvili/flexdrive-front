import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url), ts = require("typescript"), vue = require("vue");
const { parse, compileTemplate } = require("@vue/compiler-sfc");
const execute = (path, globals = {}, mocks = {}) => {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  return new Function("require", "exports", ...Object.keys(globals), `${outputText}\nreturn exports;`)((name) => mocks[name] ?? require(name), {}, ...Object.values(globals));
};
const utils = execute("app/utils/businessSearchConsole.ts"), http = execute("app/utils/httpError.ts");
const period = { start: "2026-11-01", end: "2026-11-14" };
const context = () => {
  const calls = [], navigations = [], user = vue.ref({ id: 1 });
  let unmount;
  const module = execute("app/composables/useBusinessSearchConsole.ts", {
    shallowRef: vue.shallowRef, ref: vue.ref, useBusinessAuth: () => ({ user }), useRoute: () => ({ path: "/business/users" }), useApiBaseUrl: () => "/api",
    navigateTo: async (target, options) => navigations.push({ target, options }), onBeforeUnmount: (callback) => { unmount = callback; },
    $fetch: { create(options) {
      assert.equal(options.credentials, "include"); assert.equal(options.cache, "no-store"); assert.equal(options.retry, 0);
      return (path, input) => new Promise((resolve, reject) => calls.push({ path, input, resolve, reject }));
    } },
  }, { "~/utils/httpError": http });
  return { ...module.useBusinessSearchConsole(), calls, navigations, user, unmount: () => unmount() };
};

test("missing connection and unavailable values never look like zero impressions", () => {
  for (const status of ["unavailable", "not_configured", "range_limit"]) {
    assert.equal(utils.searchConsoleHasData({ status }), false);
    assert.equal(utils.searchConsoleInsight({ status }), "");
  }
  assert.equal(utils.searchMetric(null), "—"); assert.equal(utils.searchMetric(NaN), "—");
  assert.equal(utils.searchMetric(0), "0"); assert.equal(utils.searchMetric(0.02, true), "2%");
});

test("CTR comparison is percentage points, position improvement is lower, and unknown stays unknown", () => {
  assert.match(utils.searchChange(0.02, 0.01, "ctr", true), /\+1 პროცენტული პუნქტი/);
  assert.match(utils.searchChange(10, 12, "position", true), /2 პოზიციით გაუმჯობესდა/);
  assert.match(utils.searchChange(14, 12, "position", true), /2 პოზიციით გაუარესდა/);
  assert.equal(utils.searchChange(1, 0, "clicks", true), "წინა პერიოდში 0 იყო");
  assert.equal(utils.searchChange(0, 0, "clicks", true), "ცვლილება არ არის");
  assert.match(utils.searchChange(null, 10, "position", true), /მიუწვდომელია/);
  assert.match(utils.searchChange(10, 5, "clicks", false), /მიუწვდომელია/);
});

test("search explanation keeps search clicks distinct from sales and avoids invented causes", () => {
  const empty = utils.searchConsoleInsight({ status: "empty", summary: { clicks: 0, impressions: 0 } });
  assert.match(empty, /ეს გაყიდვების ან საიტზე ყველა ვიზიტის რაოდენობა არ არის/);
  const shown = utils.searchConsoleInsight({ status: "ready", summary: { clicks: 0, impressions: 10 } });
  assert.match(shown, /მიზეზი მხოლოდ ამ რიცხვებით არ დგინდება/);
  const active = utils.searchConsoleInsight({ status: "ready", summary: { clicks: 2, impressions: 100 } });
  assert.match(active, /100-ჯერ და მიიღო 2 დაწკაპუნება/);
  assert.doesNotMatch(active, /შეძენა|მოგება/);
});

test("period snapshots and generation guards reject late responses", async () => {
  const c = context(), input = { ...period }, first = c.load(input);
  input.start = "2026-10-01";
  const second = c.load(input);
  assert.equal(c.calls[0].input.query.start, period.start);
  assert.equal(c.calls[0].input.signal.aborted, true);
  assert.equal(c.calls[1].path, "/business/search-console/");
  c.calls[1].resolve({ status: "empty", marker: "new" }); await second;
  c.calls[0].resolve({ status: "ready", marker: "old" }); await first;
  assert.equal(c.report.value.marker, "new");
});

test("expired business permissions clear private data and redirect independently of customer login", async () => {
  for (const statusCode of [401, 403]) {
    const c = context(), pending = c.load(period);
    c.calls[0].reject({ statusCode }); await pending;
    assert.equal(c.user.value, null); assert.equal(c.report.value, null);
    assert.equal(c.navigations[0].target.query.next, "/business/users");
  }
});

test("unmount and unavailable transport cannot restore old private reports", async () => {
  const c = context(), pending = c.load(period); c.unmount();
  assert.equal(c.calls[0].input.signal.aborted, true);
  c.calls[0].resolve({ summary: {} }); await pending;
  assert.equal(c.report.value, null);
  const other = context(), failure = other.load(period);
  other.calls[0].reject({ statusCode: 503 }); await failure;
  assert.equal(other.report.value, null); assert.match(other.errorMessage.value, /ვერ განახლდა/);
});

test("search panel, lazy chart and both integration templates compile", () => {
  for (const name of ["BusinessSearchConsole", "BusinessSearchChart", "BusinessUsers", "BusinessReport"]) {
    const source = readFileSync(new URL(`../app/components/business/${name}.vue`, import.meta.url), "utf8");
    const { descriptor } = parse(source);
    const result = compileTemplate({ source: descriptor.template.content, filename: `${name}.vue`, id: name, compilerOptions: { expressionPlugins: ["typescript"] } });
    assert.deepEqual(result.errors, []);
  }
});
