import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const vue = require("vue");
const ts = require("typescript");
const { parse, compileScript } = require("@vue/compiler-sfc");
const key = "flexdrive:order-status:last-lookup";
const oldTime = "2020-01-02T10:30:00.000Z";
const result = (status = "shipped") => ({
  order_number: "ORD-TEST-1", status, payment_status: "paid", payment_method: "card",
  checkout_source: "cart", total: "112.00", created_at: "2020-01-01T10:00:00Z",
  items: [], item_count: 0, total_quantity: 0,
});
const stored = (extra = {}) => ({ order_number: "ORD-TEST-1", phone: "555000002", result: result(), checked_at: oldTime, ...extra });
const source = readFileSync(new URL("../app/components/SmartComponents/OrderStatus/OrderStatus.vue", import.meta.url), "utf8")
  .replace("</script>", "defineExpose({ form, order, checkedAt, restoredResult, submitLookup, errorMessage, loading });\n</script>");
const compiled = ts.transpileModule(compileScript(parse(source).descriptor, {
  id: "guest-status-test", inlineTemplate: true,
}).content.replaceAll("import.meta.client", "true"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const refundSource = readFileSync(new URL("../app/components/commerce/OrderRefundSummary.vue", import.meta.url), "utf8");
const refundCode = ts.transpileModule(compileScript(parse(refundSource).descriptor, {
  id: "refund-summary-test", inlineTemplate: true,
}).content, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const refundExports = {};
new Function("require", "exports", refundCode)(require, refundExports);
const stub = vue.defineComponent({ render: () => null });
const button = vue.defineComponent({
  props: ["loading", "disabled"],
  setup: (props, { slots }) => () => vue.h("button", { disabled: props.loading || props.disabled }, slots.default?.()),
});
const renderer = vue.createRenderer({
  createElement: (type) => ({ type, props: {}, children: [] }),
  createText: (text) => ({ text }), createComment: () => ({}),
  setText: (node, text) => { node.text = text; },
  setElementText: (node, text) => { node.text = text; node.children = []; },
  patchProp: (node, key, _old, value) => { node.props[key] = value; },
  insert(node, parent, anchor) {
    if (node.parent) this.remove(node);
    node.parent = parent;
    const index = anchor ? parent.children.indexOf(anchor) : -1;
    if (index < 0) parent.children.push(node); else parent.children.splice(index, 0, node);
  },
  remove(node) {
    const siblings = node.parent?.children;
    if (siblings) siblings.splice(siblings.indexOf(node), 1);
    node.parent = null;
  },
  parentNode: (node) => node.parent,
  nextSibling: (node) => node.parent?.children[node.parent.children.indexOf(node) + 1] || null,
});
const flush = async () => {
  for (let i = 0; i < 8; i++) { await Promise.resolve(); await vue.nextTick(); }
};
const text = (node) => [node.text || "", ...(node.children || []).map(text)].join(" ");
const find = (node, predicate) => predicate(node) ? node : (node.children || []).map((child) => find(child, predicate)).find(Boolean);

function mount({ snapshot = stored(), lookup = async () => result("delivered"), brokenStorage = false } = {}) {
  const memory = new Map(snapshot === null ? [] : [[key, typeof snapshot === "string" ? snapshot : JSON.stringify(snapshot)]]);
  globalThis.window = { sessionStorage: {
    getItem: (name) => memory.get(name) ?? null,
    setItem: (name, value) => { if (brokenStorage) throw new Error("Storage disabled"); memory.set(name, value); },
    removeItem: (name) => { if (brokenStorage) throw new Error("Storage disabled"); memory.delete(name); },
  } };
  const calls = [];
  const captchas = [];
  const exports = {};
  const globals = {
    ...vue,
    useGlobalStore: () => vue.reactive({ authResolved: true, currentUser: null }),
    useRecaptcha: () => ({ executeRecaptcha: async (action) => { captchas.push(action); return "fresh-token"; } }),
  };
  new Function("require", "exports", ...Object.keys(globals), compiled)((name) => {
    if (name.endsWith("BaseButton.vue")) return { default: button };
    if (name.endsWith("OrderRefundSummary.vue")) return refundExports;
    if (name.endsWith(".vue")) return { default: stub };
    if (name.includes("useCatalogPlaceholderMedia")) return { useCatalogPlaceholderMedia: () => ({ cardPlaceholderImage: {} }) };
    if (name.includes("useCommerceApi")) return { useCommerceApi: () => ({ lookupOrder: async (payload) => { calls.push(payload); return lookup(payload); } }) };
    if (name.includes("useCommercePresentation")) return { useCommercePresentation: () => ({
      getOrderStatusBadgeClasses: () => "", getOrderStatusLabel: (status) => status,
      getPaymentMethodLabel: (method) => method, getPaymentStatusBadgeClasses: () => "", getPaymentStatusLabel: (status) => status,
    }) };
    if (name.includes("helpers")) return { sanitizeText: (value) => String(value || "") };
    return require(name);
  }, exports, ...Object.values(globals));
  const container = { children: [] };
  const app = renderer.createApp(exports.default);
  app.mount(container);
  return { state: app._instance.exposed, container, memory, calls, captchas, unmount: () => app.unmount() };
}

test("restored result is dated and labelled; refresh button requests a new status and timestamp", async () => {
  const current = mount();
  await flush();
  assert.equal(current.state.form.phone, "555000002");
  assert.equal(current.state.checkedAt.value, oldTime);
  assert.equal(current.state.restoredResult.value, true);
  assert.match(text(current.container), /წინა შემოწმების შენახული შედეგია/);
  assert.match(text(current.container), /ბოლო შემოწმება/);
  assert.equal(current.calls.length, 0);
  const refresh = find(current.container, (node) => node.type === "button" && text(node).includes("სტატუსის განახლება"));
  assert.ok(refresh);
  const before = Date.now();
  await refresh.props.onClick();
  await flush();
  assert.equal(current.state.order.value.status, "delivered");
  assert.equal(current.state.restoredResult.value, false);
  assert.ok(Date.parse(current.state.checkedAt.value) >= before);
  assert.deepEqual(current.captchas, ["order_lookup"]);
  assert.deepEqual(current.calls, [{ order_number: "ORD-TEST-1", phone: "555000002", recaptcha_token: "fresh-token" }]);
  assert.equal(JSON.parse(current.memory.get(key)).checked_at, current.state.checkedAt.value);
  assert.doesNotMatch(text(current.container), /წინა შემოწმების შენახული შედეგია/);
  current.unmount();
});

test("legacy timestamps are not invented and malformed storage does not break the page", async () => {
  for (const checked_at of [undefined, "invalid-date"]) {
    const current = mount({ snapshot: stored({ checked_at }) });
    await flush();
    assert.equal(current.state.checkedAt.value, null);
    assert.match(text(current.container), /წინა შემოწმების დრო შენახული არ არის/);
    assert.equal(current.calls.length, 0);
    current.unmount();
  }
  const current = mount({ snapshot: "broken JSON" });
  await flush();
  assert.equal(current.state.order.value, null);
  assert.equal(current.state.form.order_number, "");
  current.unmount();
});

test("overlapping clicks cannot send duplicate status requests", async () => {
  let resolve;
  const pending = new Promise((done) => { resolve = done; });
  const current = mount({ lookup: () => pending });
  const first = current.state.submitLookup();
  await flush();
  await current.state.submitLookup();
  assert.equal(current.calls.length, 1);
  assert.equal(current.state.loading.value, true);
  resolve(result("delivered"));
  await first;
  await flush();
  assert.equal(current.state.loading.value, false);
  current.unmount();
});

test("unavailable storage cannot turn a successful response into an error", async () => {
  const current = mount({ brokenStorage: true });
  await current.state.submitLookup();
  await flush();
  assert.equal(current.state.order.value.status, "delivered");
  assert.equal(current.state.errorMessage.value, "");
  current.unmount();
});

test("failed refresh removes the old status and never assigns it a fresh timestamp", async () => {
  const current = mount({ lookup: async () => { throw { data: { detail: "შეკვეთა ვერ მოიძებნა" } }; } });
  await current.state.submitLookup();
  await flush();
  assert.equal(current.state.order.value, null);
  assert.equal(current.state.checkedAt.value, null);
  assert.match(current.state.errorMessage.value, /შეკვეთა ვერ მოიძებნა/);
  assert.equal(current.memory.has(key), false);
  current.unmount();
});

test("editing lookup credentials clears the displayed result without an automatic request", async () => {
  const current = mount();
  current.state.form.order_number = "ORD-OTHER";
  await flush();
  assert.equal(current.state.order.value, null);
  assert.equal(current.state.checkedAt.value, null);
  assert.equal(current.calls.length, 0);
  current.unmount();
});

test("guest lookup renders the actual refund amount and agreed deduction from the API", async () => {
  const current = mount({ lookup: async () => ({ ...result("cancelled"), payment_status: "partially_refunded",
    refund_summary: { status: "refunded", amount: "90.00", retained_return_fee: "10.00" },
  }) });
  await current.state.submitLookup(); await flush();
  assert.match(text(current.container), /დაბრუნებული თანხა: 90.00 ₾/);
  assert.match(text(current.container), /უკუმიტანის შეთანხმებული საფასური: 10.00 ₾/);
  assert.doesNotMatch(text(current.container), /დაბრუნებული თანხა: 112.00/);
  current.unmount();
});

test("pending and rejected refunds never appear as confirmed money returns", async () => {
  for (const status of ["refund_pending", "failed"]) {
    const current = mount({ lookup: async () => ({ ...result("delivered"),
      refund_summary: { status, amount: "90.00", retained_return_fee: "10.00" },
    }) });
    await current.state.submitLookup(); await flush();
    assert.doesNotMatch(text(current.container), /დაბრუნებული თანხა:/);
    assert.match(text(current.container), status === "failed" ? /ბანკმა დაბრუნების მოთხოვნა უარყო/ : /ველოდებით ბანკის საბოლოო დადასტურებას/);
    current.unmount();
  }
});
