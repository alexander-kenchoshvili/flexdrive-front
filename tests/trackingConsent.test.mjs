import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const vue = require("vue");

function execute(path, globals = {}, mocks = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  return new Function("require", "exports", ...Object.keys(globals), `${outputText}\nreturn exports;`)(
    (name) => mocks[name] ?? require(name), exports, ...Object.values(globals),
  );
}

const routing = execute("app/utils/businessRouting.ts");
const trackingHost = execute("app/utils/trackingHost.ts");
const optional = (tracking) => ({
  version: 1, preferences: true, functionality: true,
  analytics: tracking, marketing: tracking, updatedAt: "2026-10-09T12:00:00Z",
});

function context(t, saved = null, { path = "/", hostname = "flexdrive.ge", existingGtag, existingFbq } = {}) {
  const cookie = vue.ref(saved);
  const states = new Map();
  const window = { location: { pathname: path, hostname }, ...(existingGtag ? { gtag: existingGtag } : {}), ...(existingFbq ? { fbq: existingFbq } : {}) };
  let head;
  const scope = vue.effectScope();
  t.after(() => scope.stop());
  const globals = {
    ...vue, window,
    defineNuxtPlugin: (plugin) => plugin,
    useRuntimeConfig: () => ({ public: { gtmId: "GTM-EXAMPLE1" } }),
    useCookie: () => cookie,
    useState: (key, init) => {
      if (!states.has(key)) states.set(key, vue.ref(init()));
      return states.get(key);
    },
    useHead: (input) => { head = vue.computed(input); },
  };
  const consent = execute("app/composables/useCookieConsent.ts", globals).useCookieConsent();
  globals.useCookieConsent = () => consent;
  const plugin = execute("app/plugins/google-tag-manager.client.ts", globals, { "~/utils/businessRouting": routing, "~/utils/trackingHost": trackingHost }).default;
  scope.run(() => plugin.setup());
  const commands = () => (window.dataLayer ?? []).filter((item) => item[0] === "consent");
  return { window, cookie, consent, commands, scripts: () => head?.value.script ?? [] };
}

const assertConsent = (command, action, tracking) => {
  assert.equal(Array.isArray(command), false, "gtag arrays are not recognised consent commands");
  assert.equal(Object.prototype.toString.call(command), "[object Arguments]");
  assert.deepEqual(Array.from(command).slice(0, 2), ["consent", action]);
  for (const name of ["analytics_storage", "ad_storage", "ad_user_data", "ad_personalization"]) {
    assert.equal(command[2][name], tracking ? "granted" : "denied");
  }
  assert.equal(command[2].security_storage, "granted");
};

test("fresh visit and refusal keep GTM unloaded and send a recognised denied default", async (t) => {
  const ctx = context(t);
  assertConsent(ctx.commands()[0], "default", false);
  assert.deepEqual(ctx.scripts(), []);
  assert.equal(ctx.window.dataLayer.some((item) => item.event === "gtm.js"), false);
  ctx.consent.rejectOptionalCookies();
  await vue.nextTick();
  // An explicit refusal leaves the already denied state unchanged.
  assert.equal(ctx.consent.hasConsentDecision.value, true);
  assertConsent(ctx.commands().at(-1), "default", false);
  assert.deepEqual(ctx.scripts(), []);
});

test("accept queues the granted update before loading GTM and loads it only once", async (t) => {
  const ctx = context(t);
  ctx.consent.acceptAllCookies();
  await vue.nextTick();
  assertConsent(ctx.commands().at(-1), "update", true);
  const updateIndex = ctx.window.dataLayer.findIndex((item) => item[0] === "consent" && item[1] === "update");
  const startIndex = ctx.window.dataLayer.findIndex((item) => item.event === "gtm.js");
  assert.ok(updateIndex < startIndex);
  assert.equal(ctx.scripts().length, 1);
  assert.match(ctx.scripts()[0].src, /gtm\.js\?id=GTM-EXAMPLE1$/);
  ctx.consent.saveConsent({ preferences: false, functionality: true, analytics: true, marketing: true });
  await vue.nextTick();
  assert.equal(ctx.window.dataLayer.filter((item) => item.event === "gtm.js").length, 1);
});

test("revocation updates Google and loaded Meta; reacceptance grants both without reinitializing GTM", async (t) => {
  const meta = [];
  const ctx = context(t, optional(true), { existingFbq: (...args) => meta.push(args) });
  assertConsent(ctx.commands()[0], "default", true);
  assert.deepEqual(meta.at(-1), ["consent", "grant"]);
  ctx.consent.rejectOptionalCookies();
  await vue.nextTick();
  assertConsent(ctx.commands().at(-1), "update", false);
  assert.deepEqual(meta.at(-1), ["consent", "revoke"]);
  ctx.consent.acceptAllCookies();
  await vue.nextTick();
  assertConsent(ctx.commands().at(-1), "update", true);
  assert.deepEqual(meta.at(-1), ["consent", "grant"]);
  assert.equal(ctx.window.dataLayer.filter((item) => item.event === "gtm.js").length, 1);
});

test("saved rejection survives reload and invalid or partial tracking consent cannot enable GTM", (t) => {
  for (const saved of [optional(false), { ...optional(true), version: 0 }, { ...optional(true), marketing: false }, { ...optional(true), analytics: false }]) {
    const ctx = context(t, saved);
    assertConsent(ctx.commands()[0], "default", false);
    assert.deepEqual(ctx.scripts(), []);
  }
});

test("saved acceptance is applied before the first container message", (t) => {
  const ctx = context(t, optional(true));
  assertConsent(ctx.window.dataLayer[0], "default", true);
  assert.equal(ctx.window.dataLayer[1].event, "gtm.js");
});

test("late GTM load synchronizes Meta with the latest choice", async (t) => {
  const ctx = context(t, optional(true));
  const onload = ctx.scripts()[0].onload;
  ctx.consent.rejectOptionalCookies();
  await vue.nextTick();
  const meta = [];
  ctx.window.fbq = (...args) => meta.push(args);
  onload();
  assert.deepEqual(meta, [["consent", "revoke"]]);
});

test("an existing Google gtag implementation is preserved and receives changes", async (t) => {
  const calls = [];
  const existingGtag = (...args) => calls.push(args);
  const ctx = context(t, null, { existingGtag });
  assert.equal(ctx.window.gtag, existingGtag);
  ctx.consent.acceptAllCookies();
  await vue.nextTick();
  assert.deepEqual(calls.map((call) => call.slice(0, 2)), [["consent", "default"], ["consent", "update"]]);
  assert.equal(calls.at(-1)[2].analytics_storage, "granted");
});

test("private business routes initialize neither Google nor Meta tracking", (t) => {
  for (const path of ["/business", "/business/login", "/business/finance"]) {
    const ctx = context(t, optional(true), { path, existingFbq() { throw new Error("private Meta tracking"); } });
    assert.equal(ctx.window.dataLayer, undefined);
    assert.equal(ctx.window.gtag, undefined);
    assert.deepEqual(ctx.scripts(), []);
  }
});


test("local, staging and temporary production hosts never initialize tracking, even after acceptance", async (t) => {
  for (const hostname of ["localhost", "127.0.0.1", "::1", "flexdrive-front.vercel.app",
    "flexdrive-prod-front-pdzcv.ondigitalocean.app", "staging.flexdrive.ge",
    "www.flexdrive.ge", "flexdrive.ge.evil.test", ""]) {
    const ctx = context(t, optional(true), { hostname, existingFbq() { throw new Error("nonproduction Meta tracking"); } });
    ctx.consent.rejectOptionalCookies();
    await vue.nextTick();
    ctx.consent.acceptAllCookies();
    await vue.nextTick();
    assert.equal(ctx.window.dataLayer, undefined, hostname);
    assert.equal(ctx.window.gtag, undefined, hostname);
    assert.equal(ctx.window.__flexdriveGtmId, undefined, hostname);
    assert.deepEqual(ctx.scripts(), [], hostname);
  }
});
