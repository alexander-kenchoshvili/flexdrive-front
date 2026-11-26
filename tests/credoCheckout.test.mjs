import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const vue = require("vue");
const { parse, compileScript } = require("@vue/compiler-sfc");
const { renderToString } = require("vue/server-renderer");
const storage = new Map();
globalThis.sessionStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};
function evaluate(source, mocks = {}, globals = {}) {
  const code = ts.transpileModule(source.replaceAll("import.meta.client", "true"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  new Function("require", "exports", ...Object.keys(vue), ...Object.keys(globals), code)(
    (name) => mocks[name] ?? require(name), exports, ...Object.values(vue), ...Object.values(globals),
  );
  return exports;
}
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const util = evaluate(read("app/utils/credoCheckout.ts"));
const token = "00000000-0000-4000-8000-000000000001";
const other = "00000000-0000-4000-8000-000000000002";
const app = (stage = "processing", overrides = {}) => ({ application_token: token, source: "cart", stage, ...overrides });
const renderer = vue.createRenderer({
  createComment: () => ({}), createText: () => ({}), createElement: () => ({}), insert() {}, remove() {},
  setText() {}, setElementText() {}, patchProp() {}, parentNode: () => null, nextSibling: () => null,
});
const flush = async () => { for (let i = 0; i < 8; i++) await vue.nextTick(); };

test("only exact documented bank origins and installment paths can navigate", () => {
  assert.equal(util.safeCredoRedirect("https://ganvadeba.credo.ge/installment/abc"), "https://ganvadeba.credo.ge/installment/abc");
  for (const url of ["http://ganvadeba.credo.ge/installment/a", "https://ganvadeba.credo.ge.attacker.test/installment/a",
    "https://attacker.test/installment/a", "https://user:password@ganvadeba.credo.ge/installment/a", "//ganvadeba.credo.ge/installment/a",
    "https://ganvadeba.credo.ge/installment/../a", "https://ganvadeba.credo.ge/installment/%2e%2e/a",
    "https://ganvadeba.credo.ge/installment/a?token=secret", "https://ganvadeba.credo.ge/installment/a#x",
    "https://ganvadeba.credo.ge/installment/", "javascript:alert(1)", null]) assert.equal(util.safeCredoRedirect(url), null, String(url));
});
test("recovery is isolated by source/account and stores no bank link or buyer details", () => {
  storage.clear();
  util.storeCredoApplication("cart", "guest", token);
  assert.equal(util.readCredoApplication("cart", "guest"), token);
  assert.equal(util.readCredoApplication("buy_now", "guest"), null);
  assert.equal(util.readCredoApplication("cart", "12"), null);
  util.clearCredoApplication("cart", "guest", other);
  assert.equal(util.readCredoApplication("cart", "guest"), token);
  util.clearCredoApplication("cart", "guest", token);
  assert.equal(util.readCredoApplication("cart", "guest"), null);
  util.storeCredoApplication("cart", "guest", "../../orders");
  assert.equal(storage.size, 0);
});
test("corrupt/unavailable storage never blocks financing", () => {
  storage.set("flexdrive:credo-application:cart", "{broken");
  assert.equal(util.readCredoApplication("cart", "guest"), null);
  const saved = globalThis.sessionStorage;
  globalThis.sessionStorage = { getItem() { throw Error(); }, setItem() { throw Error(); }, removeItem() { throw Error(); } };
  try { assert.doesNotThrow(() => util.storeCredoApplication("cart", "guest", token)); }
  finally { globalThis.sessionStorage = saved; }
});

function mountStatus(api) {
  const timers = new Map(); let next = 0; let state;
  const value = vue.ref(token);
  const module = evaluate(read("app/composables/commerce/useCredoApplicationStatus.ts"), {
    "~/composables/commerce/useCommerceApi": { useCommerceApi: () => ({ refreshCredoApplication: api }) },
    "~/utils/credoCheckout": util,
  }, { setTimeout: (fn) => { timers.set(++next, fn); return next; }, clearTimeout: (id) => timers.delete(id) });
  const mounted = renderer.createApp({ setup() { state = module.useCredoApplicationStatus(value); return () => null; } });
  mounted.mount({});
  return { get state() { return state; }, value, timers, unmount: () => mounted.unmount() };
}
test("local status requests do not overlap; late response from old route cannot win", async () => {
  const waiting = [];
  const page = mountStatus((id) => new Promise((resolve) => waiting.push({ id, resolve })));
  assert.equal(waiting.length, 1);
  await page.state.refresh(); assert.equal(waiting.length, 1);
  page.value.value = other; await flush(); assert.equal(waiting.length, 2);
  waiting[1].resolve(app("ready_to_ship", { application_token: other })); await flush();
  waiting[0].resolve(app("rejected")); await flush();
  assert.equal(page.state.application.value.application_token, other);
  assert.equal(page.state.application.value.stage, "ready_to_ship");
  assert.equal(page.timers.size, 0); page.unmount();
});
test("network failure preserves last evidence, shows a warning and never creates an application", async () => {
  let calls = 0;
  const page = mountStatus(async () => { if (++calls === 1) return app(); throw Error("private provider payload"); });
  await flush(); assert.equal(page.state.application.value.stage, "processing");
  await page.state.refresh();
  assert.equal(page.state.application.value.stage, "processing");
  assert.ok(page.state.error.value); assert.doesNotMatch(page.state.error.value, /private provider/);
  assert.equal(page.timers.size, 1); page.unmount(); assert.equal(page.timers.size, 0);
});
for (const stage of ["ready_to_ship", "funding_completed", "rejected", "cancelled", "start_failed", "review"]) {
  test(`status ${stage} stops automatic reads and unmount ignores outstanding work`, async () => {
    const page = mountStatus(async () => app(stage)); await flush();
    assert.equal(page.timers.size, 0); page.unmount();
  });
}
test("returning from the bank refreshes once and removes listeners on unmount", async () => {
  const originalWindow = globalThis.window; const originalDocument = globalThis.document;
  const focus = new Map(); const visibility = new Map(); let calls = 0; let page;
  globalThis.window = { addEventListener: (event, fn) => focus.set(event, fn), removeEventListener: (event) => focus.delete(event) };
  globalThis.document = { hidden: false, addEventListener: (event, fn) => visibility.set(event, fn), removeEventListener: (event) => visibility.delete(event) };
  try {
    page = mountStatus(async () => { calls++; return app(); }); await flush();
    assert.equal(calls, 1);
    globalThis.document.hidden = true; visibility.get("visibilitychange")(); await flush();
    assert.equal(calls, 1);
    globalThis.document.hidden = false; focus.get("focus")(); visibility.get("visibilitychange")(); await flush();
    assert.equal(calls, 2);
    page.unmount(); page = null;
    assert.equal(focus.size, 0); assert.equal(visibility.size, 0);
  } finally {
    page?.unmount();
    if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow;
    if (originalDocument === undefined) delete globalThis.document; else globalThis.document = originalDocument;
  }
});

test("hidden tab never polls bank refresh in the background and resumes on return", async () => {
  const originalDocument = globalThis.document;
  const listeners = new Map(); let page; let calls = 0;
  globalThis.document = { hidden: false, addEventListener: (event, fn) => listeners.set(event, fn), removeEventListener: (event) => listeners.delete(event) };
  try {
    page = mountStatus(async () => { calls++; return app(); }); await flush();
    globalThis.document.hidden = true;
    for (let i = 0; i < 3; i++) {
      const [id, callback] = [...page.timers][0]; page.timers.delete(id); callback(); await flush();
      assert.equal(calls, 1); assert.equal(page.timers.size, 1);
    }
    globalThis.document.hidden = false; listeners.get("visibilitychange")(); await flush();
    assert.equal(calls, 2);
  } finally {
    page?.unmount();
    if (originalDocument === undefined) delete globalThis.document; else globalThis.document = originalDocument;
  }
});

test("invalid token never calls the local API", async () => {
  let calls = 0; const page = mountStatus(async () => { calls++; return app(); }); await flush();
  page.value.value = "../../../orders"; await flush();
  assert.equal(calls, 1); assert.ok(page.state.error.value); page.unmount();
});

function component(path, mocks = {}) {
  const script = compileScript(parse(read(path), { filename: path }).descriptor, { id: path, inlineTemplate: true }).content;
  return evaluate(script, { vue, ...mocks }).default;
}
test("both Georgian choices are native disabled until enabled; selection and busy state render correctly", async () => {
  const Choice = component("app/components/common/BaseChoiceCard.vue");
  const Methods = component("app/components/commerce/CheckoutCredoPaymentMethods.vue", {
    "~/components/common/BaseChoiceCard.vue": { default: Choice },
  });
  const render = (props) => renderToString(vue.createSSRApp(Methods, props));
  const disabled = await render({ modelValue: "card" });
  assert.equal((disabled.match(/disabled/g) || []).length, 2);
  assert.match(disabled, /credo-ge.svg/); assert.match(disabled, /dayavi.svg/);
  const enabled = await render({ enabled: true, modelValue: "credo_dayavi" });
  assert.doesNotMatch(enabled, /disabled/); assert.match(enabled, /value="credo_dayavi" checked/);
  assert.match(enabled, /კრედოს გვერდზე/);
  const busy = await render({ enabled: true, disabled: true });
  assert.equal((busy.match(/disabled/g) || []).length, 2);
});

for (const [source, path] of [["cart", "app/pages/checkout/index.vue"], ["buy_now", "app/pages/buy-now/checkout.vue"]]) {
  test(`${source} actual submit uses one offer, quoted total and original idempotency key`, async () => {
    const ast = ts.createSourceFile("checkout.ts", parse(read(path)).descriptor.scriptSetup.content, ts.ScriptTarget.ES2022, true);
    const declaration = ast.statements.flatMap((s) => ts.isVariableStatement(s) ? [...s.declarationList.declarations] : [])
      .find((d) => d.name.getText(ast) === "submitForm");
    const calls = []; const key = "original-key"; const events = [];
    const refs = { value: false };
    const mocks = {
      validateSubmit: (fn) => fn, submitPending: refs, cartStore: { initialized: true, isEmpty: false, hasPriceChanges: false },
      buyNowStore: { hasSession: true, requiresConfirmation: false, isCheckoutAvailable: true, initialized: true },
      recordCheckoutProgress() {}, deliveryQuoteReady: { value: true }, deliveryQuoteError: { value: null },
      formError: { value: null }, setErrors() {}, trackAddPaymentInfo() {}, checkoutAnalyticsItems: { value: [] },
      buyNowCheckoutAnalyticsItems: { value: [] }, executeRecaptcha: async () => "captcha",
      buildCheckoutPayload: (v) => ({ payment_method: v.payment_method, delivery_quote_token: "signed-quote", personal_number: "00000000001" }),
      isCredoMethod: util.isCredoMethod, credoOfferForMethod: util.credoOfferForMethod, credoPaymentEnabled: { value: true },
      startCredoApplication: async (...args) => { calls.push(args); return app(); }, getOrCreateKey: () => key,
      syncProfileBackfill: async () => {}, openCredoApplication: async (value, redirect) => events.push([value, redirect]),
      scrollToSubmitFeedback() {},
    };
    const fn = evaluate("exports.submit = " + declaration.initializer.getText(ast), {}, mocks).submit;
    await fn({ payment_method: "credo_dayavi" });
    assert.equal(calls.length, 1); assert.equal(calls[0][0], source); assert.equal(calls[0][2], key);
    assert.equal(calls[0][1].payment_method, "credo"); assert.equal(calls[0][1].requested_offer, "dayavi");
    assert.equal(calls[0][1].delivery_quote_token, "signed-quote"); assert.equal(events[0][1], true);
  });
}




test("actual order success page never emits a Credo Purchase on signature, unknown or test funding", () => {
  const script = parse(read("app/pages/checkout/success/[token].vue")).descriptor.scriptSetup.content;
  const ast = ts.createSourceFile("success.ts", script, ts.ScriptTarget.ES2022, true);
  const declaration = ast.statements.flatMap((s) => ts.isVariableStatement(s) ? [...s.declarationList.declarations] : [])
    .find((d) => d.name.getText(ast) === "trackLoadedPurchase");
  const order = { value: null }; const events = [];
  const track = evaluate("exports.track = " + declaration.initializer.getText(ast), {}, {
    order, trackPurchase: (payload) => events.push(payload), purchaseAnalyticsItems: { value: [] },
  }).track;
  for (const purchase_eligible of [undefined, false]) {
    order.value = { payment_method: "credo", payment_status: "pending", order_number: "FD-REAL", total: "69.00", purchase_eligible };
    track();
  }
  assert.equal(events.length, 0);
  order.value.purchase_eligible = true; track();
  assert.equal(events.length, 1);
  assert.equal(events[0].transactionId, "FD-REAL");
  assert.equal(events[0].value, "69.00");
  assert.equal(events[0].paymentType, "credo");
});

function resultPage({ continueQuery = "1", source = "cart" } = {}) {
  const application = vue.ref(null);
  const route = vue.reactive({ params: { token }, path: `/checkout/credo/${token}`, query: continueQuery ? { continue: continueQuery } : {} });
  const navigations = []; const keys = [];
  const script = parse(read("app/pages/checkout/credo/[token].vue")).descriptor.scriptSetup.content;
  const module = evaluate(script + "; exports.restart = restartCheckout;", {
    "~/composables/commerce/useCheckoutIdempotency": { useCheckoutIdempotency: (kind) => ({ clearKey: () => keys.push(kind) }) },
    "~/composables/commerce/useCredoApplicationStatus": { useCredoApplicationStatus: () => ({ application, pending: vue.ref(false), error: vue.ref(null), refresh() {} }) },
    "~/utils/credoCheckout": util,
  }, {
    definePageMeta() {}, useSeoMeta() {}, useRoute: () => route, useGlobalStore: () => ({ currentUser: null }),
    navigateTo: async (destination, options) => {
      navigations.push([destination, options]);
      if (typeof destination === "object") route.query = destination.query || {};
    },
  });
  return { application, navigations, keys, ...module, source };
}
test("status page consumes legacy continue flag but keeps the local tab open", async () => {
  const page = resultPage();
  page.application.value = app("processing", { redirect_url: "https://ganvadeba.credo.ge/installment/test" }); await flush();
  assert.deepEqual(page.navigations[0], [{ path: `/checkout/credo/${token}`, query: {} }, { replace: true }]);
  assert.equal(page.navigations.length, 1);
  page.application.value = app("awaiting_signature", { redirect_url: "https://ganvadeba.credo.ge/installment/test" }); await flush();
  assert.equal(page.navigations.length, 1);
});
test("recovery and browser Back never automatically redirect to bank; unsafe links are rejected", async () => {
  const page = resultPage({ continueQuery: null });
  page.application.value = app("processing", { redirect_url: "https://ganvadeba.credo.ge/installment/test" }); await flush();
  assert.equal(page.navigations.length, 0);
  page.application.value = app("processing", { redirect_url: "https://attacker.test/installment/test" }); await flush();
  assert.equal(page.navigations.length, 0);
  const template = read("app/pages/checkout/credo/[token].vue");
  assert.match(template, /:href="redirectUrl" target="_blank" rel="noopener noreferrer"/);
  assert.match(template, /ახალ ჩანართში/);
});
for (const [source, keySource, destination] of [["cart", "cart", "/checkout"], ["buy_now", "buy-now", "/buy-now/checkout"]]) {
  test(`${source} restart clears its key only after server-confirmed rejection/cancellation`, async () => {
    const page = resultPage({ continueQuery: null });
    page.application.value = app("processing", { source, can_restart_checkout: false }); await flush();
    await page.restart(); assert.equal(page.keys.length, 0); assert.equal(page.navigations.length, 0);
    page.application.value = app("rejected", { source, can_restart_checkout: true }); await flush();
    await page.restart(); assert.deepEqual(page.keys, [keySource]); assert.equal(page.navigations[0][0], destination);
  });
}

test("trusted signature opens order details automatically but review and malformed order tokens cannot", async () => {
  const page = resultPage({ continueQuery: null });
  page.application.value = app("awaiting_signature", { order_public_token: other }); await flush();
  page.application.value = app("review", { order_public_token: other }); await flush();
  page.application.value = app("ready_to_ship", { ready_to_ship: true, order_public_token: "//attacker.test" }); await flush();
  assert.equal(page.navigations.length, 0);
  page.application.value = app("ready_to_ship", { ready_to_ship: true, order_public_token: other }); await flush();
  assert.deepEqual(page.navigations, [[`/checkout/success/${other}`, { replace: true }]]);
});

test("pending Credo order is never labelled paid", () => {
  const { useCommercePresentation } = evaluate(read("app/composables/commerce/useCommercePresentation.ts"));
  const ui = useCommercePresentation();
  assert.equal(ui.getPaymentStatusLabel("pending", "credo"), "განვადება გაფორმებულია");
  assert.equal(ui.getPaymentStatusLabel("paid", "credo"), "განვადება გაფორმებულია");
  assert.equal(ui.getPaymentStatusLabel("paid", "card"), "გადახდილია");
  assert.equal(ui.getPaymentStatusLabel("cancelled", "credo"), "გადახდა გაუქმებულია");
});
