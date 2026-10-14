import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const vue = require("vue");
function execute(path, globals = {}, mocks = {}) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  return new Function("require", "exports", ...Object.keys(globals), `${outputText}\nreturn exports;`)(
    (name) => mocks[name] ?? require(name), exports, ...Object.values(globals),
  );
}
const media = execute("app/composables/media/useCloudinaryImage.ts");
const url = (name) => `https://res.cloudinary.com/example/image/upload/v1/${name}.webp`;
const photo = (name) => ({ image: { desktop: url(name), mobile: url(`${name}-mobile`) } });
const settle = () => new Promise((resolve) => setImmediate(resolve));

function context(t, { enabled = true, complete = true, photoData = photo("first") } = {}) {
  const mounts = [];
  const unmounts = [];
  const requests = [];
  const timers = new Map();
  let timerId = 0;
  const main = new EventTarget();
  main.complete = complete;
  class WarmImage {
    constructor() { requests.push(this); }
    decode() {
      return new Promise((resolve, reject) => { this.decoded = resolve; this.decodeFailed = reject; });
    }
  }
  const active = vue.shallowRef(photoData);
  const available = vue.ref(enabled);
  const trigger = vue.shallowRef({ querySelector: () => main });
  const scope = vue.effectScope();
  const module = execute("app/composables/catalog/useProductZoomPreload.ts", {
    Image: WarmImage,
    setTimeout: (fn) => { timers.set(++timerId, fn); return timerId; },
    clearTimeout: (id) => timers.delete(id),
  }, {
    vue: { ...vue, onMounted: (fn) => mounts.push(fn), onBeforeUnmount: (fn) => unmounts.push(fn) },
    "../media/useCloudinaryImage": media,
  });
  let result;
  scope.run(() => { result = module.useProductZoomPreload(active, trigger, available); });
  const unmount = () => { unmounts.forEach((fn) => fn()); scope.stop(); };
  t.after(unmount);
  return {
    ...result, requests, active, available, trigger, main, timers, unmount,
    width: module.PRODUCT_ZOOM_IMAGE_WIDTH,
    mount: () => scope.run(() => mounts.forEach((fn) => fn())),
    runTimers: () => { const pending = [...timers.values()]; timers.clear(); pending.forEach((fn) => fn()); },
  };
}

test("single-photo product waits for the main image and prepares its 2000px zoom before any hover", async (t) => {
  const c = context(t, { complete: false });
  assert.equal(c.requests.length, 0); // Setup/SSR performs no image work.
  c.mount(); c.runTimers();
  assert.equal(c.requests.length, 0);
  c.main.dispatchEvent(new Event("load")); c.runTimers();
  assert.equal(c.requests.length, 1);
  assert.equal(c.requests[0].src, media.buildOptimizedCloudinaryUrl(url("first"), c.width));
  assert.equal(c.width, 2000);
  assert.equal(c.requests[0].fetchPriority, "low");
  assert.equal(c.requests[0].decoding, "async");
  assert.equal(c.isProductZoomReady.value, false);
  c.requests[0].onload();
  assert.equal(c.isProductZoomReady.value, false); // Existing detail remains until decoding completes.
  c.requests[0].decoded(); await settle();
  assert.equal(c.isProductZoomReady.value, true);
});

test("mobile, touch-only and narrow desktop modes never request a zoom image", async (t) => {
  const c = context(t, { enabled: false });
  c.mount(); c.runTimers();
  assert.equal(c.requests.length, 0);
  c.available.value = true; await vue.nextTick(); c.runTimers();
  assert.equal(c.requests.length, 1);
  c.requests[0].onload();
  c.available.value = false; await vue.nextTick();
  c.requests[0].decoded(); await settle();
  assert.equal(c.isProductZoomReady.value, false);
});

test("selected photo changes cannot display stale readiness and returning to a decoded photo reuses it", async (t) => {
  const c = context(t);
  c.mount(); c.runTimers(); c.requests[0].onload(); c.requests[0].decoded(); await settle();
  assert.equal(c.isProductZoomReady.value, true);
  c.active.value = photo("second");
  assert.equal(c.isProductZoomReady.value, false); // Resets synchronously before the next DOM render.
  await vue.nextTick(); c.runTimers();
  assert.equal(c.requests[1].src, media.buildOptimizedCloudinaryUrl(url("second"), 2000));
  c.requests[1].onload(); c.requests[1].decoded(); await settle();
  assert.equal(c.isProductZoomReady.value, true);
  c.active.value = photo("first"); await vue.nextTick(); c.runTimers();
  assert.equal(c.requests.length, 2);
  assert.equal(c.isProductZoomReady.value, true);
});

test("late decoding of the previous selection cannot mark the current zoom ready", async (t) => {
  const c = context(t);
  c.mount(); c.runTimers(); c.requests[0].onload();
  c.active.value = photo("second"); await vue.nextTick(); c.runTimers();
  c.requests[0].decoded(); await settle();
  assert.equal(c.isProductZoomReady.value, false);
  c.requests[1].onload(); c.requests[1].decoded(); await settle();
  assert.equal(c.isProductZoomReady.value, true);
});

test("network and decode failures leave the cached detail fallback available", async (t) => {
  const c = context(t);
  c.mount(); c.runTimers(); c.requests[0].onerror();
  assert.equal(c.isProductZoomReady.value, false);
  c.active.value = photo("second"); await vue.nextTick(); c.runTimers();
  c.requests[1].onload(); c.requests[1].decodeFailed(new Error("invalid image")); await settle();
  assert.equal(c.isProductZoomReady.value, false);
});

test("desktop URL fallbacks and non-Cloudinary media use the existing source rules", async (t) => {
  const c = context(t, { photoData: { image: { mobile: url("mobile-only") } } });
  c.mount(); c.runTimers();
  assert.equal(c.requests[0].src, media.buildOptimizedCloudinaryUrl(url("mobile-only"), 2000));
  c.active.value = { image: { desktop: "/media/local.webp" } }; await vue.nextTick(); c.runTimers();
  assert.equal(c.requests[1].src, "/media/local.webp");
});

test("unmount removes pending listeners and timers and ignores a late decode", async (t) => {
  const waiting = context(t, { complete: false });
  waiting.mount(); waiting.unmount(); waiting.main.dispatchEvent(new Event("load")); waiting.runTimers();
  assert.equal(waiting.requests.length, 0);
  const scheduled = context(t);
  scheduled.mount(); scheduled.unmount(); scheduled.runTimers();
  assert.equal(scheduled.requests.length, 0);
  const decoding = context(t);
  decoding.mount(); decoding.runTimers(); decoding.requests[0].onload(); decoding.unmount();
  decoding.requests[0].decoded(); await settle();
  assert.equal(decoding.isProductZoomReady.value, false);
});

test("missing media and missing main element cause no background requests", (t) => {
  const empty = context(t, { photoData: null });
  empty.mount(); empty.runTimers();
  assert.equal(empty.requests.length, 0);
  const missing = context(t);
  missing.trigger.value = null; missing.mount(); missing.runTimers();
  assert.equal(missing.requests.length, 0);
});
