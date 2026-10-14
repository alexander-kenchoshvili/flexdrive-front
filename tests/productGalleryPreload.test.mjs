import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const vue = require("vue");
const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
function execute(path, globals = {}, mocks = {}) {
  const { outputText } = ts.transpileModule(source(path), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  return new Function("require", "exports", ...Object.keys(globals), `${outputText}\nreturn exports;`)(
    (name) => mocks[name] ?? require(name), exports, ...Object.values(globals),
  );
}
const media = execute("app/composables/media/useCloudinaryImage.ts");
const url = (name) => `https://res.cloudinary.com/example/image/upload/v1/${name}.webp`;
const photo = (name) => ({ image: { desktop: url(`${name}-desktop`), tablet: url(`${name}-tablet`), mobile: url(`${name}-mobile`) } });
const settle = () => new Promise((resolve) => setImmediate(resolve));

function context(t, { width = 1440, complete = false, gallery = [photo("first"), photo("second"), photo("third"), photo("fourth")] } = {}) {
  const mounted = [];
  const unmounting = [];
  const requests = [];
  const timers = new Map();
  let nextTimer = 0;
  class MainImage extends EventTarget {
    complete = complete;
    currentSrc = "";
  }
  const main = new MainImage();
  class WarmImage {
    constructor() { requests.push(this); }
    decode() {
      this.decodeCalled = true;
      return new Promise((resolve, reject) => { this.decoded = resolve; this.decodeFailed = reject; });
    }
  }
  const images = vue.shallowRef(gallery);
  const trigger = vue.shallowRef({ querySelector: () => main });
  const scope = vue.effectScope();
  const api = execute("app/composables/catalog/useProductGalleryPreload.ts", {
    Image: WarmImage,
    window: { matchMedia: (query) => ({ matches: width <= Number(query.match(/\d+/)[0]) }) },
    setTimeout: (fn) => { timers.set(++nextTimer, fn); return nextTimer; },
    clearTimeout: (id) => timers.delete(id),
  }, {
    vue: { ...vue, onMounted: (fn) => mounted.push(fn), onBeforeUnmount: (fn) => unmounting.push(fn) },
    "../media/useCloudinaryImage": media,
  });
  scope.run(() => api.useProductGalleryPreload(images, trigger));
  const unmount = () => { unmounting.forEach((fn) => fn()); scope.stop(); };
  t.after(unmount);
  return {
    requests, main, images, trigger, timers, unmount,
    mount: () => scope.run(() => mounted.forEach((fn) => fn())),
    runTimers: () => {
      const pending = [...timers.values()]; timers.clear(); pending.forEach((fn) => fn());
    },
  };
}

test("waits for the main image, then warms only two detail images at low priority until decode completes", async (t) => {
  const c = context(t);
  assert.equal(c.requests.length, 0); // SSR/setup performs no image work.
  c.mount(); c.runTimers();
  assert.equal(c.requests.length, 0);
  c.main.dispatchEvent(new Event("load")); c.runTimers();
  assert.equal(c.requests.length, 2);
  assert.equal(c.requests[0].src, media.buildOptimizedCloudinaryUrl(url("second-desktop"), 1440));
  for (const image of c.requests) {
    assert.equal(image.fetchPriority, "low");
    assert.equal(image.decoding, "async");
  }
  c.requests[0].onload();
  assert.equal(c.requests[0].decodeCalled, true);
  assert.equal(c.requests.length, 2);
  c.requests[0].decoded(); await settle();
  assert.equal(c.requests.length, 3);
});

for (const [width, viewport, pixels] of [[375, "mobile", 720], [767, "mobile", 720], [768, "tablet", 1080], [1023, "tablet", 1080], [1024, "desktop", 1440]]) {
  test(`cached main image warms the same detail source as BasePicture at viewport ${width}`, (t) => {
    const c = context(t, { width, complete: true });
    c.mount(); c.runTimers();
    assert.equal(c.requests[0].src, media.buildOptimizedCloudinaryUrl(url(`second-${viewport}`), pixels));
  });
}

test("fallback sources, local URLs, duplicate photos and the visible image do not create extra requests", (t) => {
  const visible = media.buildOptimizedCloudinaryUrl(url("first-desktop"), 1440);
  const c = context(t, { complete: true, gallery: [photo("first"), photo("first"), photo("second"), photo("second"), { image: { mobile: "/media/local.webp" } }, { image: {} }] });
  c.main.currentSrc = visible;
  c.mount(); c.runTimers();
  assert.deepEqual(c.requests.map((image) => image.src), [media.buildOptimizedCloudinaryUrl(url("second-desktop"), 1440), "/media/local.webp"]);
});

test("failed requests and decoding errors continue the queue without changing selection", async (t) => {
  const c = context(t, { complete: true, gallery: [photo("first"), photo("second"), photo("third"), photo("fourth"), photo("fifth")] });
  const original = c.images.value;
  c.mount(); c.runTimers();
  c.requests[0].onerror();
  assert.equal(c.requests.length, 3);
  c.requests[1].onload(); c.requests[1].decodeFailed(new Error("decode failed")); await settle();
  assert.equal(c.requests.length, 4);
  assert.equal(c.images.value, original);
});

test("gallery changes discard the old queue and unmount prevents pending decodes from starting more requests", async (t) => {
  const c = context(t, { complete: true });
  c.mount(); c.runTimers();
  const old = c.requests[0]; old.onload();
  c.images.value = [photo("new-first"), photo("new-second")];
  await vue.nextTick(); c.runTimers();
  assert.equal(c.requests.length, 3);
  assert.match(c.requests[2].src, /new-second-desktop/);
  old.decoded(); await settle();
  assert.equal(c.requests.length, 3);
  c.requests[2].onload();
  c.unmount(); c.requests[2].decoded(); await settle();
  assert.equal(c.requests.length, 3);
  assert.equal(c.requests[1].onload, null);
});

test("unmount removes main-image listeners and scheduled work", (t) => {
  const waiting = context(t);
  waiting.mount(); waiting.unmount(); waiting.main.dispatchEvent(new Event("load")); waiting.runTimers();
  assert.equal(waiting.requests.length, 0);
  const scheduled = context(t, { complete: true });
  scheduled.mount(); scheduled.unmount(); scheduled.runTimers();
  assert.equal(scheduled.requests.length, 0);
});

test("one-photo and absent galleries do not preload", (t) => {
  for (const gallery of [[], [photo("first")]]) {
    const c = context(t, { gallery, complete: true });
    c.mount(); c.runTimers();
    assert.equal(c.requests.length, 0);
    assert.equal(c.timers.size, 0);
  }
});
