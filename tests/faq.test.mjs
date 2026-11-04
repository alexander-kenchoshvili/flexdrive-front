import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const vue = require("vue");
const ts = require("typescript");
const { parse, compileScript } = require("@vue/compiler-sfc");
const { renderToString } = require("@vue/server-renderer");
const transpile = (source) => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const accordionSource = readFileSync(new URL("../app/composables/useFaqAccordion.ts", import.meta.url), "utf8");

function loadAccordion(runtime = vue, browser) {
  const exports = {};
  new Function("require", "exports", "window", transpile(accordionSource))(() => runtime, exports, browser);
  return exports.useFaqAccordion;
}

function component(path, mocks) {
  const { descriptor } = parse(readFileSync(new URL(path, import.meta.url), "utf8"));
  const output = transpile(compileScript(descriptor, { id: path, inlineTemplate: true }).content);
  const exports = {};
  new Function("require", "exports", output)((id) => mocks[id] ?? require(id), exports);
  return exports.default;
}

const FaqItem = component("../app/components/SmartComponents/Faq/parts/FaqItem.vue", {
  "@heroicons/vue/24/outline": { ChevronDownIcon: { render: () => vue.h("svg") } },
});
const Faq = component("../app/components/SmartComponents/Faq/Faq.vue", {
  "./parts/FaqItem.vue": { default: FaqItem },
  "~/composables/helpers": { sanitizeText: (value) => value?.trim() || "" },
  "~/composables/useFaqAccordion": { useFaqAccordion: loadAccordion() },
});
const item = (id, position = id) => ({ id, position, title: `Question ${id}`, description: `Answer ${id}` });
const data = (items) => ({ title: "FAQ title", contentData: { list: items } });
const flush = async () => { for (let i = 0; i < 4; i++) await vue.nextTick(); };

const node = (tag, text = "") => ({ tag, text, props: {}, children: [], parent: null });
const all = (root) => [root, ...root.children.flatMap(all)];
function mount(t, supplied) {
  const remove = (child) => {
    if (child.parent) child.parent.children.splice(child.parent.children.indexOf(child), 1);
    child.parent = null;
  };
  const renderer = vue.createRenderer({
    createElement: (tag) => node(tag), createText: (text) => node("#text", text), createComment: (text) => node("#comment", text),
    insert(child, parent, anchor) { remove(child); const at = anchor ? parent.children.indexOf(anchor) : -1; parent.children.splice(at < 0 ? parent.children.length : at, 0, child); child.parent = parent; },
    remove, setText: (el, text) => { el.text = text; }, setElementText: (el, text) => { el.text = text; el.children = []; },
    patchProp: (el, key, _old, value) => { el.props[key] = value; }, parentNode: (el) => el.parent,
    nextSibling: (el) => el.parent?.children[el.parent.children.indexOf(el) + 1] ?? null,
  });
  const current = vue.ref(supplied);
  const app = renderer.createApp({ setup: () => () => vue.h(Faq, { data: current.value }) });
  const root = node("root");
  const warnings = [];
  app.config.warnHandler = (message) => warnings.push(message);
  app.mount(root);
  t.after(() => app.unmount());
  return { root, current, warnings, buttons: () => all(root).filter((el) => el.tag === "button") };
}

test("empty or incomplete CMS questions render no empty homepage section", async () => {
  for (const supplied of [undefined, data([]), data([{ ...item(1), description: " " }])]) {
    const html = await renderToString(vue.createSSRApp(Faq, { data: supplied }));
    assert.equal(html.includes("<section"), false);
  }
});

test("SSR preserves upper classes, unique accessible IDs, closed inert answers and escaped copy", async () => {
  const supplied = data([{ ...item(1), description: "<script>untrusted</script>" }]);
  const html = await renderToString(vue.createSSRApp({ render: () => vue.h("div", [vue.h(Faq, { data: supplied }), vue.h(Faq, { data: supplied })]) }));
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, 6);
  assert.equal(new Set(ids).size, ids.length);
  assert.match(html, /<h2[^>]*class="upper /);
  assert.match(html, /class="upper min-w-0 break-words"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-hidden="true" inert/);
  assert.ok(html.includes("&lt;script&gt;untrusted&lt;/script&gt;"));
  for (const match of html.matchAll(/aria-(?:controls|labelledby)="([^"]+)"/g)) assert.ok(ids.includes(match[1]));
});

test("rapid clicks leave exactly one answer open, and clicking it again closes it", async (t) => {
  const c = mount(t, data([item(2, 20), item(1, 10), item(3, 30)]));
  const buttons = c.buttons();
  assert.ok(buttons[0].props.id.endsWith("question-1"));
  buttons[0].props.onClick({ currentTarget: buttons[0] });
  buttons[1].props.onClick({ currentTarget: buttons[1] });
  await flush();
  assert.deepEqual(c.buttons().map((button) => button.props["aria-expanded"]), [false, true, false]);
  const panels = all(c.root).filter((el) => el.props.role === "region");
  assert.deepEqual(panels.map((panel) => panel.props.inert), [true, false, true]);
  assert.equal(all(c.root).filter((el) => el.tag === "svg" && el.props.class.includes("faq-arrow-open")).length, 1);
  c.buttons()[1].props.onClick({ currentTarget: c.buttons()[1] });
  await flush();
  assert.ok(c.buttons().every((button) => button.props["aria-expanded"] === false));
  assert.deepEqual(c.warnings, []);
});

test("removing the active CMS question clears state without changing remaining question IDs", async (t) => {
  const c = mount(t, data([item(1), item(2)]));
  const secondId = c.buttons()[1].props.id;
  c.buttons()[0].props.onClick({ currentTarget: c.buttons()[0] });
  await flush();
  c.current.value = data([item(2)]);
  await flush();
  assert.equal(c.buttons()[0].props.id, secondId);
  assert.equal(c.buttons()[0].props["aria-expanded"], false);
});

function scrollHarness({ reducedMotion = false, maxScroll = 1000 } = {}) {
  const cleanup = [];
  const frames = new Map();
  const events = new Map();
  const moves = [];
  let nextFrame = 0, documentTop = 400;
  const browser = {
    scrollY: 300, performance: { now: () => 0 }, matchMedia: () => ({ matches: reducedMotion }),
    requestAnimationFrame(callback) { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame(id) { frames.delete(id); },
    addEventListener(name, callback) { events.set(name, callback); },
    removeEventListener(name) { events.delete(name); },
    scrollBy(options) { moves.push(options); this.scrollY = Math.max(0, Math.min(maxScroll, this.scrollY + options.top)); },
  };
  const trigger = { isConnected: true, getBoundingClientRect: () => ({ top: documentTop - browser.scrollY }) };
  const state = loadAccordion({ ...vue, onBeforeUnmount: (callback) => cleanup.push(callback) }, browser)();
  return {
    ...state, browser, trigger, frames, events, moves,
    shift: (top) => { documentTop = top; },
    tick(time) { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach((callback) => callback(time)); },
    unmount: () => cleanup.forEach((callback) => callback()),
  };
}

test("collapsing a previous answer retains the clicked question's viewport position", () => {
  const c = scrollHarness();
  c.toggle(1, c.trigger);
  c.tick(300);
  c.toggle(2, c.trigger);
  c.shift(250);
  c.tick(16);
  assert.equal(c.trigger.getBoundingClientRect().top, 100);
  assert.deepEqual(c.moves, [{ top: -150, behavior: "instant" }]);
  c.tick(300);
  assert.equal(c.frames.size, 0);
  assert.equal(c.events.size, 0);
});

for (const event of ["wheel", "touchstart", "pointerdown", "keydown", "resize"]) {
  test(`${event} cancels anchoring so it never fights the user's navigation`, () => {
    const c = scrollHarness();
    c.toggle(1, c.trigger);
    c.events.get(event)();
    c.shift(150);
    c.tick(16);
    assert.deepEqual(c.moves, []);
    assert.equal(c.events.size, 0);
  });
}

test("reduced motion settles in one frame; rapid toggles, detached triggers and unmount leave no animation work", () => {
  const reduced = scrollHarness({ reducedMotion: true });
  reduced.toggle(1, reduced.trigger);
  reduced.tick(16);
  assert.equal(reduced.frames.size, 0);
  const c = scrollHarness();
  c.toggle(1, c.trigger);
  c.toggle(2, c.trigger);
  assert.equal(c.frames.size, 1);
  c.trigger.isConnected = false;
  c.tick(16);
  assert.equal(c.frames.size, 0);
  c.trigger.isConnected = true;
  c.toggle(1, c.trigger);
  c.unmount();
  assert.equal(c.frames.size, 0);
  assert.equal(c.events.size, 0);
});

test("document scroll limits do not create an endless animation or artificial page space", () => {
  const c = scrollHarness({ maxScroll: 0 });
  c.toggle(1, c.trigger);
  c.shift(200);
  for (const time of [16, 100, 200, 300]) c.tick(time);
  assert.equal(c.browser.scrollY, 0);
  assert.equal(c.frames.size, 0);
});
