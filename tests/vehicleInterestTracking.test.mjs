import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
const require = createRequire(import.meta.url), vue = require("vue"), ts = require("typescript");
const output = ts.transpileModule(readFileSync(new URL("../app/composables/catalog/useVehicleInterestTracking.ts", import.meta.url), "utf8").replaceAll("import.meta.client", "true"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function tracker(t, options = {}) {
  const consent = vue.ref(options.consent ?? true), user = vue.ref(options.staff ? { id: 1 } : null), state = vue.ref(null);
  const storage = new Map(), calls = [];
  if (options.internal) storage.set("flexdrive-internal-traffic", "1");
  let now = 100000, serial = 0;
  const store = { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) };
  const globals = { ...vue, useCookieConsent: () => ({ analyticsConsentGranted: consent }), useBusinessAuth: () => ({ user }), useState: () => state,
    sessionStorage: store, localStorage: store, window: { location: { hostname: options.host || "flexdrive.ge" } },
    Date: { now: () => now }, globalThis: { crypto: { randomUUID: () => `00000000-0000-4000-8000-${String(++serial).padStart(12, "0")}` } },
  };
  const exports = {}, scope = vue.effectScope(); t.after(() => scope.stop());
  const api = scope.run(() => {
    new Function("require", "exports", ...Object.keys(globals), output)((name) => name.includes("trackingHost")
      ? { isProductionTrackingHost: (host) => host === "flexdrive.ge" }
      : { secureFetchRaw: async (...args) => { calls.push(args); if (options.fail) throw new Error("offline"); } }, exports, ...Object.values(globals));
    return exports.useVehicleInterestTracking();
  });
  return { ...api, calls, consent, state, storage, advance: (ms) => { now += ms; } };
}
const car = { make: "subaru", model: "forester", year: 2019, variant: "sport", result_count: 4 };

test("collection requires consent and production host and excludes internal staff/browser", async (t) => {
  for (const options of [{ consent: false }, { host: "localhost" }, { staff: true }, { internal: true }]) {
    const x = tracker(t, options); await x.capture(car); assert.equal(x.calls.length, 0); assert.equal(x.state.value, null);
  }
});
test("repeat results/page/sort do not inflate interest; zero result adds one monotonic signal", async (t) => {
  const x = tracker(t); await x.capture(car); await x.capture({ ...car, result_count: 9 }); await x.capture({ ...car, result_count: 0 });
  assert.equal(x.calls.length, 2);
  assert.equal(x.calls[0][0], "/catalog/vehicles/interest/");
  assert.deepEqual(Object.keys(x.calls[0][1].body).sort(), ["analytics_consent", "make", "model", "result_count", "session_id", "variant", "year"]);
  assert.equal(x.calls[0][1].body.session_id, x.calls[1][1].body.session_id);
});
test("only signed decoded token is sent for VIN, not raw input/query", async (t) => {
  const x = tracker(t); await x.capture({ lookup_token: "signed-vehicle-attributes", vin: "should-never-be-sent", q: "private-input" });
  const body = x.calls[0][1].body; assert.equal(body.lookup_token, "signed-vehicle-attributes");
  assert.equal(body.vin, undefined); assert.equal(body.q, undefined);
});
test("idle timeout starts new search session and revoked consent forgets stored visit", async (t) => {
  const x = tracker(t); await x.capture(car); const first = x.calls[0][1].body.session_id;
  x.advance(30 * 60 * 1000); await x.capture(car); assert.notEqual(x.calls[1][1].body.session_id, first);
  x.consent.value = false; await vue.nextTick(); assert.equal(x.state.value, null); assert.equal(x.storage.has("flexdrive-vehicle-interest-visit"), false);
  await x.capture(car); assert.equal(x.calls.length, 2);
});
test("collector errors never escape to shopping and future action can retry", async (t) => {
  const x = tracker(t, { fail: true }); await x.capture(car); await x.capture(car); assert.equal(x.calls.length, 2);
});
