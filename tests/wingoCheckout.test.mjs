import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const vue = require("vue");
const ts = require("typescript");
const { parse, compileScript } = require("@vue/compiler-sfc");
const { renderToString } = require("vue/server-renderer");
const path = "../app/components/commerce/CheckoutFormSections.vue";
const source = readFileSync(new URL(path, import.meta.url), "utf8");
const compiled = compileScript(parse(source, { filename: path }).descriptor, {
  id: "wingo-checkout", inlineTemplate: true,
}).content;
const code = ts.transpileModule(compiled, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const field = vue.defineComponent({
  props: ["name", "label", "modelValue", "error", "hint"],
  setup: (props) => () => vue.h("label", [props.label,
    vue.h("input", { name: props.name, value: props.modelValue }), props.error, props.hint]),
});
const select = vue.defineComponent({
  props: ["name", "label", "modelValue", "options", "disabled", "error"],
  setup: (props) => () => vue.h("label", [props.label, vue.h("select", { name: props.name, disabled: props.disabled },
    props.options.map((option) => vue.h("option", { value: option.value, selected: option.value === props.modelValue }, option.label)))]),
});
const stub = vue.defineComponent({ render: () => null });
const exports = {};
new Function("require", "exports", ...Object.keys(vue), code)(
  (name) => name === "vue" ? vue : name.endsWith("BaseSelect.vue") ? { default: select }
    : name.endsWith("BaseInput.vue") ? { default: field }
      : name.endsWith(".vue") ? { default: stub }
        : name.includes("useCheckoutForm") ? { CHECKOUT_CASH_ON_DELIVERY_ENABLED: false } : require(name),
  exports, ...Object.values(vue),
);

const regions = [
  { value: 11, label: "თბილისი" }, { value: 12, label: "თბილისის შემოგარენი" },
  { value: 1, label: "აჭარა" }, { value: 4, label: "მცხეთა-მთიანეთი" },
];
const localities = [
  { value: 301, label: "ბათუმი" }, { value: 302, label: "ქობულეთი" },
];
const render = async ({ region = 1, city = 301, pending = false, buyerType = "individual" } = {}) => {
  const app = vue.createSSRApp({ render: () => vue.h(exports.default, {
    buyerType, personalNumber: "", companyName: "", companyIsVatRegistered: null,
    companyIdentificationCode: "", firstName: "Test", lastName: "Buyer", email: "", phone: "555000001",
    deliveryRegionId: region, deliveryCityId: city, addressLine: "Test address", note: "",
    termsAccepted: false, paymentMethod: "card", deliveryRegionOptions: regions,
    deliveryCityOptions: localities, deliveryCitiesPending: pending, errors: {},
  }) });
  app.component("NuxtLink", vue.defineComponent({ setup: (_, { slots }) => () => vue.h("a", slots.default?.()) }));
  return renderToString(app);
};

test("actual checkout uses two shared selects and keeps the street address separate", async () => {
  const html = await render();
  assert.equal((html.match(/<select\b/g) || []).length, 2);
  assert.match(html, /name="delivery_region_id"/);
  assert.match(html, /name="delivery_city_id"/);
  assert.match(html, /რეგიონი/);
  assert.match(html, /ქალაქი \/ სოფელი/);
  assert.match(html, /name="address_line" value="Test address"/);
  assert.doesNotMatch(html, /name="city"|name="delivery_type_id"|EasyWay|RedCap/);
});

test("selected region and locality remain distinct even when their IDs differ", async () => {
  const html = await render({ region: 1, city: 302 });
  const selected = html.match(/<option\b[^>]*\bselected[^>]*>/g) || [];
  assert.equal(selected.length, 2);
  assert.ok(selected.some((option) => option.includes('value="1"')));
  assert.ok(selected.some((option) => option.includes('value="302"')));
});

test("locality selection is disabled until a region is selected and while loading", async () => {
  for (const state of [{ region: null, city: null }, { pending: true }]) {
    const html = await render(state);
    assert.match(html, /<select name="delivery_city_id" disabled/);
  }
  assert.doesNotMatch(await render(), /<select name="delivery_city_id" disabled/);
});

test("personal number and waybill explanation appear only for individual buyers", async () => {
  const html = await render();
  assert.match(html, /name="personal_number"/);
  assert.match(html, /პირადი ნომერი გვჭირდება ტრანსპორტირების ზედნადების მოსამზადებლად/);
  assert.doesNotMatch(html, /name="company_identification_code"/);
  const legal = await render({ buyerType: "legal_entity" });
  assert.doesNotMatch(legal, /name="personal_number"/);
  assert.match(legal, /name="company_identification_code"/);
});

for (const page of ["checkout/index.vue", "buy-now/checkout.vue"]) {
  test(`${page} sends the personal number only for an individual and preserves payment and delivery fields`, () => {
    const text = readFileSync(new URL(`../app/pages/${page}`, import.meta.url), "utf8");
    const script = parse(text).descriptor.scriptSetup.content;
    const ast = ts.createSourceFile("checkout.ts", script, ts.ScriptTarget.ES2022, true);
    const statement = ast.statements.find((node) => ts.isVariableStatement(node)
      && node.declarationList.declarations.some((item) => item.name.getText(ast) === "buildCheckoutPayload"));
    assert.ok(statement);
    const compiled = ts.transpileModule(statement.getText(ast), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const build = new Function("deliveryQuote", compiled + "; return buildCheckoutPayload;")({ value: { quote_token: "quote-test" } });
    const values = { buyer_type: "individual", personal_number: "00000000001", company_name: "Company",
      company_identification_code: "012345678", company_is_vat_registered: false,
      first_name: "Test", last_name: "Buyer", email: "", phone: "555000001", delivery_region_id: 1,
      delivery_city_id: 2, delivery_service_slug: "standard", city: "თბილისი", address_line: "Street 1",
      terms_accepted: true, payment_method: "card", note: "" };
    const individual = build(values, "captcha-test");
    assert.equal(individual.personal_number, "00000000001");
    assert.equal(individual.company_identification_code, "");
    const legal = build({ ...values, buyer_type: "legal_entity" }, "captcha-test");
    assert.equal(legal.personal_number, "");
    assert.equal(legal.company_identification_code, "012345678");
    for (const payload of [individual, legal]) {
      assert.equal(payload.delivery_quote_token, "quote-test");
      assert.equal(payload.payment_method, "card");
      assert.equal(payload.recaptcha_token, "captcha-test");
      assert.equal(payload.terms_accepted, true);
    }
  });
}
