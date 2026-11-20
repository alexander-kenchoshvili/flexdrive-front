import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const vue = require("vue");
const ts = require("typescript");
const { parse, compileScript } = require("@vue/compiler-sfc");
const { renderToString } = require("vue/server-renderer");
const execute = (path, mocks = {}) => {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  return new Function("require", "exports", `${code}; return exports;`)((name) => mocks[name] ?? require(name), {});
};
const reports = execute("app/utils/businessReport.ts");
const utils = execute("app/utils/businessOperations.ts", { "./businessReport": reports });
const path = "../app/components/business/BusinessPaymentAttempt.vue";
const source = readFileSync(new URL(path, import.meta.url), "utf8");
const compiled = compileScript(parse(source, { filename: path }).descriptor, { id: "payment-attempt", inlineTemplate: true }).content;
const code = ts.transpileModule(compiled, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const component = new Function("require", "exports", `${code}; return exports.default;`)(
  (name) => name === "vue" ? vue : name === "~/utils/businessOperations" ? utils : require(name), {});
const render = (payment) => renderToString(vue.createSSRApp({ render: () => vue.h(component, { payment }) }));
const checkout = (service = "fast") => ({ subtotal: "60.00", delivery: service === "fast" ? "19.00" : "9.00",
  total: service === "fast" ? "79.00" : "69.00", service, service_label: service === "fast" ? "სწრაფი მიტანა" : "სტანდარტული მიტანა" });
const failure = { kind: "authentication_declined", code: "108", label: "ბანკის ავთენტიფიკაცია არ დადასტურდა", detail: "ბანკის პასუხია Authentication Declined." };
const entry = (id, success = false) => ({ id, status: success ? "paid" : "failed", status_label: success ? "გადახდილია" : "წარუმატებელი",
  amount: success ? "69.00" : "79.00", currency: "GEL", created_at: `2026-11-20T0${id === 7 ? 6 : 5}:15:00Z`, updated_at: "2026-11-20T05:17:00Z",
  confirmed_at: success ? "2026-11-20T06:19:00Z" : null, order_number: success ? "ORD-EXAMPLE" : null,
  settlement_label: null, checkout: checkout(success ? "standard" : "fast"), failure: success ? null : failure });
const payment = () => ({ ...entry(4), action_label: "გადახდა", issue: "შენახული გაფრთხილება", checked_at: null,
  attempt_context: { checkout: checkout(), failure, bank_order_created: true, match_basis: "same_checkout_and_basket_24h",
    history: [entry(4), entry(5), entry(6), entry(7, true)], history_limited: false, later_success: entry(7, true) } });

test("real payment view explains bank rejection, delivery choice, chronological attempts and later success in Tbilisi time", async () => {
  const html = await render(payment());
  for (const text of ["კოდი 108", "Authentication Declined", "სწრაფი მიტანა", "სტანდარტული მიტანა", "მოგვიანებით გადახდა დადასტურდა", "ORD-EXAMPLE", "10:19", "24-საათიან", "ყველა კლიკი აქ არ აღირიცხება", "მიტანის ცვლილება ბანკის უარყოფის მიზეზს არ ადგენს"]) assert.ok(html.includes(text), text);
  assert.equal((html.match(/<li\b/g) || []).length, 4);
  assert.ok(html.indexOf("#4") < html.indexOf("#5") && html.indexOf("#5") < html.indexOf("#6") && html.indexOf("#6") < html.indexOf("#7"));
  assert.match(html, /<details/);
  assert.doesNotMatch(html, /გადამოწმების დრო არ არის შენახული/);
});

test("older backend responses retain the existing warning without inventing a reason or success", async () => {
  const row = payment();
  delete row.attempt_context;
  const html = await render(row);
  assert.match(html, /შენახული გაფრთხილება/);
  assert.match(html, /გადამოწმების დრო არ არის შენახული/);
  assert.doesNotMatch(html, /Authentication Declined|მოგვიანებით|<details/);
});

test("unknown legacy history and prices remain unknown and do not become zeroes", async () => {
  const row = payment();
  Object.assign(row.attempt_context, { checkout: null, failure: null, history: [], match_basis: null, later_success: null });
  const html = await render(row);
  assert.match(html, /შესადარებელი მონაცემები არ არის შენახული/);
  assert.doesNotMatch(html, /პროდუქტები|მიტანა|მოგვიანებით|0[.,]00/);
});

test("limited history and current refunded settlement remain explicit", async () => {
  const row = payment();
  row.attempt_context.history_limited = true;
  row.attempt_context.later_success.settlement_label = "თანხა დაბრუნებულია";
  const html = await render(row);
  assert.match(html, /ისტორია შეზღუდულია/);
  assert.match(html, /თანხა დაბრუნებულია/);
});

test("untrusted display strings are HTML-escaped and pending is not reported as a successful charge", async () => {
  const row = payment();
  row.attempt_context.later_success.order_number = '<script>alert("unsafe")</script>';
  const html = await render(row);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  row.status = "pending";
  Object.assign(row.attempt_context, { failure: null, history: [], later_success: null });
  row.issue = null;
  const pending = await render(row);
  assert.match(pending, /წარმატებული ჩამოჭრა ჯერ არ დადასტურებულა/);
  assert.doesNotMatch(pending, /მოგვიანებით გადახდა დადასტურდა/);
});
