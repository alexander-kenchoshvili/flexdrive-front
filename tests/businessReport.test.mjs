import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const vue = require("vue");
const execute = (path, globals = {}, mocks = {}) => {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  return new Function("require", "exports", ...Object.keys(globals), `${outputText}\nreturn exports;`)(
    (name) => mocks[name] ?? require(name), {}, ...Object.values(globals),
  );
};
const utils = execute("app/utils/businessReport.ts");
const { buildBusinessInsights } = execute("app/utils/businessInsights.ts", {}, { "./businessReport": utils });
const mocks = {
  "~/utils/httpError": execute("app/utils/httpError.ts"),
  "~/utils/businessRouting": execute("app/utils/businessRouting.ts"),
};
const context = () => {
  const calls = [], navigations = [];
  const user = vue.ref({ id: 7 });
  const customer = vue.ref({ id: 9 });
  let unmount;
  const module = execute("app/composables/useBusinessReport.ts", {
    ref: vue.ref, shallowRef: vue.shallowRef,
    useRoute: () => ({ path: "/business/finance" }),
    useBusinessAuth: () => ({ user }),
    useApiBaseUrl: () => "/api",
    navigateTo: async (target, options) => { navigations.push({ target, options }); },
    onBeforeUnmount: (callback) => { unmount = callback; },
    $fetch: { create(options) {
      assert.equal(options.credentials, "include");
      assert.equal(options.cache, "no-store");
      assert.equal(options.retry, 0);
      assert.equal(options.timeout, 20000);
      return (path, input) => new Promise((resolve, reject) => { calls.push({ path, input, resolve, reject }); });
    } },
  }, mocks);
  return { ...module.useBusinessReport(), calls, navigations, user, customer, unmount: () => unmount() };
};
const september = { start: "2026-09-01", end: "2026-09-30" };
const october = { start: "2026-10-01", end: "2026-10-09" };

test("calendar presets handle leap years, year boundaries and inclusive 30 days", () => {
  assert.deepEqual(utils.businessPreset("previous", "2024-03-03"), { start: "2024-02-01", end: "2024-02-29" });
  assert.deepEqual(utils.businessPreset("previous", "2026-01-02"), { start: "2025-12-01", end: "2025-12-31" });
  assert.deepEqual(utils.businessPreset("month", "2026-10-09"), october);
  assert.deepEqual(utils.businessPreset("30days", "2026-01-02"), { start: "2025-12-04", end: "2026-01-02" });
  assert.equal(utils.reportMoney(null), "—");
  assert.equal(utils.reportNumber(undefined), "—");
  assert.notEqual(utils.reportMoney("0.00"), "—");
});

test("switching periods aborts the old request and rejects a late stale response", async () => {
  const c = context();
  const first = c.load(september);
  const second = c.load(october);
  assert.equal(c.calls[0].input.signal.aborted, true);
  assert.deepEqual(c.calls[1].input.query, october);
  assert.equal(c.calls[1].path, "/business/report/");
  c.calls[1].resolve({ period: october }); await second;
  c.calls[0].resolve({ period: september }); await first;
  assert.deepEqual(c.report.value.period, october);
  assert.equal(c.loading.value, false);
});

test("old access failure cannot erase a newer authorized result", async () => {
  const c = context();
  const old = c.load(september), latest = c.load(october);
  c.calls[1].resolve({ period: october }); await latest;
  c.calls[0].reject({ statusCode: 401 }); await old;
  assert.equal(c.user.value.id, 7);
  assert.deepEqual(c.navigations, []);
  assert.deepEqual(c.report.value.period, october);
});

test("refresh removes previous financial values and a failed request offers retry without zeros", async () => {
  const c = context();
  const first = c.load(september);
  c.calls[0].resolve({ summary: { received: "1000.00" } }); await first;
  const refresh = c.load(september);
  assert.equal(c.report.value, null);
  assert.equal(c.loading.value, true);
  c.calls[1].reject({ statusCode: 503 }); await refresh;
  assert.equal(c.report.value, null);
  assert.match(c.errorMessage.value, /ხელახლა/);
  assert.equal(c.loading.value, false);
});

test("expired or revoked business access redirects without changing customer login", async () => {
  for (const status of [401, 403]) {
    const c = context();
    const pending = c.load(september);
    c.calls[0].reject({ statusCode: status }); await pending;
    assert.equal(c.user.value, null);
    assert.equal(c.customer.value.id, 9);
    assert.equal(c.report.value, null);
    assert.equal(c.navigations[0].target.path, "/business/login");
    assert.equal(c.navigations[0].target.query.next, "/business/finance");
    assert.equal(c.navigations[0].target.query.reason, status === 403 ? "denied" : undefined);
    assert.equal(c.navigations[0].options.replace, true);
  }
});

test("leaving the page aborts pending work and never retains private report values", async () => {
  const c = context();
  const pending = c.load(september);
  c.unmount();
  assert.equal(c.calls[0].input.signal.aborted, true);
  c.calls[0].resolve({ summary: { received: "1000.00" } }); await pending;
  assert.equal(c.report.value, null);
});

const insightInput = (current = {}, previous = {}) => {
  const baseline = { received: "100.00", refunded: "0.00", product_received: "100.00", net_received: "100.00", product_profit_net: "20.00", paid_orders: 1, refunded_orders: 0, sold_units: 1, unsaleable_units: 0, unknown_cost_lines: 0, unallocated_events: 0, unknown_loss_lines: 0 };
  const summary = { ...baseline, ...current }, before = { ...baseline, ...previous };
  const comparisons = Object.fromEntries(Object.keys(summary).map((key) => [key, { delta: summary[key] == null || before[key] == null ? null : String(Number(summary[key]) - Number(before[key])), percent: null }]));
  return { summary, previous: before, comparisons };
};

test("automatic analysis distinguishes gross sales growth from declining cash after refunds", () => {
  const input = insightInput({ product_received: "200.00", net_received: "80.00", refunded: "120.00", product_profit_net: "15.00", sold_units: 2 });
  const result = buildBusinessInsights(input);
  assert.match(result.paragraph, /გაყიდვის თანხა გაიზარდა, თუმცა.*სრული თანხა შემცირდა/);
  assert.match(result.paragraph, /მოგება დღგ-ის გარეშე შემცირდა/);
  assert.match(result.paragraph, /შეკვეთების რაოდენობა უცვლელია/);
  assert.equal(result.facts[0].key, "refunds");
  assert.doesNotMatch(result.paragraph, /გამოწვეული|კომპანიის წმინდა მოგება|რეკლამ/);
});

test("analysis handles activity starting from zero without inventing percentages", () => {
  const result = buildBusinessInsights(insightInput({}, { received: "0.00", product_received: "0.00", net_received: "0.00", product_profit_net: "0.00", paid_orders: 0, sold_units: 0 }));
  assert.match(result.paragraph, /მიღებული თანხა ნული იყო/);
  assert.doesNotMatch(result.paragraph, /Infinity|NaN|%/);
});

test("missing purchase costs never become a zero cost or a profit-growth conclusion", () => {
  const result = buildBusinessInsights(insightInput({ product_profit_net: null, unknown_cost_lines: 1 }));
  assert.match(result.paragraph, /მოგების სრულად შესადარებლად მონაცემები არასაკმარისია/);
  assert.doesNotMatch(result.paragraph, /მოგება დღგ-ის გარეშე (გაიზარდა|შემცირდა|უცვლელია)/);
  assert.ok(result.facts.some((fact) => fact.key === "incomplete"));
});

test("missing prior-period profit blocks comparison even if current profit is known", () => {
  const result = buildBusinessInsights(insightInput({}, { product_profit_net: null }));
  assert.match(result.paragraph, /მოგების სრულად შესადარებლად მონაცემები არასაკმარისია/);
  assert.doesNotMatch(result.paragraph, /მოგება დღგ-ის გარეშე (გაიზარდა|შემცირდა|უცვლელია)/);
});

test("negative product results can improve while remaining negative", () => {
  const result = buildBusinessInsights(insightInput({ product_profit_net: "-10.00" }, { product_profit_net: "-20.00" }));
  assert.match(result.paragraph, /შედეგი გაუმჯობესდა.*უარყოფითია/);
  assert.doesNotMatch(result.paragraph, /მოგება დღგ-ის გარეშე გაიზარდა/);
  const recovered = buildBusinessInsights(insightInput({ product_profit_net: "10.00" }, { product_profit_net: "-20.00" }));
  assert.match(recovered.paragraph, /უარყოფითიდან დადებითი გახდა/);
});

test("refund-only periods do not invent new sales or infer why refunds happened", () => {
  const result = buildBusinessInsights(insightInput({ received: "0.00", product_received: "0.00", refunded: "70.00", net_received: "-70.00", product_profit_net: "-12.00", paid_orders: 0, refunded_orders: 1, sold_units: 0 }));
  assert.match(result.paragraph, /ახალი დადასტურებული გადახდა არ ფიქსირდება.*დაბრუნებები აღირიცხა/);
  assert.match(result.paragraph, /უარყოფითია/);
  assert.doesNotMatch(result.paragraph, /გაყიდვის თანხა გაიზარდა|გამოწვეული/);
});

test("inspection facts retain unknown loss values and point to the relevant detail section", () => {
  const result = buildBusinessInsights(insightInput({ unsaleable_units: 2, unsaleable_cost_net: null, unknown_loss_lines: 1 }));
  const loss = result.facts.find((fact) => fact.key === "unsaleable");
  assert.match(loss.text, /2 ერთეული/);
  assert.equal(loss.path, "/business/finance");
  assert.equal(loss.hash, "#business-delivery-title");
  assert.ok(result.facts.some((fact) => fact.key === "incomplete"));
});

test("an empty financial period is described without an invented health score", () => {
  const result = buildBusinessInsights(insightInput({ received: "0.00", product_received: "0.00", refunded: "0.00", net_received: "0.00", product_profit_net: "0.00", paid_orders: 0, refunded_orders: 0, sold_units: 0 }));
  assert.match(result.paragraph, /დადასტურებული გადახდები ან თანხის დაბრუნებები არ დაფიქსირებულა/);
  assert.equal(result.facts.length, 0);
  assert.doesNotMatch(result.paragraph, /მოგება.*გაიზარდა|ბიზნესი კარგად|ბიზნესი ცუდად/);
});

test("analysis follows each new report response without mutating saved facts", () => {
  const input = insightInput();
  Object.freeze(input.summary); Object.freeze(input.previous); Object.freeze(input.comparisons);
  const report = vue.shallowRef(input);
  const analysis = vue.computed(() => buildBusinessInsights(report.value));
  const initial = analysis.value.paragraph;
  report.value = insightInput({ product_received: "200.00", product_profit_net: "40.00" });
  assert.notEqual(analysis.value.paragraph, initial);
  assert.match(analysis.value.paragraph, /გაყიდვის თანხა გაიზარდა/);
  assert.equal(input.summary.product_received, "100.00");
});
