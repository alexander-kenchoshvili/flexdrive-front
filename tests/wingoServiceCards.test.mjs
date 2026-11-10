import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
const require = createRequire(import.meta.url);
const vue = require("vue");
const ts = require("typescript");
const { parse, compileScript } = require("@vue/compiler-sfc");
const { renderToString } = require("vue/server-renderer");
const cache = new Map();
const stub = vue.defineComponent({ setup: (_, { slots }) => () => vue.h("span", slots.default?.()) });
function component(name) {
  if (cache.has(name)) return cache.get(name);
  const path = `../app/${name}`;
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = compileScript(parse(source, { filename: path }).descriptor, { id: name, inlineTemplate: true }).content;
  const code = ts.transpileModule(compiled, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  new Function("require", "exports", ...Object.keys(vue), code)((key) => {
    if (key === "vue") return vue;
    if (key.endsWith("BaseChoiceCard.vue")) return { default: component("components/common/BaseChoiceCard.vue") };
    if (key.endsWith(".vue")) return { default: stub };
    if (key.includes("useCatalogPlaceholderMedia")) return { useCatalogPlaceholderMedia: () => ({ cardPlaceholderImage: null }) };
    if (key.includes("useCommercePresentation")) {
      const source = readFileSync(new URL("../app/composables/commerce/useCommercePresentation.ts", import.meta.url), "utf8");
      const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
      const module = {};
      new Function("require", "exports", ...Object.keys(vue), code)(require, module, ...Object.values(vue));
      return module;
    }
    if (key.includes("checkoutVat")) return { calculateIncludedCheckoutVat: () => null };
    return require(key);
  }, exports, ...Object.values(vue));
  cache.set(name, exports.default);
  return exports.default;
}
async function render(name, props) {
  const app = vue.createSSRApp({ render: () => vue.h(component(name), props) });
  app.component("NuxtLink", stub);
  return renderToString(app);
}
const options = [
  { service_slug: "standard", delivery_type_id: 1, label: "სტანდარტული მიტანა", price: "46.00", available: true,
    estimate_label: "1–2 სამუშაო დღეში", estimated_delivery_date: "2026-11-10" },
  { service_slug: "fast", delivery_type_id: 2, label: "სწრაფი მიტანა", price: "83.00", available: true,
    estimate_label: "დღეს, 9 ნოემბერი", estimated_delivery_date: "2026-11-09", checkout_deadline_at: "2026-11-09T12:30:00+04:00" },
];
test("actual delivery cards expose native choices, prices and agreed simple timing copy", async () => {
  const html = await render("components/commerce/CheckoutDeliveryOptions.vue", { modelValue: "fast", options });
  assert.equal((html.match(/type="radio"/g) || []).length, 2);
  assert.equal((html.match(/name="delivery_service_slug"/g) || []).length, 2);
  assert.match(html, /value="fast" checked/);
  assert.match(html, /46.00 ₾/);
  assert.match(html, /83.00 ₾/);
  assert.match(html, /12:30-მდე/);
  assert.match(html, /12:30-მდე გაფორმებულ შეკვეთას მომდევნო სამუშაო დღეს მიიღებთ, ხოლო 12:30-დან — ორ სამუშაო დღეში/);
  assert.match(html, /12:30-მდე გაფორმებულ შეკვეთას იმავე დღეს მოგაწვდით, ხოლო 12:30-დან — მომდევნო სამუშაო დღეს/);
  assert.equal((html.match(/ვადები ითვლება სამუშაო დღეებით/g) || []).length, 1);
  assert.match(html, /შაბათსა და კვირას მიწოდება არ ხორციელდება/);
  assert.doesNotMatch(html, /სავარაუდო|დღეს, 9 ნოემბერი/);
});
test("unavailable fast tariff is disabled with its actual reason", async () => {
  const html = await render("components/commerce/CheckoutDeliveryOptions.vue", { modelValue: "standard", options: [options[0],
    { ...options[1], available: false, unavailable_reason: "სწრაფი მიტანის ტარიფი მიუწვდომელია" }] });
  assert.match(html, /value="fast"[^>]*disabled/);
  assert.match(html, /სწრაფი მიტანის ტარიფი მიუწვდომელია/);
  assert.doesNotMatch(html, /დღეს, 9 ნოემბერი/);
});
test("region standard remains a single choice and pending price is not an old payable amount", async () => {
  const html = await render("components/commerce/CheckoutDeliveryOptions.vue", { modelValue: "standard", options: [{ ...options[0], estimate_label: "3–5 სამუშაო დღეში, მარშრუტის გრაფიკის მიხედვით" }], pending: true });
  assert.equal((html.match(/type="radio"/g) || []).length, 1);
  assert.match(html, /ითვლება/);
  assert.doesNotMatch(html, /46.00 ₾/);
  assert.match(html, /3–5 სამუშაო დღეში/);
  assert.doesNotMatch(html, /12:30|სავარაუდო/);
});
test("payment choices reuse the same native card and keep their own radio group", async () => {
  const html = await render("components/commerce/CheckoutPaymentMethodCard.vue", { method: "card", title: "ბარათით გადახდა", selected: true, brands: ["Visa"] });
  assert.match(html, /type="radio"[^>]*name="payment_method"[^>]*value="card" checked/);
  assert.match(html, /Visa/);
});
test("checkout summary shows selected service and fee without duplicating the estimate", async () => {
  const html = await render("components/commerce/CheckoutSummaryCard.vue", { items: [], itemCount: 0,
    subtotal: "100.00", total: "183.00", deliveryPrice: "83.00", deliveryLabel: "სწრაფი მიტანა" });
  assert.match(html, /სწრაფი მიტანა/);
  assert.match(html, /83.00/);
  assert.match(html, /183.00/);
  assert.doesNotMatch(html, /სავარაუდო მიწოდება/);
});
test("success summary preserves the paid delivery fee instead of labelling it free", async () => {
  const html = await render("components/commerce/CheckoutSuccessSummary.vue", { order: {
    public_token: "test-token", order_number: "TEST", status: "confirmed", payment_method: "card", payment_status: "paid",
    created_at: "2026-11-09T07:00:00Z", items: [], subtotal: "100.00", total: "183.00", delivery_price: "83.00",
    delivery_summary: { label: "სწრაფი მიტანა", estimate_label: "დღეს, 9 ნოემბერი" },
  } });
  assert.match(html, /სწრაფი მიტანა/);
  assert.match(html, /83.00 GEL/);
  assert.doesNotMatch(html, />უფასო</);
});

test("profile detail shows the frozen service and paid delivery price", async () => {
  const html = await render("components/profile/ProfileOrderDetail.vue", { order: {
    public_token: "test-token", order_number: "TEST", status: "confirmed", payment_method: "card", payment_status: "paid",
    created_at: "2026-11-09T07:00:00Z", items: [], subtotal: "100.00", total: "183.00", delivery_price: "83.00",
    delivery_summary: { label: "სწრაფი მიტანა", estimate_label: "დღეს, 9 ნოემბერი" },
  } });
  assert.match(html, /სწრაფი მიტანა/);
  assert.match(html, /83.00 GEL/);
  assert.doesNotMatch(html, />უფასო</);
});

test("after-cutoff fast remains selectable and shows next working day", async () => {
  const html = await render("components/commerce/CheckoutDeliveryOptions.vue", {
    modelValue: "fast", options: [options[0], { ...options[1],
      estimate_label: "მომდევნო სამუშაო დღეს — სამშაბათი, 10 ნოემბერი",
      estimated_delivery_date: "2026-11-10", checkout_deadline_at: "2026-11-10T12:30:00+04:00" }],
  });
  assert.match(html, /value="fast" checked/);
  assert.doesNotMatch(html, /value="fast"[^>]*disabled/);
  assert.match(html, /მომდევნო სამუშაო დღეს/);
  assert.match(html, /12:30-მდე გაფორმებულ შეკვეთას იმავე დღეს მოგაწვდით, ხოლო 12:30-დან — მომდევნო სამუშაო დღეს/);
  assert.match(html, /83.00 ₾/);
});
