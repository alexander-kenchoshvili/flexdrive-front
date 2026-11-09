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

function mountForm({ source = "cart", owner = null, ready = vue.ref(true),
  regions = [{ id: 4, name: "აჭარა" }], citiesFor, quoteFor } = {}) {
  const store = vue.reactive({ currentUser: owner, authResolved: true });
  const quotes = [];
  const profile = vue.ref(null);
  const api = {
    getDeliveryRegions: async () => ({ provider: "wingo", results: regions }),
    getDeliveryCities: async (regionId) => ({ provider: "wingo", region: { id: regionId },
      results: citiesFor ? await citiesFor(regionId) : [{ id: 4, name: "ბათუმი" }] }),
    getDeliveryQuote: async (payload) => {
      quotes.push(payload);
      return quoteFor ? await quoteFor(payload) : { provider: "wingo", delivery_type_id: 1,
        region_id: payload.delivery_region_id, city_id: payload.delivery_city_id, customer_delivery_price: "49.00" };
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
      data: key.endsWith("delivery-regions") ? vue.ref({ provider: "wingo", results: regions }) : profile,
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
  current.form.setFieldValue("company_is_vat_registered", false, false);
  current.form.setFieldValue("phone", "555123456", false);
  current.form.setFieldValue("address_line", "მისამართი 1", false);
  current.form.setFieldValue("delivery_region_id", 4, false);
  await flush();
  current.form.setFieldValue("city", "ბათუმი", false);
  await flush();
  current.app.unmount();

  const ready = vue.ref(false);
  current = mountForm({ ready });
  await flush();
  assert.equal(current.form.buyerType.value, "legal_entity");
  assert.equal(current.form.companyName.value, "ტესტი");
  assert.equal(current.form.companyIsVatRegistered.value, false);
  assert.equal(current.form.phone.value, "555123456");
  assert.equal(current.form.addressLine.value, "მისამართი 1");
  assert.equal(current.form.deliveryCityId.value, 4);
  assert.equal(current.form.values.city, "ბათუმი");
  assert.equal(current.quotes.length, 0);
  ready.value = true;
  await flush();
  assert.deepEqual(current.quotes, [{ source: "cart", delivery_region_id: 4, delivery_city_id: 4 }]);
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

test("company VAT choice requires an explicit answer only for legal buyers", () => {
  const { useCommerceValidationSchemas } = loadTs("../app/composables/useCommerceValidationSchemas.ts");
  const { checkoutSchema } = useCommerceValidationSchemas();
  const values = {
    buyer_type: "legal_entity", company_name: "Test LLC", company_identification_code: "123456789",
    company_is_vat_registered: null, first_name: "Test", last_name: "Buyer", email: "",
    phone: "555123456", delivery_region_id: 4, delivery_city_id: 4, city: "ბათუმი",
    address_line: "Address 1", note: "", terms_accepted: true, payment_method: "card",
  };
  const missing = checkoutSchema.safeParse(values);
  assert.equal(missing.success, false);
  assert.deepEqual(missing.error.issues.map((issue) => issue.path), [["company_is_vat_registered"]]);
  for (const answer of [true, false]) {
    assert.equal(checkoutSchema.safeParse({ ...values, company_is_vat_registered: answer }).success, true);
    assert.equal(draft.sanitizeCheckoutDraft({ company_is_vat_registered: answer }).company_is_vat_registered, answer);
  }
  assert.equal(checkoutSchema.safeParse({ ...values, buyer_type: "individual" }).success, true);
  assert.equal(checkoutSchema.safeParse({ ...values, company_is_vat_registered: "false" }).success, false);
});


function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}
const standardQuote = (payload, amount = "49.00") => ({
  provider: "wingo", delivery_type_id: 1, customer_delivery_price: amount,
  region_id: payload.delivery_region_id, city_id: payload.delivery_city_id,
});
const twoRegions = [{ id: 4, name: "აჭარა" }, { id: 11, name: "თბილისი" }];

test("late localities from a previous region cannot replace the current selection", async () => {
  storage.clear();
  const old = deferred();
  const current = mountForm({ regions: twoRegions,
    citiesFor: (id) => id === 4 ? old.promise : [{ id: 1100, name: "თბილისი" }],
  });
  await flush();
  current.form.setFieldValue("delivery_region_id", 4, false);
  await flush();
  current.form.setFieldValue("delivery_region_id", 11, false);
  await flush();
  old.resolve([{ id: 400, name: "ბათუმი" }]);
  await flush();
  assert.deepEqual(current.form.deliveryCityOptions.value, [{ value: 1100, label: "თბილისი" }]);
  assert.equal(current.form.deliveryCityId.value, 1100);
  assert.equal(current.form.city.value, "თბილისი");
  assert.deepEqual(current.quotes, [{ source: "cart", delivery_region_id: 11, delivery_city_id: 1100 }]);
  current.app.unmount();
});

test("late price for an old region cannot replace the new standard quote", async () => {
  storage.clear();
  const old = deferred();
  let oldPayload;
  const current = mountForm({ regions: twoRegions,
    citiesFor: (id) => [{ id: id * 100, name: id === 4 ? "ბათუმი" : "თბილისი" }],
    quoteFor: (payload) => {
      if (payload.delivery_region_id === 4) { oldPayload = payload; return old.promise; }
      return standardQuote(payload, "46.00");
    },
  });
  await flush();
  current.form.setFieldValue("delivery_region_id", 4, false);
  await flush();
  assert.equal(current.form.deliveryQuotePending.value, true);
  current.form.setFieldValue("delivery_region_id", 11, false);
  assert.equal(current.form.deliveryQuote.value, null);
  await flush();
  old.resolve(standardQuote(oldPayload, "55.00"));
  await flush();
  assert.equal(current.form.deliveryQuote.value.customer_delivery_price, "46.00");
  assert.equal(current.form.deliveryQuote.value.city_id, 1100);
  assert.equal(current.form.deliveryQuotePending.value, false);
  current.app.unmount();
});

test("clearing a region invalidates an outstanding locality response", async () => {
  storage.clear();
  const pending = deferred();
  const current = mountForm({ citiesFor: () => pending.promise });
  await flush();
  current.form.setFieldValue("delivery_region_id", 4, false);
  await flush();
  current.form.setFieldValue("delivery_region_id", null, false);
  pending.resolve([{ id: 400, name: "ბათუმი" }]);
  await flush();
  assert.equal(current.form.deliveryCityId.value, null);
  assert.equal(current.form.city.value, "");
  assert.deepEqual(current.form.deliveryCityOptions.value, []);
  assert.equal(current.quotes.length, 0);
  assert.equal(current.form.deliveryQuote.value, null);
  current.app.unmount();
});

test("multiple localities require selection and a previous city's late price is ignored", async () => {
  storage.clear();
  const old = deferred();
  let oldPayload;
  const current = mountForm({
    citiesFor: () => [{ id: 400, name: "ბათუმი" }, { id: 401, name: "ქობულეთი" }],
    quoteFor: (payload) => {
      if (payload.delivery_city_id === 400) { oldPayload = payload; return old.promise; }
      return standardQuote(payload, "55.00");
    },
  });
  await flush();
  current.form.setFieldValue("delivery_region_id", 4, false);
  await flush();
  assert.equal(current.form.deliveryCityId.value, null);
  assert.equal(current.quotes.length, 0);
  current.form.setFieldValue("delivery_city_id", 400, false);
  await flush();
  current.form.setFieldValue("delivery_city_id", 401, false);
  assert.equal(current.form.deliveryQuote.value, null);
  await flush();
  old.resolve(standardQuote(oldPayload, "99.00"));
  await flush();
  assert.equal(current.form.city.value, "ქობულეთი");
  assert.equal(current.form.deliveryQuote.value.city_id, 401);
  assert.equal(current.form.deliveryQuote.value.customer_delivery_price, "55.00");
  current.app.unmount();
});

test("legacy courier draft keeps contacts but never reuses overlapping delivery IDs", async () => {
  storage.clear();
  storage.set("flexdrive:checkout-draft:v1:cart", JSON.stringify({ owner: "guest", values: {
    delivery_region_id: 4, delivery_city_id: 4, city: "თბილისი", phone: "555123456", address_line: "Street 1",
  } }));
  const current = mountForm();
  await flush();
  assert.equal(current.form.phone.value, "555123456");
  assert.equal(current.form.addressLine.value, "Street 1");
  assert.equal(current.form.deliveryRegionId.value, null);
  assert.equal(current.form.deliveryCityId.value, null);
  assert.equal(current.form.city.value, "");
  assert.equal(current.quotes.length, 0);
  current.app.unmount();
});

test("a removed locality in a Wingo draft requires a new selection", async () => {
  storage.clear();
  draft.writeCheckoutDraft("cart", "guest", { delivery_region_id: 4, delivery_city_id: 999, city: "Old place" });
  const current = mountForm({ citiesFor: () => [{ id: 400, name: "ბათუმი" }, { id: 401, name: "ქობულეთი" }] });
  await flush();
  assert.equal(current.form.deliveryRegionId.value, 4);
  assert.equal(current.form.deliveryCityId.value, null);
  assert.equal(current.form.city.value, "");
  assert.equal(current.quotes.length, 0);
  current.app.unmount();
});

test("a fast-service or mismatched quote cannot become the checkout price", async () => {
  for (const change of [{ delivery_type_id: 2 }, { provider: "redcap" }, { city_id: 999 }]) {
    storage.clear();
    const current = mountForm({ quoteFor: (payload) => ({ ...standardQuote(payload), ...change }) });
    await flush();
    current.form.setFieldValue("delivery_region_id", 4, false);
    await flush();
    assert.equal(current.form.deliveryQuote.value, null);
    assert.ok(current.form.deliveryQuoteError.value);
    assert.equal(current.form.deliveryQuotePending.value, false);
    current.app.unmount();
  }
});

test("failed locality loading can be retried without preserving an old price", async () => {
  storage.clear();
  let attempts = 0;
  const current = mountForm({ citiesFor: () => {
    if (++attempts === 1) throw new Error("temporary test failure");
    return [{ id: 400, name: "ბათუმი" }];
  } });
  await flush();
  current.form.setFieldValue("delivery_region_id", 4, false);
  await flush();
  assert.ok(current.form.deliveryLocationsError.value);
  assert.equal(current.form.deliveryQuote.value, null);
  await current.form.retryDeliveryLocations();
  await flush();
  assert.equal(current.form.deliveryLocationsError.value, null);
  assert.equal(current.form.deliveryCityId.value, 400);
  assert.equal(current.form.deliveryQuote.value.delivery_type_id, 1);
  current.app.unmount();
});
