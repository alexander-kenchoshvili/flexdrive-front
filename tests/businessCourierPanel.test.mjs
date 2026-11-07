import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const vue = require("vue");
const ts = require("typescript");
const { parse, compileScript } = require("@vue/compiler-sfc");
const utility = (path, mocks = {}) => {
  const code = ts.transpileModule(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  new Function("require", "exports", code)((name) => mocks[name] ?? require(name), exports);
  return exports;
};
const reports = utility("app/utils/businessReport.ts");
const operations = utility("app/utils/businessOperations.ts", { "./businessReport": reports });
const load = (name) => {
  const source = readFileSync(new URL(`../app/components/business/${name}.vue`, import.meta.url), "utf8");
  const code = ts.transpileModule(compileScript(parse(source).descriptor, { id: name, inlineTemplate: true }).content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  new Function("require", "exports", "computed", code)((key) => ({
    "~/utils/businessReport": reports, "~/utils/businessOperations": operations,
  })[key] ?? require(key), exports, vue.computed);
  return exports.default;
};
const finance = load("BusinessCourierFinance"), shipments = load("BusinessShipments");
const renderer = vue.createRenderer({
  createElement: (type) => ({ type, props: {}, children: [] }), createText: (text) => ({ text }), createComment: () => ({}),
  setText: (node, text) => { node.text = text; }, setElementText: (node, text) => { node.text = text; node.children = []; },
  patchProp: (node, key, _old, value) => { node.props[key] = value; },
  insert(node, parent) { node.parent = parent; parent.children.push(node); },
  remove(node) { if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1); },
  parentNode: (node) => node.parent, nextSibling: () => null,
});
const text = (node) => [node.text || "", ...(node.children || []).map(text)].join(" ");
const find = (node, predicate) => predicate(node) ? node : (node.children || []).map((child) => find(child, predicate)).find(Boolean);
const mount = (component, props) => {
  const root = { children: [] }, app = renderer.createApp(component, props);
  app.component("BaseButton", vue.defineComponent({ props: ["disabled"], setup: (props, { slots }) => () => vue.h("button", { disabled: props.disabled }, slots.default?.()) }));
  app.component("BaseSelect", vue.defineComponent({ props: ["modelValue", "options"], emits: ["update:modelValue"],
    setup: (props, { emit }) => () => vue.h("select", { value: props.modelValue, onChange: (event) => emit("update:modelValue", event.target.value) }, props.options.map((option) => vue.h("option", { value: option.value }, option.label))) }));
  app.mount(root); return { root, close: () => app.unmount() };
};
const delivery = { order_number: "ORDER-1", date: "2026-11-03", cancelled: false, stage: "created", stage_label: "შექმნილია",
  tracking_number: "RC-1", customer_delivery: "12.00", quoted_price: "12.00", buffer: "0.00", booked_price: "15.00", difference: "3.00",
  issues: ["RedCap-ის ფასი ჩექაუთის ტარიფს არ ემთხვევა."] };
const report = (changes = {}) => ({ summary: { delivery_received: "12.00", net_delivery_received: "12.00", courier_payable: "15.00",
  return_delivery_cost: "10.00", retained_return_fee: "10.00", buffer_received: "0.00", courier_booked_orders: 1,
  courier_cancelled_orders: 0, courier_unknown_price_orders: 0, unknown_return_cost_events: 0, ...changes }, deliveries: [delivery], delivery_rows_total: 1 });

test("actual finance component separates checkout price, RedCap price, difference and return costs", () => {
  const current = mount(finance, { report: report() });
  const value = text(current.root);
  for (const label of ["ჩექაუთის ტარიფი", "RedCap-ის ფასი", "ფასთა სხვაობა", "დაფიქსირებული უკუმიტანის ხარჯი", "უკუმიტანისთვის დაქვითული თანხა"]) assert.ok(value.includes(label));
  assert.doesNotMatch(value, /თბილისში მიტანის საფასური|საკურიეროსთვის გადასახდელი|დადგენილი ბუფერი/);
  const table = find(current.root, (node) => node.type === "table");
  for (const amount of [12, 15, 3]) assert.ok(text(table).includes(reports.reportMoney(`${amount}.00`)));
  assert.match(value, /შექმნის თარიღით/);
  current.close();
});

test("future buffer appears separately; unknown prices are not converted to zero", () => {
  const data = report({ courier_payable: null, courier_unknown_price_orders: 1, buffer_received: "3.00" });
  data.deliveries = [{ ...delivery, customer_delivery: "15.00", buffer: "3.00", booked_price: null, difference: null, issues: ["RedCap-ის ფასი უცნობია."] }];
  const current = mount(finance, { report: data });
  assert.match(text(current.root), /დადგენილი ბუფერი/);
  assert.match(text(current.root), /არასრული ჯამი „—“-ითაა ნაჩვენები/);
  const table = find(current.root, (node) => node.type === "table");
  assert.match(text(table), /—/);
  current.close();
});

test("actual shipment filter and pagination emit independent query changes", () => {
  const selected = [], pages = [];
  const data = { filter: "all", summary: { review: 1 }, total: 21, page: 1, pages: 2,
    items: [{ ...delivery, carrier_status_label: "გზავნილი შექმნილია", submitted_at: "2026-11-03T10:00:00Z", checked_at: null }] };
  const current = mount(shipments, { shipments: data, onFilter: (value) => selected.push(value), onPage: (page) => pages.push(page) });
  const select = find(current.root, (node) => node.type === "select");
  select.props.onChange({ target: { value: "review" } });
  assert.deepEqual(selected, ["review"]);
  const next = find(current.root, (node) => node.type === "button" && text(node).includes("შემდეგი"));
  next.props.onClick();
  assert.deepEqual(pages, [2]);
  assert.ok(text(current.root).includes("RC-1"));
  assert.match(text(current.root), /განახლება RedCap-ში მოთხოვნას არ აგზავნის/);
  current.close();
});

test("empty bookings and shipments render honest empty states", () => {
  const data = report(); data.deliveries = []; data.delivery_rows_total = 0;
  const first = mount(finance, { report: data });
  assert.match(text(first.root), /გზავნილი არ შექმნილა/); first.close();
  const second = mount(shipments, { shipments: { filter: "all", summary: { review: 0 }, items: [], total: 0, page: 1, pages: 1 } });
  assert.match(text(second.root), /ამ ფილტრით გზავნილი არ არის/); second.close();
});

test("cancelled booking keeps its quoted price visible and warns that billing needs review", () => {
  const data = report({ courier_cancelled_orders: 1, courier_payable: "0.00" });
  data.deliveries = [{ ...delivery, cancelled: true, stage: "returning", stage_label: "ნივთების დაბრუნება" }];
  const current = mount(finance, { report: data });
  assert.match(text(current.root), /გაუქმებულია — ჯამში არ შედის/);
  assert.match(text(current.root), /შესაძლო საკურიერო ხარჯი გადაამოწმეთ/);
  current.close();
});

test("outbound deduction is distinct from return cost and included in the delivery balance", () => {
  const current = mount(finance, { report: report({ retained_delivery_fee: "10.00", net_delivery_received: "10.00" }) });
  const card = find(current.root, (node) => node.type === "article" && text(node).includes("პირველი მიტანისთვის დაქვითული თანხა"));
  assert.ok(card);
  assert.ok(text(card).includes(reports.reportMoney("10.00")));
  assert.match(text(card), /მიტანის ნაშთში უკვე შედის/);
  assert.match(text(card), /ცალკე შემოსავალს ან ხარჯს არ ემატება/);
  assert.match(text(current.root), /უკუმიტანისთვის დაქვითული თანხა/);
  current.close();
});
