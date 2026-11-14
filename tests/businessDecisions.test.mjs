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
const utils = execute("app/utils/businessDecisions.ts"), http = execute("app/utils/httpError.ts");
const period = { start: "2026-11-01", end: "2026-11-14" };
const context = () => {
  const calls = [], navigations = [], user = vue.ref({ id: 1 });
  let unmount;
  const module = execute("app/composables/useBusinessDecisions.ts", {
    shallowRef: vue.shallowRef, ref: vue.ref, useBusinessAuth: () => ({ user }), useRoute: () => ({ path: "/business" }), useApiBaseUrl: () => "/api",
    navigateTo: async (target, options) => navigations.push({ target, options }), onBeforeUnmount: (callback) => { unmount = callback; },
    $fetch: { create(options) {
      assert.equal(options.credentials, "include"); assert.equal(options.cache, "no-store"); assert.equal(options.retry, 0);
      return (path, input) => new Promise((resolve, reject) => calls.push({ path, input, resolve, reject }));
    } },
  }, { "~/utils/httpError": http });
  return { ...module.useBusinessDecisions(), calls, navigations, user, unmount: () => unmount() };
};

test("cost and return use matching Meta figures, including fractional attributed purchases", () => {
  assert.deepEqual(utils.adEfficiency({ spend: "50", website_purchases: "2.5", website_purchase_value: "150" }), { cpa: 20, roas: 3 });
  assert.deepEqual(utils.adEfficiency({ spend: "50", website_purchases: "0", website_purchase_value: "0" }), { cpa: null, roas: 0 });
  assert.deepEqual(utils.adEfficiency({ spend: "0", website_purchases: "0", website_purchase_value: "0" }), { cpa: null, roas: null });
  assert.deepEqual(utils.adEfficiency(), { cpa: null, roas: null });
  assert.deepEqual(utils.adEfficiency({ spend: "NaN" }), { cpa: null, roas: null });
});

test("comparison handles zero baselines, unknown values, incompatible and stale periods", () => {
  assert.match(utils.decisionChange(120, 100), /20%/);
  assert.match(utils.decisionChange(80, 100), /შემცირდა 20%/);
  assert.equal(utils.decisionChange(0, 0), "ცვლილება არ არის");
  assert.equal(utils.decisionChange(2, 0), "წინა პერიოდში 0 იყო");
  for (const value of [null, undefined, "NaN"]) assert.match(utils.decisionChange(value, 5), /მიუწვდომელია/);
  assert.match(utils.decisionChange(10, 5, false), /მიუწვდომელია/);
});

test("decision notes do not invent sales/profit or confuse missing reports with zero", () => {
  assert.deepEqual(utils.decisionSummary({ google: { status: "unavailable" }, ads: { status: "unavailable" } }), []);
  const report = { google: { status: "ready", current: { sessions: 10, ecommercePurchases: 0 } }, ads: { status: "ready", summary: { spend: "20", website_purchases: "0" } },
    funnel: { status: "ready", steps: [{ label: "პროდუქტი ნახა", users: 10, lost: 6 }, { label: "კალათა", users: 4, lost: 2 }, { label: "გადახდა", users: 2, lost: 1 }, { label: "იყიდა", users: 1, lost: null }] } };
  const notes = utils.decisionSummary(report).join(" ");
  assert.match(notes, /მხოლოდ ამ რიცხვით ვერ დავასკვნით/);
  assert.match(notes, /პროდუქტი ნახა.*6/);
  assert.doesNotMatch(notes, /არ ყოფილა გაყიდვა|მოგება გაიზარდა/);
  assert.match(utils.decisionSummary({ ads: { status: "stale", summary: { spend: "0" } } }).join(" "), /ძველი პასუხიდან/);
});

test("private requests keep source/period immutable and reject late responses", async () => {
  const c = context(), input = { ...period }, first = c.load(input, "google");
  input.start = "2026-10-01";
  const second = c.load(input, "meta");
  assert.equal(c.calls[0].input.query.start, period.start);
  assert.equal(c.calls[0].input.signal.aborted, true);
  assert.equal(c.calls[1].path, "/business/decisions/meta/");
  c.calls[1].resolve({ period: input }); await second;
  c.calls[0].resolve({ period }); await first;
  assert.equal(c.report.value.period.start, "2026-10-01");
});

test("revoked access clears private values and returns to the current business page", async () => {
  for (const statusCode of [401, 403]) {
    const c = context(), pending = c.load(period, "all");
    c.calls[0].reject({ statusCode }); await pending;
    assert.equal(c.report.value, null); assert.equal(c.user.value, null);
    assert.equal(c.navigations[0].target.query.next, "/business");
    assert.equal(c.navigations[0].target.query.reason, statusCode === 403 ? "denied" : undefined);
  }
});

test("unmount prevents private data returning and failed transport is not empty success", async () => {
  const c = context(), pending = c.load(period, "all"); c.unmount();
  assert.equal(c.calls[0].input.signal.aborted, true);
  c.calls[0].resolve({ google: {} }); await pending;
  assert.equal(c.report.value, null);
  const other = context(), failure = other.load(period, "all");
  other.calls[0].reject({ statusCode: 503 }); await failure;
  assert.equal(other.report.value, null); assert.match(other.errorMessage.value, /ვერ განახლდა/);
});

test("new decision panel and all three integration templates compile", () => {
  for (const name of ["BusinessDecisionPanel", "BusinessUsers", "BusinessMarketing", "BusinessReport"]) {
    const source = readFileSync(new URL(`../app/components/business/${name}.vue`, import.meta.url), "utf8");
    const { descriptor } = parse(source);
    const result = compileTemplate({ source: descriptor.template.content, filename: `${name}.vue`, id: name, compilerOptions: { expressionPlugins: ["typescript"] } });
    assert.deepEqual(result.errors, []);
  }
});
