import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const vue = require("vue");
const { parse, compileTemplate } = require("@vue/compiler-sfc");

const execute = (path, globals = {}, mocks = {}, suffix = "") => {
  let source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  if (path.endsWith(".vue")) source = parse(source).descriptor.scriptSetup.content;
  const { outputText } = ts.transpileModule(source.replaceAll("import.meta.client", "true").replaceAll("import.meta.server", "false"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  return new Function("require", "exports", ...Object.keys(globals), `${outputText}\n${suffix}\nreturn exports;`)(
    (name) => mocks[name] ?? require(name), exports, ...Object.values(globals),
  );
};
const routing = execute("app/utils/businessRouting.ts");
const errors = execute("app/utils/httpError.ts");
const trackingHost = execute("app/utils/trackingHost.ts");
const mocks = { "~/utils/businessRouting": routing, "~/utils/httpError": errors, "~/utils/trackingHost": trackingHost };

test("login return destination is limited to known business routes", () => {
  assert.equal(routing.businessReturnPath("/business/sales"), "/business/sales");
  for (const value of ["https://evil.test", "//evil.test", "/business/login", "/profile", "/business/unknown", ["/business"]]) {
    assert.equal(routing.businessReturnPath(value), "/business");
  }
  assert.equal(routing.isBusinessPath("/business/login?next=/business"), true);
  assert.equal(routing.isBusinessPath("/BUSINESS/finance"), true);
  assert.equal(routing.isBusinessPath("/bu%73iness/login"), true);
  assert.equal(routing.isBusinessPath("/business-other"), false);
});

const authContext = (handler) => {
  const calls = [];
  const states = new Map();
  const globals = {
    useState: (key, init) => {
      if (!states.has(key)) states.set(key, vue.ref(init()));
      return states.get(key);
    },
    useApiBaseUrl: () => "/api",
    document: { cookie: "theme=light; csrftoken=csrf-value" },
    $fetch: { create(options) {
      assert.equal(options.credentials, "include");
      assert.equal(options.cache, "no-store");
      assert.equal(options.retry, 0);
      return async (path, input) => { calls.push({ path, input }); return handler(path, input); };
    } },
  };
  const module = execute("app/composables/useBusinessAuth.ts", globals, mocks);
  return { auth: module.useBusinessAuth(), calls, states };
};

test("business login uses its own API, seeds CSRF and keeps customer state untouched", async () => {
  const owner = { id: 7, username: "owner" };
  const context = authContext(async () => ({ authenticated: true, user: owner }));
  const customer = vue.ref({ id: 9, username: "customer" });
  context.states.set("customer-user", customer);
  await context.auth.login("owner", "private-password", "captcha-one");
  assert.deepEqual(context.calls.map((call) => call.path), ["/business/session/", "/business/login/"]);
  assert.equal(context.calls[1].input.headers["X-CSRFToken"], "csrf-value");
  assert.equal(context.calls[1].input.body.recaptcha_token, "captcha-one");
  assert.equal(context.auth.user.value.id, 7);
  await context.auth.logout();
  assert.equal(context.auth.user.value, null);
  assert.equal(customer.value.id, 9);
  assert.ok(context.calls.every((call) => call.path.startsWith("/business/")));
});

test("revoked access clears private user state and retains server denial", async () => {
  let denied = false;
  const context = authContext(async () => {
    if (denied) throw { statusCode: 403 };
    return { authenticated: true, user: { id: 7, username: "owner" } };
  });
  await context.auth.checkAccess();
  denied = true;
  await assert.rejects(context.auth.checkAccess(), (error) => error.statusCode === 403);
  assert.equal(context.auth.user.value, null);
});

test("failed logout keeps private session visible for retry", async () => {
  const context = authContext(async (path) => {
    if (path === "/business/logout/") throw { statusCode: 503 };
    return { authenticated: true, user: { id: 7, username: "owner" } };
  });
  await context.auth.checkSession();
  await assert.rejects(context.auth.logout());
  assert.equal(context.auth.user.value.id, 7);
});

test("private guard distinguishes absent session, revoked permission and connection failure", async () => {
  for (const [status, reason] of [[401, undefined], [403, "denied"], [503, "connection"]]) {
    const context = authContext(async () => { throw { statusCode: status }; });
    const module = execute("app/middleware/business-auth.ts", {
      defineNuxtRouteMiddleware: (callback) => callback,
      useBusinessAuth: () => context.auth,
      navigateTo: (target) => target,
    }, mocks);
    const result = await module.default({ path: "/business/finance" });
    assert.equal(result.path, "/business/login");
    assert.equal(result.query.next, "/business/finance");
    assert.equal(result.query.reason, reason);
  }
});

test("private guard accepts only a confirmed business session", async () => {
  const module = execute("app/middleware/business-auth.ts", {
    defineNuxtRouteMiddleware: (callback) => callback,
    useBusinessAuth: () => ({ checkAccess: async () => ({ id: 7, username: "owner" }) }),
    navigateTo: () => { throw new Error("unexpected redirect"); },
  }, mocks);
  assert.equal(await module.default({ path: "/business" }), undefined);
});

test("crossing the public/private boundary starts a clean document before private navigation", () => {
  const assigned = [];
  const location = { pathname: "/catalog", search: "", hash: "", assign: (path) => assigned.push(path) };
  const module = execute("app/middleware/00.business-boundary.global.ts", {
    defineNuxtRouteMiddleware: (callback) => callback,
    window: { location }, abortNavigation: () => "aborted",
  }, mocks);
  assert.equal(module.default({ path: "/business", fullPath: "/business" }, { path: "/catalog" }), "aborted");
  assert.deepEqual(assigned, ["/business"]);
  location.pathname = "/business";
  assert.equal(module.default({ path: "/business/finance", fullPath: "/business/finance" }, { path: "/business" }), undefined);
  assert.equal(module.default({ path: "/", fullPath: "/" }, { path: "/business" }), "aborted");
  assert.deepEqual(assigned, ["/business", "/"]);
});

test("initial private navigation does not loop through document reloads", () => {
  const module = execute("app/middleware/00.business-boundary.global.ts", {
    defineNuxtRouteMiddleware: (callback) => callback,
    window: { location: { pathname: "/business", search: "", hash: "", assign() { throw new Error("reload loop"); } } },
    abortNavigation() {},
  }, mocks);
  assert.equal(module.default({ path: "/business", fullPath: "/business" }, { path: "/" }), undefined);
});

test("GTM does not initialize or load on private pages including login", () => {
  for (const path of ["/business", "/business/login", "/business/finance"]) {
    const module = execute("app/plugins/google-tag-manager.client.ts", {
      defineNuxtPlugin: (plugin) => plugin,
      window: { location: { pathname: path } },
      useRuntimeConfig() { throw new Error("private tracking must stop before initialization"); },
    }, mocks);
    module.default.setup();
  }
});

test("business views are excluded from indexing and robots even when public indexing is enabled", () => {
  const seo = execute("app/utils/seoIndexing.ts");
  assert.equal(seo.resolveRobotsValue({ allowIndexing: true, path: "/business/finance" }), "noindex, nofollow");
  assert.match(seo.buildRobotsTxt({ allowIndexing: true }), /Disallow: \/business/);
  assert.equal(seo.resolveRobotsValue({ allowIndexing: true, path: "/catalog" }), "index, follow");
});

const renderer = vue.createRenderer({
  createComment: () => ({}), createText: () => ({}), createElement: () => ({}),
  insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {},
  parentNode: () => null, nextSibling: () => null,
});

test("logout renders the login slot before Nuxt's delayed page route updates", async (t) => {
  const currentRoute = vue.shallowRef({ path: "/business/finance" });
  const delayedRoute = vue.reactive({ path: "/business/finance", query: {} });
  const user = vue.ref({ id: 7, username: "owner" });
  const navigations = [];
  const makeNode = (tag, text = "") => ({ tag, text, children: [], parent: null });
  const host = vue.createRenderer({
    createElement: (tag) => makeNode(tag),
    createText: (text) => makeNode("text", text),
    createComment: () => makeNode("comment"),
    insert(node, parent, anchor) {
      if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1);
      const index = anchor ? parent.children.indexOf(anchor) : -1;
      parent.children.splice(index < 0 ? parent.children.length : index, 0, node);
      node.parent = parent;
    },
    remove(node) {
      if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1);
      node.parent = null;
    },
    setText: (node, text) => { node.text = text; },
    setElementText: (node, text) => { node.text = text; node.children = []; },
    patchProp() {}, parentNode: (node) => node.parent,
    nextSibling: (node) => node.parent?.children[node.parent.children.indexOf(node) + 1] || null,
  });
  const template = parse(readFileSync(new URL("../app/layouts/business.vue", import.meta.url), "utf8")).descriptor.template.content;
  const compiled = compileTemplate({ source: template, filename: "business.vue", id: "logout-regression" });
  assert.deepEqual(compiled.errors, []);
  const { outputText } = ts.transpileModule(compiled.code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const render = new Function("require", "exports", `${outputText}\nreturn exports.render;`)(require, {});
  let controls;
  const Layout = {
    render,
    setup() {
      const result = execute("app/layouts/business.vue", {
        ...vue,
        useRoute: () => delayedRoute,
        useRouter: () => ({ currentRoute }),
        useBusinessAuth: () => ({ user, logout: async () => { user.value = null; } }),
        useTheme: () => ({ isDark: vue.ref(false), toggleTheme() {} }),
        useHead() {},
        document: { body: { style: { overflow: "" } } },
        navigateTo: async (target, options) => {
          navigations.push({ target, options });
          currentRoute.value = { path: target };
        },
      }, {
        ...mocks,
        "@vueuse/core": { useMediaQuery: () => vue.ref(false) },
      }, "exports.controls = { route, user, isLogin, current, icons, mobile, menuOpen, menuButton, sidebar, signingOut, logoutError, isDark, toggleTheme, closeMenu, trapMenuFocus, signOut, refreshPage };");
      controls = result.controls;
      return { ...require("@heroicons/vue/24/outline"), ...controls, BUSINESS_SECTIONS: routing.BUSINESS_SECTIONS };
    },
  };
  const root = makeNode("root");
  const app = host.createApp({
    render: () => vue.h(Layout, null, {
      default: () => currentRoute.value.path.startsWith("/business/login")
        ? vue.h("form", null, "login form")
        : vue.h("section", null, "private dashboard"),
    }),
  });
  const Stub = { render: () => vue.h("span") };
  for (const name of ["NewFlexdriveLogoHorizontal", "NuxtLink", ...Object.keys(require("@heroicons/vue/24/outline"))]) app.component(name, Stub);
  app.mount(root);
  t.after(() => app.unmount());
  const textContent = (node) => node.text + node.children.map(textContent).join("");
  assert.match(textContent(root), /private dashboard/);
  await controls.signOut();
  await vue.nextTick();
  // Nuxt's route still refers to the old page until the new page can render.
  assert.equal(delayedRoute.path, "/business/finance");
  assert.equal(user.value, null);
  assert.equal(controls.isLogin.value, true);
  assert.match(textContent(root), /login form/);
  assert.doesNotMatch(textContent(root), /წვდომა მოწმდება|private dashboard/);
  assert.deepEqual(navigations, [{ target: "/business/login", options: { replace: true } }]);
  currentRoute.value = { path: "/business/login/" };
  await vue.nextTick();
  assert.equal(controls.isLogin.value, true);
});

const mountLogin = async (options = {}) => {
  let login;
  const captchaActions = [];
  const submissions = [];
  const navigations = [];
  const app = renderer.createApp({
    setup() {
      const auth = {
        checkSession: async () => null,
        login: async (...args) => { submissions.push(args); await options.login?.(...args); },
      };
      const result = execute("app/pages/business/login.vue", {
        ...vue, definePageMeta() {}, useSeoMeta() {},
        useRoute: () => ({ query: { next: "/business/sales" } }),
        useBusinessAuth: () => auth,
        useRecaptcha: () => ({ executeRecaptcha: async (action) => { captchaActions.push(action); return `captcha-${captchaActions.length}`; } }),
        navigateTo: (target) => { navigations.push(target); },
      }, { ...mocks, "@heroicons/vue/24/outline": {} }, "exports.controls = { username, password, busy, checking, errorMessage, submit };");
      login = result.controls;
      return () => null;
    },
  });
  app.mount({});
  await vue.nextTick(); await vue.nextTick();
  return { app, login, captchaActions, submissions, navigations };
};

test("each login attempt obtains fresh CAPTCHA and clears the password after failure", async (t) => {
  const context = await mountLogin({ login: async () => { throw { statusCode: 400 }; } });
  t.after(() => context.app.unmount());
  context.login.username.value = "owner";
  context.login.password.value = "wrong";
  await context.login.submit();
  assert.equal(context.login.password.value, "");
  assert.match(context.login.errorMessage.value, /შესვლის მონაცემები/);
  context.login.password.value = "wrong-again";
  await context.login.submit();
  assert.deepEqual(context.captchaActions, ["business_login", "business_login"]);
  assert.deepEqual(context.submissions.map((args) => args[2]), ["captcha-1", "captcha-2"]);
  assert.deepEqual(context.navigations, []);
});

test("successful login returns to a safe private route and ignores duplicate submits", async (t) => {
  let finish;
  const context = await mountLogin({ login: () => new Promise((resolve) => { finish = resolve; }) });
  t.after(() => context.app.unmount());
  context.login.username.value = "owner";
  context.login.password.value = "private-password";
  const first = context.login.submit();
  await vue.nextTick();
  await context.login.submit();
  assert.equal(context.submissions.length, 1);
  finish(); await first;
  assert.equal(context.login.password.value, "");
  assert.deepEqual(context.navigations, ["/business/sales"]);
});
