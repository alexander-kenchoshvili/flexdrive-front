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
  props: ["name", "label", "modelValue", "error"],
  setup: (props) => () => vue.h("label", [props.label,
    vue.h("input", { name: props.name, value: props.modelValue }), props.error]),
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
const render = async ({ region = 1, city = 301, pending = false } = {}) => {
  const app = vue.createSSRApp({ render: () => vue.h(exports.default, {
    buyerType: "individual", companyName: "", companyIsVatRegistered: null,
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
