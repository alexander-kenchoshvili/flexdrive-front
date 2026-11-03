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
  id: "redcap-checkout", inlineTemplate: true,
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
  props: ["name", "label", "modelValue", "options"],
  setup: (props) => () => vue.h("label", [props.label, vue.h("select", { name: props.name },
    props.options.map((option) => vue.h("option", { value: option.value }, option.label)))]),
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

const zones = [
  { value: 1, label: "თბილისი" }, { value: 6, label: "თბილისის შემოგარენი" },
  { value: 4, label: "რეგიონი (ქალაქები)" }, { value: 5, label: "რეგიონი (სოფლები)" },
  { value: 7, label: "რეგიონი (მაღალმთიანი)" },
];
const render = async (zone) => {
  const app = vue.createSSRApp({ render: () => vue.h(exports.default, {
    buyerType: "individual", companyName: "", companyIsVatRegistered: null,
    companyIdentificationCode: "", firstName: "Test", lastName: "Buyer", email: "", phone: "555000001",
    deliveryRegionId: zone, city: "ბათუმი", addressLine: "Test address", note: "",
    termsAccepted: false, paymentMethod: "card", deliveryRegionOptions: zones, errors: {},
  }) });
  app.component("NuxtLink", vue.defineComponent({ setup: (_, { slots }) => () => vue.h("a", slots.default?.()) }));
  return renderToString(app);
};

test("actual checkout renders one zone selection and a separate real destination field", async () => {
  const html = await render(4);
  assert.equal((html.match(/<select\b/g) || []).length, 1);
  assert.match(html, /name="city" value="ბათუმი"/);
  assert.match(html, /ქალაქი \/ სოფელი/);
  assert.match(html, /3–4 დღე/);
  assert.match(html, /RedCap/);
  assert.doesNotMatch(html, /EasyWay|name="delivery_city_id"|3 საათ/);
});

test("Tbilisi promise depends on processing and mountain estimates are qualified", async () => {
  for (const zone of [1, 6]) {
    const html = await render(zone);
    assert.match(html, /ზუსტი ვადა შეკვეთის დამუშავებისას დაზუსტდება/);
    assert.doesNotMatch(html, /13:00|3–4 დღე/);
  }
  assert.match(await render(7), /ვადა მიმართულების მიხედვით დაზუსტდება/);
});
