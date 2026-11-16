import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { after, before, beforeEach, test } from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const h3 = require("h3");
const load = (path, mocks = {}, globals = {}) => {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  new Function("require", "exports", ...Object.keys(globals), code)(
    (name) => mocks[name] ?? require(name), exports, ...Object.values(globals),
  );
  return exports;
};
const access = load("../server/utils/storefrontAccess.ts", {
  "../../app/utils/storefrontPreview": load("../app/utils/storefrontPreview.ts"),
});
const css = "/_nuxt/style.C33TH_ym.css";
const js = "/_nuxt/-GO5oTzN.js";
const assets = new Map([
  [css, { type: "text/css; charset=utf-8", body: "body{color:green}" }],
  [js, { type: "text/javascript; charset=utf-8", body: "console.info('build-1')" }],
  ["/_nuxt/style.AAAAAAAA.css", { type: "text/css", body: "body{color:blue}" }],
  ["/_nuxt/unsafe.AAAAAAAA.js", { type: "text/html", body: "holding" }],
  ["/_nuxt/app.js", { type: "text/javascript", body: "mutable" }],
  ["/_nuxt/builds/latest.json", { type: "application/json", body: "{}" }],
  ["/_nuxt/builds/meta/AAAAAAAA.json", { type: "application/json", body: "{}" }],
]);
let enabled, beforeResponse, server, base;
before(async () => {
  load("../server/plugins/storefront-access-cache.ts", {
    "../utils/storefrontAccess": access,
    "#nitro-internal-virtual/public-assets": { getAsset: (path) => assets.get(path) },
  }, {
    useRuntimeConfig: () => ({ storefrontAccessGuardEnabled: enabled }),
    defineNitroPlugin: (fn) => fn({ hooks: { hook: (_name, callback) => { beforeResponse = callback; } } }),
  });
  const app = h3.createApp({ onBeforeResponse: (event) => beforeResponse(event) });
  app.use(h3.defineEventHandler((event) => {
    const url = h3.getRequestURL(event);
    const asset = assets.get(url.pathname);
    h3.setHeader(event, "cache-control", "public, max-age=60");
    if (url.searchParams.has("error")) h3.setResponseStatus(event, 503);
    if (url.searchParams.has("cookie")) h3.setHeader(event, "set-cookie", "session=test; HttpOnly");
    if (url.searchParams.has("preview")) event.context.storefrontPreviewOnly = true;
    if (url.searchParams.has("holding")) {
      h3.setHeader(event, "content-type", "text/html");
      return "holding";
    }
    if (asset) {
      h3.setHeader(event, "vary", "Accept-Encoding");
      if (h3.getRequestHeader(event, "if-none-match") === '"build-etag"') {
        h3.setResponseStatus(event, 304);
        return "";
      }
      h3.setHeader(event, "etag", '"build-etag"');
      h3.setHeader(event, "content-type", asset.type);
      return asset.body;
    }
    if (url.pathname.startsWith("/_nuxt/")) h3.setResponseStatus(event, 404);
    return "private document";
  }));
  server = createServer(h3.toNodeListener(app));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
beforeEach(() => { enabled = true; });
after(() => new Promise((resolve) => { server.closeAllConnections(); server.close(resolve); }));
const visit = (path, options) => fetch(base + path, options);
const immutable = "public, max-age=31536000, immutable";

test("hashed CSS/JS return the same public bytes for anonymous, preview and account cookies", async () => {
  for (const path of [css, js]) {
    for (const cookie of ["", "fd_preview_access=valid", "sessionid=someone; theme=dark"]) {
      const response = await visit(path, { headers: { cookie } });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("cache-control"), immutable);
      assert.equal(response.headers.get("vary"), "Accept-Encoding");
      assert.equal(response.headers.get("set-cookie"), null);
      assert.equal(await response.text(), assets.get(path).body);
    }
  }
});
test("HEAD, query strings and conditional 304 preserve asset caching", async () => {
  const head = await visit(css + "?v=1", { method: "HEAD" });
  assert.equal(await head.text(), "");
  assert.equal(head.headers.get("cache-control"), immutable);
  const conditional = await visit(js, { headers: { "if-none-match": '"build-etag"' } });
  assert.equal(conditional.status, 304);
  assert.equal(conditional.headers.get("cache-control"), immutable);
});
test("new build hashes select new bytes without replacing the old cached URL", async () => {
  const oldBuild = await visit(css);
  const newBuild = await visit("/_nuxt/style.AAAAAAAA.css");
  assert.notEqual(await oldBuild.text(), await newBuild.text());
  assert.equal(newBuild.headers.get("cache-control"), immutable);
});
test("metadata, payloads, unknown files, maps and wrong MIME cannot enter immutable cache", async () => {
  for (const path of ["/_nuxt/builds/latest.json", "/_nuxt/builds/meta/AAAAAAAA.json", "/_nuxt/app.js", "/_nuxt/missing.AAAAAAAA.js", "/_nuxt/unsafe.AAAAAAAA.js", js + ".map", "/_nuxt/page.AAAAAAAA.json", "/outside.AAAAAAAA.js", css + "/extra"]) {
    assert.equal((await visit(path)).headers.get("cache-control"), "private, no-store", path);
  }
});
test("asset-looking errors, holding documents, mutations and cookie-setting responses stay private", async () => {
  for (const [path, options] of [[css + "?error=1"], [css + "?holding=1"], [js + "?cookie=1"], [css, { method: "POST" }]]) {
    assert.equal((await visit(path, options)).headers.get("cache-control"), "private, no-store", path);
  }
});
test("HTML, commerce, auth, business and preview responses retain no-store/noindex", async () => {
  for (const path of ["/", "/catalog", "/__preview", "/business", "/api/accounts/me/", "/api/commerce/cart/", "/api/business/marketing/"]) {
    const response = await visit(path + "?preview=1");
    assert.equal(response.headers.get("cache-control"), "private, no-store", path);
    assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow", path);
  }
});
test("disabled guard leaves pre-existing headers alone", async () => {
  enabled = false;
  assert.equal((await visit(css)).headers.get("cache-control"), "public, max-age=60");
});
