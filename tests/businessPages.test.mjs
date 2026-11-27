import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
const require = createRequire(import.meta.url), ts = require("typescript"), vue = require("vue");
const { parse, compileScript } = require("@vue/compiler-sfc"), { renderToString } = require("@vue/server-renderer");
const execute = (source, globals = {}, mocks = {}) => {
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  return new Function("require", "exports", ...Object.keys(globals), `${outputText}\nreturn exports;`)((name) => mocks[name] ?? require(name), {}, ...Object.values(globals));
};
const source = (path) => readFileSync(new URL(`../app/${path}`, import.meta.url), "utf8");
const pages = execute(source("utils/businessPages.ts"));
const decisions = execute(source("utils/businessDecisions.ts"));
const reportUtils = execute(source("utils/businessReport.ts"));
const marketing = execute(source("utils/businessMarketing.ts"));
const http = execute(source("utils/httpError.ts"));
const analytics = execute(source("utils/businessAnalytics.ts"));
const period = { start: "2026-11-01", end: "2026-11-17" };
const component = (name, globals = {}, runtimeMocks = {}) => {
  const { descriptor } = parse(source(`components/business/${name}.vue`));
  const compiled = compileScript(descriptor, { id: name, inlineTemplate: true });
  return execute(compiled.content, { ref: vue.ref, computed: vue.computed, nextTick: vue.nextTick, onMounted: vue.onMounted, watch: vue.watch, ...globals }, {
    "~/utils/businessPages": pages, "~/utils/businessDecisions": decisions,
    "~/utils/businessReport": reportUtils, "~/utils/businessMarketing": marketing,
    "~/utils/businessAnalytics": analytics,
    ...(name === "BusinessPagePerformance" ? { "./BusinessPageDetails.vue": { default: component("BusinessPageDetails") } } : {}),
    ...runtimeMocks,
  }).default;
};
test("active time is readable, handles rounding boundaries and never invents unknown duration", () => {
  assert.equal(pages.activeTime(25.1), "25 წმ");
  assert.equal(pages.activeTime(59.9), "1 წთ 0 წმ");
  assert.equal(pages.activeTime(0), "0 წმ");
  for (const value of [undefined, null, NaN, -1]) assert.equal(pages.activeTime(value), "—");
});
test("funnel renders unknown as a dash and exposes both routes without claiming zero", async () => {
  const html = await renderToString(vue.createSSRApp(component("BusinessFunnel"), { funnel: { status: "ready", steps: [
    { event: "view_item", label: "პროდუქტი ნახა", users: 6, lost: null },
    { event: "purchase", label: "იყიდა", users: null, lost: null },
  ] } }));
  assert.match(html, /ახლავე ყიდვით/); assert.match(html, /კალათით/);
  assert.match(html, /Google-მა ამ ეტაპის რაოდენობა არ დააბრუნა/); assert.match(html, /—/);
  assert.doesNotMatch(html, /არ გადასულა: 6/);
});
test("Meta distinguishes available pixel status from unverified server delivery", async () => {
  const html = await renderToString(vue.createSSRApp(component("BusinessMetaTechnical"), { report: {
    pixel: { status: "ready", name: "FlexDrive Web Pixel", id: "1020718363721235", fetched_at: "2026-11-17T10:00:00Z" },
    technical: { capi_configured: true },
  } }));
  assert.match(html, /eventsmanager.facebook.com/); assert.match(html, /FlexDrive Web Pixel/);
  assert.match(html, /პარამეტრების არსებობა კონკრეტული შეძენის მიღების მტკიცებულება არ არის/);
});
test("page results render active time, stale warning and original timestamp", async () => {
  const data = { status: "stale", fetched_at: "2026-11-17T10:00:00Z", row_count: 24, rows: [{ path: "/catalog/test-part", views: 3, users: 2, average_active_seconds: 25.1 }] };
  const html = await renderToString(vue.createSSRApp(component("BusinessPagePerformance", {
    useBusinessPages: () => ({ report: vue.ref(data), loading: vue.ref(false), errorMessage: vue.ref(""), load() {} }),
  }), { period }));
  assert.match(html, /25 წმ/); assert.match(html, /ძველი პასუხი/); assert.match(html, /24/);
  assert.match(html, /პროდუქტის გვერდი/); assert.match(html, /სრულ/);
});
const context = () => {
  const calls = [], navigations = [], user = vue.ref({ id: 1 }); let unmount;
  const module = execute(source("composables/useBusinessPages.ts"), {
    ref: vue.ref, shallowRef: vue.shallowRef, useBusinessAuth: () => ({ user }), useApiBaseUrl: () => "/api", useRoute: () => ({ path: "/business/users" }),
    navigateTo: async (target) => navigations.push(target), onBeforeUnmount: (callback) => { unmount = callback; },
    $fetch: { create(options) { assert.equal(options.credentials, "include"); assert.equal(options.cache, "no-store"); assert.equal(options.retry, 0);
      return (path, input) => new Promise((resolve, reject) => calls.push({ path, input, resolve, reject })); } },
  }, { "~/utils/httpError": http });
  return { ...module.useBusinessPages(), calls, navigations, user, unmount: () => unmount() };
};
test("page period changes abort old requests and do not restore old private data", async () => {
  const c = context(), input = { ...period }, first = c.load(input); input.start = "2026-10-01";
  const second = c.load(input); assert.equal(c.calls[0].input.query.start, period.start);
  assert.equal(c.calls[0].input.signal.aborted, true); assert.equal(c.calls[1].path, "/business/pages/");
  c.calls[1].resolve({ rows: ["new"] }); await second; c.calls[0].resolve({ rows: ["old"] }); await first;
  assert.deepEqual(c.report.value.rows, ["new"]);
  const third = c.load(period); c.unmount(); c.calls[2].resolve({ rows: ["late"] }); await third; assert.equal(c.report.value, null);
});
test("revoked page access clears private data and returns to business login", async () => {
  for (const statusCode of [401, 403]) {
    const c = context(), pending = c.load(period); c.calls[0].reject({ statusCode }); await pending;
    assert.equal(c.user.value, null); assert.equal(c.report.value, null);
    assert.equal(c.navigations[0].query.next, "/business/users");
  }
});

test("blog and category labels are distinct and search results escape recorded titles", async () => {
  assert.equal(pages.publicPageName('/blogs/106-subaru'), 'ბლოგის სტატია');
  assert.equal(pages.publicPageName('/blogs/'), 'ბლოგი');
  assert.equal(pages.publicPageName('/catalog/category/body'), 'კატეგორიის გვერდი');
  const data = { status: 'ready', row_count: 41, page_size: 20, rows: [{ path: '/blogs/106-subaru', title: '<img src=x onerror=bad()>', views: 28, users: 20, sessions: 22, average_active_seconds: 78 }] };
  const html = await renderToString(vue.createSSRApp(component('BusinessPagePerformance', {
    useBusinessPages: () => ({ report: vue.ref(data), loading: vue.ref(false), errorMessage: vue.ref(''), load() {}, clear() {} }),
  }), { period }));
  assert.match(html, /&lt;img/); assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /გვერდის ძებნა/); assert.match(html, /შემდეგი/); assert.match(html, /aria-controls="page-detail"/);
});

test("selected page details render independent totals, sources, dates and unknown states", async () => {
  const metrics = { users: 20, views: 28, sessions: 22, active_users: 19, average_active_seconds: 78 };
  const report = { status: 'stale', fetched_at: '2026-11-17T10:00:00Z', period, summary: metrics,
    facebook: { ...metrics, users: 18, views: 26, sessions: 20 }, source_row_count: 2,
    sources: [{ ...metrics, source: '<script>bad()</script>' }, { ...metrics, source: '(direct) / (none)' }],
    daily: [{ ...metrics, date: period.start }], warnings: ['Google-ის გაფრთხილება'] };
  const props = { row: { path: '/blogs/106-subaru', title: 'Subaru', ...metrics }, report, loading: false, errorMessage: '' };
  const app = () => component('BusinessPageDetails');
  const html = await renderToString(vue.createSSRApp(app(), props));
  assert.match(html, /Facebook-იდან:/); assert.match(html, /18 მომხმარებელი/); assert.match(html, /დღეების მიხედვით/);
  assert.match(html, /&lt;script&gt;/); assert.doesNotMatch(html, /<script>bad/);
  assert.match(html, /დაუდგენელი წყარო/); assert.match(html, /არ ვაჯამებთ/); assert.match(html, /ძველი პასუხი/);
  const unavailable = await renderToString(vue.createSSRApp(app(), { ...props, report: { status: 'unavailable' } }));
  assert.match(unavailable, /ნულოვან ნახვებს არ ნიშნავს/); assert.doesNotMatch(unavailable, /Facebook-იდან:/);
});

test("list and detail filters are snapshotted; closing detail aborts and rejects late data", async () => {
  const c = context(), filters = { q: 'Subaru', page: 2 }, pending = c.load(period, filters);
  filters.q = 'changed'; filters.page = 3;
  assert.equal(c.calls[0].input.query.q, 'Subaru'); assert.equal(c.calls[0].input.query.page, 2);
  c.calls[0].resolve({ rows: [] }); await pending;
  const detail = c.load(period, { path: '/blogs/106-subaru' });
  assert.equal(c.calls[1].input.query.path, '/blogs/106-subaru');
  c.clear(); assert.equal(c.calls[1].input.signal.aborted, true); assert.equal(c.loading.value, false);
  c.calls[1].resolve({ summary: { users: 20 } }); await detail;
  assert.equal(c.report.value, null);
});

test("broad searches explain the bound and do not claim no visitors", async () => {
  const html = await renderToString(vue.createSSRApp(component('BusinessPagePerformance', {
    useBusinessPages: () => ({ report: vue.ref({ status: 'ready', search_too_broad: true }), loading: vue.ref(false), errorMessage: vue.ref(''), load() {}, clear() {} }),
  }), { period }));
  assert.match(html, /უფრო ზუსტი სათაური/); assert.doesNotMatch(html, /არცერთი აღრიცხული/);
});

test("page buttons, search, paging, closing and period changes use the selected filters", async () => {
  const calls = [], states = [], inputPeriod = vue.reactive({ ...period });
  const metrics = { users: 20, views: 28, sessions: 22, active_users: 19, average_active_seconds: 78 };
  const row = { path: '/blogs/106-subaru', title: 'Subaru', ...metrics };
  const Comp = component('BusinessPagePerformance', { useBusinessPages: () => {
    const index = states.length;
    const state = { report: vue.ref(null), loading: vue.ref(false), errorMessage: vue.ref(''),
      load(period, filters) {
        calls.push({ index, period: { ...period }, filters: { ...filters } });
        state.report.value = index === 0 ? { status: 'ready', row_count: 41, page_size: 20, rows: [row] }
          : { status: 'ready', period: { ...period }, summary: metrics, sources: [], daily: [] };
      }, clear() { state.report.value = null; } };
    states.push(state); return state;
  } }, { vue: { ...vue, vModelText: {} } });
  const renderer = vue.createRenderer({
    createElement: (type) => ({ type, props: {}, children: [], scrollIntoView() {} }),
    createText: (text) => ({ text }), createComment: () => ({}),
    setText: (node, text) => { node.text = text; }, setElementText: (node, text) => { node.text = text; node.children = []; },
    patchProp: (node, key, _old, value) => { node.props[key] = value; },
    insert(node, parent, anchor) {
      if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1);
      const index = anchor ? parent.children.indexOf(anchor) : -1;
      parent.children.splice(index < 0 ? parent.children.length : index, 0, node); node.parent = parent;
    },
    remove(node) { if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1); },
    parentNode: (node) => node.parent, nextSibling: (node) => node.parent?.children[node.parent.children.indexOf(node) + 1] || null,
  });
  const find = (node, check) => check(node) ? node : (node.children || []).map((child) => find(child, check)).find(Boolean);
  const text = (node) => [node.text || '', ...(node.children || []).map(text)].join(' ');
  const root = { children: [] }, app = renderer.createApp(vue.defineComponent({ setup: () => () => vue.h(Comp, { period: inputPeriod }) }));
  app.mount(root); await vue.nextTick();
  find(root, (node) => node.type === 'button' && text(node) === 'შემდეგი').props.onClick(); await vue.nextTick();
  assert.equal(calls.at(-1).filters.page, 2);
  find(root, (node) => node.type === 'input').props['onUpdate:modelValue']('Subaru');
  find(root, (node) => node.type === 'form').props.onSubmit({ preventDefault() {} }); await vue.nextTick();
  assert.equal(calls.at(-1).filters.page, 1); assert.equal(calls.at(-1).filters.q, 'Subaru');
  await find(root, (node) => node.props?.['aria-controls'] === 'page-detail').props.onClick(); await vue.nextTick();
  assert.equal(calls.at(-1).filters.path, row.path); assert.equal(calls.at(-1).index, 1);
  inputPeriod.start = '2026-11-02'; await vue.nextTick();
  assert.equal(calls.at(-1).period.start, '2026-11-02'); assert.equal(calls.at(-1).filters.path, row.path);
  find(root, (node) => node.type === 'button' && text(node) === 'დახურვა').props.onClick(); await vue.nextTick();
  assert.equal(states[1].report.value, null); assert.equal(find(root, (node) => node.props?.id === 'page-detail'), undefined);
  app.unmount();
});
