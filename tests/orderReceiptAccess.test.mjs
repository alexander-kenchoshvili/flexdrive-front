import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const vue = require("vue");
const ts = require("typescript");
const { parse, compileScript } = require("@vue/compiler-sfc");
const source = readFileSync(new URL("../app/pages/checkout/success/[token].vue", import.meta.url), "utf8")
  .replace("await loadOrder();", "defineExpose({ receiptAvailable, receiptRecoveryRequired, receiptError, handleReceiptDownload });\nawait loadOrder();");
const code = ts.transpileModule(compileScript(parse(source).descriptor, {
  id: "receipt-access-test", inlineTemplate: true,
}).content.replaceAll("import.meta.client", "true"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const renderer = vue.createRenderer({
  createElement: (type) => ({ type, props: {}, children: [] }),
  createText: (text) => ({ text }), createComment: () => ({}),
  setText: (node, text) => { node.text = text; },
  setElementText: (node, text) => { node.text = text; node.children = []; },
  patchProp: (node, key, _old, value) => { node.props[key] = value; },
  insert(node, parent, anchor) {
    if (node.parent) {
      const previous = node.parent.children;
      const index = previous.indexOf(node);
      if (index >= 0) previous.splice(index, 1);
    }
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
const stub = vue.defineComponent({ render: () => null });
const summary = vue.defineComponent({
  props: ["receiptAvailable", "receiptRecoveryRequired", "receiptError"],
  setup: (props) => () => vue.h("section", {
    "data-receipt": props.receiptAvailable, "data-recovery": props.receiptRecoveryRequired,
  }),
});
const token = "00000000-0000-4000-8000-000000000001";
const baseOrder = {
  public_token: token, order_number: "ORD-TEST-RECEIPT", payment_method: "card",
  payment_status: "paid", total: "12.00", items: [{ id: 1, sku: "FD-TEST", product_name: "Test", unit_price: "3.00", quantity: 1 }],
};
async function mount(t, { serverAccess, storedToken = "", user = null, paymentStatus = "paid", downloadError = false } = {}) {
  const requests = [], downloads = [], purchases = [];
  const order = { ...baseOrder, payment_status: paymentStatus, ...(serverAccess === undefined ? {} : { receipt_available: serverAccess }) };
  const globals = { ...vue,
    definePageMeta: () => {},
    useRoute: () => ({ params: { token } }),
    useGlobalStore: () => ({ currentUser: user }),
    useEcommerceAnalytics: () => ({ trackPurchase: (value) => purchases.push(value) }),
    useNoindexPage: () => {}, createError: (value) => Object.assign(new Error(), value),
  };
  const exports = {};
  new Function("require", "exports", ...Object.keys(globals), code)((name) => {
    if (name.endsWith("CheckoutSuccessSummary.vue")) return { default: summary };
    if (name.endsWith(".vue")) return { default: stub };
    if (name.includes("useCommerceApi")) return { useCommerceApi: () => ({ getOrderSummary: async (...args) => { requests.push(args); return order; } }) };
    if (name.includes("useOrderReceipt")) return { useOrderReceipt: () => ({
      readReceiptAccessToken: () => storedToken,
      downloadReceipt: async (value) => { downloads.push(value); if (downloadError) throw new Error("test failure"); },
    }) };
    return require(name);
  }, exports, ...Object.values(globals));
  let vm;
  const container = { children: [] };
  const app = renderer.createApp({ render: () => vue.h(vue.Suspense, {}, {
    default: () => vue.h(exports.default, { ref: (value) => { vm = value; } }), fallback: () => null,
  }) });
  app.mount(container);
  t.after(() => app.unmount());
  for (let i = 0; i < 20; i++) { await Promise.resolve(); await vue.nextTick(); }
  await new Promise((done) => setImmediate(done));
  assert.ok(vm?.handleReceiptDownload, "real async success-page setup mounted");
  return { vm, requests, downloads, purchases };
}

test("guest bank-return cookie makes PDF visible with no browser-storage token", async (t) => {
  const current = await mount(t, { serverAccess: true });
  assert.equal(current.vm.receiptAvailable, true);
  assert.equal(current.vm.receiptRecoveryRequired, false);
  assert.deepEqual(current.requests, [[token, { headers: {} }]]);
  await current.vm.handleReceiptDownload();
  assert.deepEqual(current.downloads, [{ orderToken: token, orderNumber: baseOrder.order_number, accessToken: "" }]);
});

test("an issued receipt survives refund; reopening it does not track a new purchase", async (t) => {
  const current = await mount(t, { serverAccess: true, paymentStatus: "refunded" });
  assert.equal(current.vm.receiptAvailable, true);
  assert.equal(current.purchases.length, 0);
});

test("lost access offers recovery; an unrelated signed-in account cannot override server denial", async (t) => {
  const current = await mount(t, { serverAccess: false, user: { id: 999 }, storedToken: "old-token" });
  assert.equal(current.vm.receiptAvailable, false);
  assert.equal(current.vm.receiptRecoveryRequired, true);
});

test("existing signed-token clients remain compatible with older backend responses", async (t) => {
  const current = await mount(t, { storedToken: "existing-signed-token" });
  assert.equal(current.vm.receiptAvailable, true);
  assert.deepEqual(current.requests[0][1], { headers: { "X-Receipt-Token": "existing-signed-token" } });
});

test("pending payments never expose receipt access through the legacy fallback", async (t) => {
  const current = await mount(t, { paymentStatus: "pending", storedToken: "existing-signed-token" });
  assert.equal(current.vm.receiptAvailable, false);
  assert.equal(current.vm.receiptRecoveryRequired, false);
  assert.equal(current.purchases.length, 0);
});

test("download failure is visible and keeps the receipt available for retry", async (t) => {
  const current = await mount(t, { serverAccess: true, downloadError: true });
  await current.vm.handleReceiptDownload();
  assert.match(current.vm.receiptError, /PDF/);
  assert.equal(current.vm.receiptAvailable, true);
  await current.vm.handleReceiptDownload();
  assert.equal(current.downloads.length, 2);
});

function paymentPage(client, events, result = "paid") {
  const src = readFileSync(new URL("../app/components/commerce/CardPaymentResultPage.vue", import.meta.url), "utf8");
  const compiled = ts.transpileModule(compileScript(parse(src).descriptor, {
    id: "bank-return-receipt-test", inlineTemplate: true,
  }).content.replaceAll("import.meta.client", String(client)), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const globals = { ...vue,
    useRoute: () => ({ query: { payment_token: token } }),
    useNoindexPage: () => {},
    document: { visibilityState: "visible", addEventListener() {}, removeEventListener() {} },
    navigateTo: async (path) => events.push(["navigate", path]),
    setTimeout: (callback, delay) => {
      if (delay === 900) queueMicrotask(callback);
      else events.push(["poll", delay]);
      return 1;
    },
    clearTimeout: () => {},
  };
  const exports = {};
  new Function("require", "exports", ...Object.keys(globals), compiled)((name) => {
    if (name.endsWith(".vue")) return { default: stub };
    if (name.includes("useCommerceApi")) return { useCommerceApi: () => ({
      getCardPaymentStatus: async () => {
        events.push(["status"]);
        return { result, order_public_token: result === "paid" ? token : null, receipt_access_token: "signed-test-token" };
      },
    }) };
    if (name.includes("useOrderReceipt")) return { useOrderReceipt: () => ({ storeReceiptAccess: () => events.push(["access"]) }) };
    if (name.includes("useCardPaymentFlow")) return { useCardPaymentFlow: () => ({
      clearReturnContext() {}, readReturnContext: () => null, redirectToProvider() {},
    }) };
    if (name.includes("checkoutDraft")) return { clearCheckoutDraft() {} };
    return require(name);
  }, exports, ...Object.values(globals));
  return exports.default;
}

test("SSR cannot consume the bank-return status response intended to grant a browser cookie", async () => {
  const events = [];
  const { renderToString } = require("@vue/server-renderer");
  await renderToString(vue.createSSRApp(paymentPage(false, events), { hint: "success" }));
  assert.deepEqual(events, []);
});

test("mounted bank-return page obtains receipt access before navigating, exactly once", async () => {
  const events = [];
  const app = renderer.createApp(paymentPage(true, events), { hint: "success" });
  app.mount({ children: [] });
  await new Promise((done) => setImmediate(done));
  assert.deepEqual(events, [["status"], ["access"], ["navigate", `/checkout/success/${token}`]]);
  app.unmount();
});

test("pending bank return still schedules polling and never redirects to a paid order", async () => {
  const events = [];
  const app = renderer.createApp(paymentPage(true, events, "pending"), { hint: "success" });
  app.mount({ children: [] });
  await new Promise((done) => setImmediate(done));
  assert.deepEqual(events, [["status"], ["poll", 2000]]);
  app.unmount();
});
