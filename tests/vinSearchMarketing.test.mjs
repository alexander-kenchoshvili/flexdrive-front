import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
const require = createRequire(import.meta.url), vue = require("vue"), ts = require("typescript");
const output = ts.transpileModule(readFileSync(new URL("../app/composables/useMetaMarketing.ts", import.meta.url), "utf8").replaceAll("import.meta.client", "true"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function tracker(t, options = {}) {
  const consent = vue.ref(options.consent ?? true), user = vue.ref(options.staff ? { id: 1 } : null);
  const calls = [], timers = new Map(); let serial = 0;
  const pixel = (...args) => { calls.push(args); if (options.error) throw new Error("blocked"); };
  const window = { location: { hostname: options.host || "flexdrive.ge", pathname: options.path || "/" }, ...(options.delayed ? {} : { fbq: pixel }) };
  const globals = { ...vue, window, localStorage: { getItem: () => options.internal ? "1" : null },
    useCookieConsent: () => ({ trackingConsentGranted: consent }), useBusinessAuth: () => ({ user }),
    useRuntimeConfig: () => ({ public: { gtmId: options.gtmId ?? "GTM-MVNFL9TH" } }),
    setTimeout: (fn) => { const id = ++serial; timers.set(id, fn); return id; }, clearTimeout: (id) => timers.delete(id),
  };
  const exports = {}, scope = vue.effectScope(); t.after(() => scope.stop());
  const api = scope.run(() => {
    new Function("require", "exports", ...Object.keys(globals), output)((name) => name.includes("trackingHost")
      ? { isProductionTrackingHost: (host) => host === "flexdrive.ge" }
      : name.includes("searchAnalytics") ? { normalizeSearchAnalyticsTerm: (term) => term.replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[email]").trim() } : { isBusinessPath: (path) => path.startsWith("/business") }, exports, ...Object.values(globals));
    const api = exports.useMetaMarketing(); return { ...api, track: api.trackVinSearch };
  });
  return { ...api, calls, consent, user, window, timers, pixel, scope, tick: () => {
    const batch = [...timers.values()]; timers.clear(); batch.forEach((fn) => fn());
  } };
}
const result = { status: "matched", vehicle: { make: "Toyota", model: "Prius", year: 2015 },
  filters: { make: "toyota", model: "prius", year: "2015" }, interest_token: "private-signed-token", vin: "private-vin" };

test("Search sends only decoded public vehicle attributes, never VIN, token or customer context", (t) => {
  const x = tracker(t); x.track(result);
  assert.deepEqual(x.calls, [["track", "Search", { search_string: "Toyota Prius 2015", search_type: "vin",
    vehicle_make: "Toyota", vehicle_model: "Prius", vehicle_year: 2015, vin_outcome: "matched" }]]);
});
test("consent, production configuration and internal traffic guards prevent sending", (t) => {
  for (const options of [{ consent: false }, { host: "localhost" }, { staff: true }, { internal: true }, { path: "/business/vehicle-demand" }, { gtmId: "" }]) {
    const x = tracker(t, options); x.track(result); assert.equal(x.calls.length, 0); assert.equal(x.timers.size, 0);
  }
});
test("unavailable, invalid and unrecognized VINs do not count; decoded gaps retain distinct outcomes", (t) => {
  const x = tracker(t);
  for (const status of ["invalid_vin", "unrecognized", "unavailable"]) x.track({ status });
  assert.equal(x.calls.length, 0);
  for (const status of ["no_coverage", "not_in_catalog"]) x.track({ ...result, status });
  assert.deepEqual(x.calls.map((c) => c[2].vin_outcome), ["no_coverage", "not_in_catalog"]);
});
test("early successful search waits for existing GTM Pixel queue and sends once", (t) => {
  const x = tracker(t, { delayed: true }); x.track(result); x.tick(); assert.equal(x.calls.length, 0);
  x.window.fbq = x.pixel; x.tick(); x.tick(); assert.equal(x.calls.length, 1); assert.equal(x.timers.size, 0);
});
test("revocation discards pending searches without replay; teardown clears retries", (t) => {
  const x = tracker(t, { delayed: true }); x.track(result); x.consent.value = false;
  assert.equal(x.timers.size, 0); x.window.fbq = x.pixel; x.consent.value = true; x.tick(); assert.equal(x.calls.length, 0);
  delete x.window.fbq; x.track(result); assert.equal(x.timers.size, 1); x.scope.stop(); assert.equal(x.timers.size, 0);
});
test("Pixel errors cannot interrupt shopping or cause duplicate retries", (t) => {
  const x = tracker(t, { error: true }); assert.doesNotThrow(() => x.track(result));
  x.tick(); assert.equal(x.calls.length, 1); assert.equal(x.timers.size, 0);
});

test("blocked GTM expires pending searches instead of retrying forever", (t) => {
  let now = Date.now(); t.mock.method(Date, "now", () => now);
  const x = tracker(t, { delayed: true }); x.track(result); assert.equal(x.timers.size, 1);
  now += 10001; x.tick(); assert.equal(x.timers.size, 0);
  x.window.fbq = x.pixel; x.tick(); assert.equal(x.calls.length, 0);
});

test("part search sends outcome/count and safe term; private-looking terms are omitted", (t) => {
  const x = tracker(t); x.trackPartSearch("კაპოტი", 4); x.trackPartSearch("რადიატორი", 0);
  assert.deepEqual(x.calls[0], ["track", "Search", { search_type: "part", search_result_count: 4, search_outcome: "results", search_string: "კაპოტი" }]);
  assert.equal(x.calls[1][2].search_outcome, "no_results");
  for (const term of ["buyer@example.com", "1HGCM82633A004352", "+995 555 11 22 33"]) {
    x.trackPartSearch(term, 0); assert.equal(x.calls.at(-1)[2].search_string, undefined);
  }
});
test("Contact has no submitted message/customer data and respects consent", (t) => {
  const x = tracker(t); x.trackContact({ email: "private@example.com", message: "private" });
  assert.deepEqual(x.calls, [["track", "Contact", { contact_method: "website_form" }]]);
  x.consent.value = false; x.trackContact(); x.trackPartSearch("კაპოტი", 1); assert.equal(x.calls.length, 1);
});
