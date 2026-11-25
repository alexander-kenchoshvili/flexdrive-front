import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
const require = createRequire(import.meta.url), ts = require("typescript"), vue = require("vue");
const { parse, compileScript } = require("@vue/compiler-sfc"), { renderToString } = require("@vue/server-renderer");
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const execute = (source, globals = {}, mocks = {}) => {
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  return new Function("require", "exports", ...Object.keys(globals), `${outputText}\nreturn exports;`)((name) => mocks[name] ?? require(name), {}, ...Object.values(globals));
};
const utils = {};
for (const name of ["businessReport", "businessAnalytics", "businessMarketing", "businessRouting", "businessDecisions", "businessInsights", "httpError"]) {
  const mocks = Object.fromEntries(Object.entries(utils).flatMap(([key, value]) => [[key, value], ["./" + key.split("/").pop(), value]]));
  utils[`~/utils/${name}`] = execute(read(`app/utils/${name}.ts`), {}, mocks);
}
const state = (value) => ({ report: vue.ref(value), loading: vue.ref(false), errorMessage: vue.ref(""), load() {} });
const period = { start: "2026-11-01", end: "2026-11-25" };
const render = async (name, props, resources = {}) => {
  const { descriptor } = parse(read(`app/components/business/${name}.vue`));
  const source = compileScript(descriptor, { id: name, inlineTemplate: true }).content;
  const resource = (endpoint) => state(resources[endpoint] ?? null);
  const component = execute(source, { ...vue, shallowRef: (value) => vue.shallowRef(name === "BusinessCheckout" && resources.checkout ? resources.checkout : value), ref: (value) => vue.ref(name === "BusinessCheckout" && value === undefined ? resources.checkout?.detail?.id : value), useBusinessAuth: () => ({ user: vue.ref({ id: 1 }) }), $fetch: { create: () => async () => resources.checkout }, useRoute: () => ({ path: "/business/carts", query: period, hash: "" }), useApiBaseUrl: () => "https://api.flexdrive.ge/api", useBusinessAnalytics: () => state(resources.google), useBusinessMarketing: () => state(resources.meta), navigateTo() {} }, { ...utils, "~/composables/useBusinessResource": { useBusinessResource: resource } }).default;
  const app = vue.createSSRApp(component, props);
  app.component("NuxtLink", { props: ["to"], setup: (p, { slots }) => () => vue.h("a", { href: p.to.path || p.to }, slots.default?.()) });
  app.component("BaseButton", { setup: (_, { slots }) => () => vue.h("button", slots.default?.()) });
  return renderToString(app);
};

test("navigation preserves legacy URLs, safe returns and explicit source groups", () => {
  const routing = utils["~/utils/businessRouting"];
  assert.equal(routing.BUSINESS_SECTIONS[0].key, "overview");
  for (const path of ["/business", "/business/checkout", "/business/payments", "/business/carts", "/business/users", "/business/google-search", "/business/marketing", "/business/meta-events", "/business/social", "/business/diagnostics"]) assert.equal(routing.businessReturnPath(path), path);
  assert.equal(routing.businessReturnPath("/business/unknown"), "/business");
  assert.ok(routing.BUSINESS_GROUPS.find((group) => group.label === "ჩვენი მაღაზია").keys.includes("payments"));
  assert.deepEqual(routing.BUSINESS_GROUPS.find((group) => group.label === "Google").keys, ["users", "google-search"]);
  assert.deepEqual(routing.BUSINESS_GROUPS.find((group) => group.label === "Meta").keys, ["marketing", "meta-events", "social"]);
});

test("campaigns use objective-specific results, preserve money units and escape names", async () => {
  const metrics = { spend: "20.00", impressions: 100, clicks: 10, reach: 80, website_purchases: "2", website_purchase_value: "60.00", link_clicks: "6", landing_page_views: "4" };
  const html = await render("BusinessCampaigns", { ads: { status: "ready", currency: "USD", timezone: "Asia/Tbilisi", campaign_metadata_status: "ready", campaigns: [
    { ...metrics, id: "1", name: '<script>private</script>', objective: "OUTCOME_SALES", effective_status: "PAUSED" },
    { ...metrics, id: "2", name: "Traffic", objective: "OUTCOME_TRAFFIC", effective_status: "ACTIVE" },
    { ...metrics, id: "3", name: "Unknown", objective: null, effective_status: null },
  ] } });
  for (const text of ["გაყიდვები", "ვიზიტები", "შეძენები · Meta", "გვერდის ჩატვირთვები", "მიზანი უცნობია", "სტატუსი უცნობია", "ROAS", "USD", "—"]) assert.ok(html.includes(text), text);
  assert.ok(html.includes("&lt;script&gt;")); assert.ok(!html.includes("<script>private"));
});

test("cart views retain quantity, source distinctions, unknown order links and admin detail", async () => {
  const base = { status: "ready", note: "მიმდინარე შიგთავსი", generated_at: "2026-11-25T06:00:00Z", total: 1, page: 1, pages: 1 };
  const current = await render("BusinessCartReport", { period, mode: "contents" }, { "/business/carts/": { ...base, rows: [{ id: 7, owner: "ანგარიშის კალათა", owner_account: { id: 12, name: "<b>ანა</b>", email: "ana@example.com" }, updated_at: base.generated_at, products: 6, units: 8, remaining: 1, items: [{ name: "Part", sku: "FD-01-0001", quantity: 3 }] }] } });
  assert.ok(current.includes("FD-01-0001")); assert.ok(current.includes("× 3")); assert.ok(current.includes("https://api.flexdrive.ge/manager-fd/commerce/cart/7/change/"));
  assert.ok(current.includes("მფლობელი:")); assert.ok(current.includes("ana@example.com"));
  assert.ok(current.includes("&lt;b&gt;ანა&lt;/b&gt;")); assert.ok(!current.includes("<b>ანა</b>"));
  const guest = await render("BusinessCartReport", { period, mode: "contents" }, { "/business/carts/": { ...base, rows: [{ id: 8, owner: "სტუმრის კალათა — ვინაობა უცნობია", owner_account: null, products: 1, units: 1, remaining: 0, items: [] }] } });
  assert.ok(guest.includes("ვინაობა უცნობია")); assert.ok(!guest.includes("მფლობელი:"));
  const additions = await render("BusinessCartReport", { period, mode: "additions" }, { "/business/carts/": { ...base, totals: { additions: 2, units: 5, carts: 1 }, rows: [{ id: 1, at: base.generated_at, name: '<img src=x>', sku: "FD-01-0001", quantity: 2, later_order: null }] } });
  assert.ok(additions.includes("კავშირი ვერ დადასტურდა")); assert.ok(additions.includes("განსხვავებული კალათები")); assert.ok(additions.includes("&lt;img"));
});

test("overview has six linked metrics, a maximum of three facts and source labels", async () => {
  const html = await render("BusinessOverview", { period, shop: { summary: { paid_orders: 1, product_received: "60.00", refunded: "1.00", received: "69.00", refunded_orders: 1 }, previous: {}, comparisons: {}, payment_attention: 4 } }, {
    google: { status: "ready", summary: { sessions: 20 }, search: { status: "ready", no_results: 3 } },
    meta: { status: "partial", ads: { status: "ready", currency: "USD", summary: { spend: "34.27" } } },
    "/business/audience/": { status: "ready", new_users: 12 },
  });
  for (const text of ["დადასტურებული შეკვეთები", "პროდუქტების გაყიდვები", "ახალი მომხმარებლები", "ვიზიტები", "რეკლამის ხარჯი", "საყურადღებო გადახდები", "ჩვენი ბაზა", "Google Analytics", "Meta"]) assert.ok(html.includes(text), text);
  assert.ok(html.includes('/business/payments'));
  assert.equal((html.match(/<li /g) || []).length, 3);
  assert.equal((html.match(/<h3 class="mt-2 text-sm font-semibold"/g) || []).length, 6);
});

test("audience preserves overlapping new/returning totals and missing-data distinction", async () => {
  const html = await render("BusinessAudience", { period }, { "/business/audience/": { status: "ready", new_users: 3, returning_users: 2, first_sources: [{ source: "fb / paid", new_users: 3 }], daily: [{ date: "2026-11-25", new_users: 3, returning_users: 2 }] } });
  assert.ok(html.includes("ჯგუფებსა და დღიურ უნიკალურ მომხმარებლებს არ ვაჯამებთ")); assert.ok(html.includes("fb / paid"));
  const missing = await render("BusinessAudience", { period }, { "/business/audience/": { status: "unavailable", message: "მიუწვდომელია", fetched_at: null } });
  assert.ok(missing.includes("მიუწვდომელია")); assert.ok(!missing.includes("<table"));
});

test("all new report templates and typed scripts compile without a full Nuxt build", () => {
  for (const name of ["BusinessMetaEvents", "BusinessCheckout", "BusinessAudience", "BusinessOverview", "BusinessCartReport", "BusinessCarts", "BusinessCampaigns", "BusinessDiagnostics", "BusinessDiagnosticsStatus", "BusinessGoogleSearch", "BusinessPeriodPage", "BusinessSocial", "BusinessTabs", "BusinessUsers", "BusinessMarketing"]) {
    const { descriptor, errors } = parse(read(`app/components/business/${name}.vue`));
    assert.deepEqual(errors, []);
    if (descriptor.scriptSetup) assert.ok(compileScript(descriptor, { id: name, inlineTemplate: true }).content);
    else assert.ok(descriptor.template);
  }
});


test("cart observation requires consent, production host and external traffic", async () => {
  const source = read("app/composables/commerce/useCommerceApi.ts").replaceAll("import.meta.client", "true").replaceAll("import.meta.server", "false");
  for (const scenario of [
    { consent: true, host: "flexdrive.ge", expected: true },
    { consent: false, host: "flexdrive.ge" },
    { consent: true, host: "preview.flexdrive.ge" },
    { consent: true, host: "flexdrive.ge", internal: true },
    { consent: true, host: "flexdrive.ge", business: true },
  ]) {
    const requests = [];
    const api = execute(source, {
      useCookieConsent: () => ({ analyticsConsentGranted: { value: scenario.consent }, marketingConsentGranted: { value: false } }),
      useBusinessAuth: () => ({ user: { value: scenario.business ? { id: 1 } : null } }),
      window: { location: { hostname: scenario.host } },
      localStorage: { getItem: () => scenario.internal ? "1" : null },
      globalThis: { crypto: { randomUUID: () => "observation-id" } },
    }, {
      "~/utils/trackingHost": { isProductionTrackingHost: (host) => host === "flexdrive.ge" },
      "~/utils/metaBrowserIdentifiers": { metaBrowserIdentifierHeaders: () => ({}) },
      "~/composables/apiFetch": { apiFetchRaw: async (path, options) => { requests.push({ path, ...options }); return {}; } },
    }).useCommerceApi();
    await api.addCartItem({ product_id: 7, quantity: 2 });
    assert.equal(requests.length, 1);
    assert.deepEqual(requests[0].body, { product_id: 7, quantity: 2, ...(scenario.expected ? { analytics_consent: true, analytics_event_id: "observation-id" } : {}) });
  }
});


test("Meta events show independent source counts and a denied response never becomes zero", async () => {
  const rows = [{ event: "Purchase", label: "შეძენის მოვლენა", browser: 2, server: 3 }];
  const html = await render("BusinessMetaEvents", {}, { "/business/meta-events/": { status: "ready", rows, sources: { browser: { status: "ready" }, server: { status: "ready" } } } });
  for (const label of ["ბრაუზერი · Pixel", "სერვერი · CAPI", "შეძენის მოვლენა", "რიცხვებს არ ვაჯამებთ", "დომენით გაფილტრული არ არის"]) assert.ok(html.includes(label), label);
  assert.match(html, /tabular-nums">2<\/td>/); assert.match(html, /tabular-nums">3<\/td>/);
  const denied = await render("BusinessMetaEvents", {}, { "/business/meta-events/": { status: "unavailable", rows: [{ ...rows[0], browser: null, server: null }], sources: { browser: { status: "unavailable", message: "წვდომა შესამოწმებელია" }, server: { status: "unavailable" } } } });
  assert.ok(denied.includes("ნულოვან მოვლენებს არ ნიშნავს")); assert.ok(denied.includes("წვდომა შესამოწმებელია"));
  assert.match(denied, /tabular-nums">—<\/td>/); assert.doesNotMatch(denied, /tabular-nums">0<\/td>/);
});

test("checkout highlights the final saved step and timestamp without inventing an exit reason", async () => {
  const html = await render("BusinessCheckout", {}, { checkout: {
    period, page: 1, pages: 1, limited: false,
    products: [{ id: 1, name: "ფარი", sku: "FD-01-0001", started: 1, unfinished: 1, counts: { open: 0, before_bank: 1, bank_pending: 0, bank_issue: 0, paid: 0, paid_later: 0 } }],
    detail: { id: 1, page: 1, pages: 1, cases: [{ started_at: "2026-11-20T06:00:00Z", source: "კალათით", quantity: 1, unit_price: "60.00", basket_subtotal: "60.00", payment_attempts: 0, result: "before_bank", label: "ბანკამდე შეჩერდა", reason: null, has_checkout_steps: true, steps_limited: false,
      steps: [{ at: "2026-11-20T06:00:00Z", label: "გაფორმების გვერდი გაიხსნა", kind: "step" }, { at: "2026-11-20T06:04:00Z", label: "მიტანის ფასი გამოჩნდა", kind: "step" }] }] },
  } });
  assert.match(html, /ბოლო აღრიცხული ნაბიჯი<\/p><p[^>]*>მიტანის ფასი გამოჩნდა/);
  assert.ok(html.includes('datetime="2026-11-20T06:04:00Z"'));
  assert.ok(html.includes("მიზეზი დაუდგენელია")); assert.ok(!html.includes("ბანკმა გადახდა უარყო"));
});
