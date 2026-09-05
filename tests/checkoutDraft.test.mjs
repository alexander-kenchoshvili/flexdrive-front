import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const vue = require("vue");
const storage = new Map();
globalThis.sessionStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};

// Run the actual composable with Vue/vee-validate; replace only Nuxt and API boundaries.
function loadTs(path, mocks = {}, globals = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8")
    .replaceAll("import.meta.client", "true");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  new Function("require", "exports", ...Object.keys(globals), outputText)(
    (name) => mocks[name] ?? require(name), exports, ...Object.values(globals),
  );
  return exports;
}
const draft = loadTs("../app/utils/checkoutDraft.ts");
const renderer = vue.createRenderer({
  createComment: () => ({}), createText: () => ({}), createElement: () => ({}),
  insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {},
  parentNode: () => null, nextSibling: () => null,
});
const flush = async () => {
  for (let i = 0; i < 8; i++) await vue.nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
};

function mountForm({ source = "cart", owner = null, ready = vue.ref(true) } = {}) {
  const store = vue.reactive({ currentUser: owner, authResolved: true });
  const quotes = [];
  const profile = vue.ref(null);
  const api = {
    getDeliveryRegions: async () => ({ results: [{ id: 1, name: "აჭარა" }] }),
    getDeliveryCities: async () => ({ results: [{ id: 2, name: "ბათუმი" }] }),
    getDeliveryQuote: async (payload) => {
      quotes.push(payload);
      return { customer_delivery_price: "49.00" };
    },
  };
  const { useCheckoutForm } = loadTs("../app/composables/commerce/useCheckoutForm.ts", {
    "~/utils/checkoutDraft": draft,
    "@vee-validate/zod": { toTypedSchema: () => undefined },
    "~/composables/useAccountApi": { useAccountApi: () => ({ getProfile: async () => null }) },
    "~/composables/commerce/useCommerceApi": { useCommerceApi: () => api },
    "~/composables/useCommerceValidationSchemas": { useCommerceValidationSchemas: () => ({}) },
    "~/composables/commerce/errorUtils": { normalizeApiErrorMessage: () => "error" },
  }, {
    ...vue,
    useGlobalStore: () => store,
    useAsyncData: (key) => ({
      data: key.endsWith("delivery-regions") ? vue.ref({ results: [] }) : profile,
      pending: vue.ref(false), error: vue.ref(null), refresh: async () => {},
    }),
  });
  let form;
  const app = renderer.createApp({
    setup() {
      form = useCheckoutForm({ source, deliveryReady: () => ready.value });
      return () => null;
    },
  });
  app.mount({});
  return { form, app, quotes, profile, store };
}

test("refresh restores legal/individual drafts and recalculates delivery after cart loads", async () => {
  storage.clear();
  let current = mountForm();
  await flush();
  current.form.setFieldValue("buyer_type", "legal_entity", false);
  current.form.setFieldValue("company_name", "ტესტი", false);
  current.form.setFieldValue("phone", "555123456", false);
  current.form.setFieldValue("address_line", "მისამართი 1", false);
  current.form.setFieldValue("delivery_region_id", 1, false);
  await flush();
  current.form.setFieldValue("delivery_city_id", 2, false);
  await flush();
  current.app.unmount();

  const ready = vue.ref(false);
  current = mountForm({ ready });
  await flush();
  assert.equal(current.form.buyerType.value, "legal_entity");
  assert.equal(current.form.companyName.value, "ტესტი");
  assert.equal(current.form.phone.value, "555123456");
  assert.equal(current.form.addressLine.value, "მისამართი 1");
  assert.equal(current.form.deliveryCityId.value, 2);
  assert.equal(current.form.values.city, "ბათუმი");
  assert.equal(current.quotes.length, 0);
  ready.value = true;
  await flush();
  assert.deepEqual(current.quotes, [{ source: "cart", delivery_region_id: 1, delivery_city_id: 2 }]);
  assert.equal(current.form.deliveryQuote.value.customer_delivery_price, "49.00");
  assert.deepEqual(Object.keys(current.form.errors.value), []);

  // A late account prefill must not overwrite an intentionally blank draft field.
  current.profile.value = { first_name: "Profile name" };
  await flush();
  assert.equal(current.form.firstName.value, "");
  current.form.setFieldValue("buyer_type", "individual", false);
  current.app.unmount();
  current = mountForm();
  await flush();
  assert.equal(current.form.buyerType.value, "individual");
  assert.equal(current.form.addressLine.value, "მისამართი 1");
  current.form.clearFormDraft();
  current.form.setFieldValue("note", "Should not recreate a completed draft", false);
  assert.equal(draft.readCheckoutDraft("cart", "guest"), null);
  current.app.unmount();
});

test("source/owner isolation, buy-now restoration, malformed and unavailable storage", async () => {
  storage.clear();
  draft.writeCheckoutDraft("buy_now", "guest", { buyer_type: "legal_entity", company_name: "Company" });
  assert.equal(draft.readCheckoutDraft("cart", "guest"), null);
  const current = mountForm({ source: "buy_now" });
  await flush();
  assert.equal(current.form.buyerType.value, "legal_entity");
  current.app.unmount();
  assert.equal(draft.readCheckoutDraft("buy_now", "another-user"), null);
  assert.deepEqual(draft.sanitizeCheckoutDraft({
    buyer_type: "invalid", delivery_city_id: -1, total: "120", recaptcha_token: "private",
    phone: "555123456",
  }), { phone: "555123456" });
  storage.set("flexdrive:checkout-draft:v1:cart", "broken JSON");
  assert.equal(draft.readCheckoutDraft("cart", "guest"), null);
  draft.clearCheckoutDraft();
  assert.equal(storage.size, 0);
  const storageApi = globalThis.sessionStorage;
  delete globalThis.sessionStorage;
  assert.equal(draft.readCheckoutDraft("cart", "guest"), null);
  assert.doesNotThrow(() => draft.writeCheckoutDraft("cart", "guest", {}));
  assert.doesNotThrow(() => draft.clearCheckoutDraft());
  globalThis.sessionStorage = storageApi;
});
