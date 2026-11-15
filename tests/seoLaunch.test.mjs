import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer, request } from "node:http";
import { createRequire } from "node:module";
import { after, before, beforeEach, test } from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const h3 = require("h3");
const { $fetch } = require("ofetch");
const load = (path, mocks = {}, globals = {}) => {
  const code = ts.transpileModule(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  new Function("require", "exports", ...Object.keys(globals), code)(
    (name) => mocks[name] ?? require(name), exports, ...Object.values(globals),
  );
  return exports;
};
const indexing = load("app/utils/seoIndexing.ts");
const policy = load("server/utils/seoPolicy.ts", { "../../app/utils/seoIndexing": indexing });
const access = load("server/utils/storefrontAccess.ts", {
  "../../app/utils/storefrontPreview": load("app/utils/storefrontPreview.ts"),
});
let publicOpen, healthy, enabled, allowIndexing, sitemapHealthy, malformed, calls;
let api, front, apiURL, frontURL;
const config = () => ({ public: { allowIndexing, siteUrl: "https://flexdrive.ge" }, apiBaseUrl: apiURL });
const listen = (server) => new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(`http://127.0.0.1:${server.address().port}`)));
before(async () => {
  api = createServer((req, res) => {
    calls.push({ path: req.url, headers: req.headers });
    res.setHeader("content-type", "application/json");
    if (req.url === "/api/launch/status/") {
      res.statusCode = healthy ? 200 : 503;
      res.end(JSON.stringify({ guard_enabled: true, public_open: publicOpen, preview_allowed: /fd_preview_access=valid/.test(req.headers.cookie || "") }));
    } else if (req.url === "/api/pages/sitemap/") {
      res.statusCode = sitemapHealthy ? 200 : 503;
      res.end(JSON.stringify(malformed ? { unexpected: [] } : { entries: [
        { loc: "/", lastmod: "2026-11-15T00:00:00Z" },
        { loc: "/catalog/part-fd-01-0001", lastmod: "2026-11-14T13:00:00Z" },
        { loc: "https://flexdrive.ge/catalog/part-fd-01-0001/" },
        { loc: "/catalog/category/bumper", lastmod: "invalid" },
        { loc: "/business/finance" }, { loc: "/order-status" }, { loc: "/auth/google/callback" },
        { loc: "/__preview" }, { loc: "/checkout/payment/success" },
        { loc: "/catalog?q=search" }, { loc: "/catalog?page=2" },
        { loc: "https://flexdrive.ge/catalog?make=toyota" },
        { loc: "https://other.test/catalog/part" }, { loc: "//other.test/path" },
        { loc: "https://user:password@flexdrive.ge/path" }, { loc: "https://[invalid" },
        { loc: "javascript:alert(1)" },
      ] }));
    } else { res.statusCode = 404; res.end("{}"); }
  });
  apiURL = `${await listen(api)}/api`;
  const globals = { useRuntimeConfig: config };
  const robots = load("server/routes/robots.txt.ts", {
    "../../app/utils/seoIndexing": indexing, "../utils/seoPolicy": policy,
  }, globals).default;
  const sitemap = load("server/routes/sitemap.xml.ts", {
    "../../app/utils/seoIndexing": indexing, "../utils/seoPolicy": policy,
  }, { ...globals, $fetch }).default;
  const hooks = [];
  load("server/plugins/seo-indexing.ts", { "../utils/seoPolicy": policy }, {
    ...globals, defineNitroPlugin: (fn) => fn({ hooks: { hook: (_name, cb) => hooks.push(cb) } }),
  });
  const app = h3.createApp({ onBeforeResponse: (event) => { for (const hook of hooks) hook(event); } });
  app.use(load("server/middleware/seo-indexing.ts", { "../utils/seoPolicy": policy }, globals).default);
  app.use(h3.defineEventHandler((event) => access.guardStorefrontRequest(event, { enabled, apiBaseUrl: apiURL, production: true })));
  app.use(h3.defineEventHandler((event) => {
    if (event.path.split("?")[0] === "/robots.txt") return robots(event);
    if (event.path.split("?")[0] === "/sitemap.xml") return sitemap(event);
    h3.setHeader(event, "x-robots-tag", "index, follow");
    return "STOREFRONT";
  }));
  front = createServer(h3.toNodeListener(app));
  frontURL = await listen(front);
});
beforeEach(() => { publicOpen = false; healthy = true; enabled = true; allowIndexing = true; sitemapHealthy = true; malformed = false; calls = []; });
after(async () => { await Promise.all([api, front].map((s) => new Promise((resolve) => { s.closeAllConnections(); s.close(resolve); }))); });
const visit = (path, { host = "flexdrive.ge", method = "GET", headers = {} } = {}) => new Promise((resolve, reject) => {
  const req = request(`${frontURL}${path}`, { method, headers: { host, ...headers }, signal: AbortSignal.timeout(5000) }, (res) => {
    const chunks = [];
    res.on("data", (c) => chunks.push(c));
    res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString() }));
    res.on("error", reject);
  });
  req.on("error", reject); req.end();
});
const entries = () => calls.filter((call) => call.path === "/api/pages/sitemap/");

test("closed and preview requests expose blocked text robots/empty XML and never read sitemap data", async () => {
  for (const headers of [{}, { cookie: "fd_preview_access=valid; sessionid=private", authorization: "Bearer private" }]) {
    const robots = await visit("/robots.txt", { headers });
    assert.equal(robots.status, 200);
    assert.match(robots.headers["content-type"], /^text\/plain/);
    assert.equal(robots.body, "User-agent: *\nDisallow: /\n");
    assert.equal(robots.headers["x-robots-tag"], "noindex, nofollow");
    const xml = await visit("/sitemap.xml?private=1", { headers });
    assert.match(xml.headers["content-type"], /^application\/xml/);
    assert.match(xml.body, /^<\?xml/);
    assert.doesNotMatch(xml.body, /<url>|STOREFRONT|sessionid|private/);
  }
  assert.equal(entries().length, 0);
});
test("public opening enables canonical robots and sanitized sitemap on the same runtime switch", async () => {
  publicOpen = true;
  const robots = await visit("/robots.txt");
  assert.match(robots.body, /Allow: \/\n/);
  assert.match(robots.body, /Sitemap: https:\/\/flexdrive.ge\/sitemap.xml/);
  assert.equal(robots.headers["x-robots-tag"], undefined);
  const xml = await visit("/sitemap.xml", { headers: { cookie: "sessionid=private; fd_preview_access=valid", authorization: "Bearer private" } });
  assert.equal(xml.status, 200);
  assert.equal((xml.body.match(/<url>/g) || []).length, 3);
  assert.match(xml.body, /<lastmod>2026-11-15T00:00:00.000Z<\/lastmod>/);
  assert.doesNotMatch(xml.body, /other.test|checkout|business|order-status|__preview|password|invalid|\?make|\?page|\?q/);
  assert.equal(entries().length, 1);
  assert.equal(entries()[0].headers.cookie, undefined);
  assert.equal(entries()[0].headers.authorization, undefined);
});
test("public starter and spoofed forwarded hosts remain noindex with no sitemap disclosure", async () => {
  publicOpen = true;
  for (const host of ["flexdrive-prod-front-pdzcv.ondigitalocean.app", "flexdrive.ge.evil.test", "localhost:3000"]) {
    const options = { host, headers: { "x-forwarded-host": "flexdrive.ge", "x-forwarded-proto": "https" } };
    assert.equal((await visit("/catalog", options)).headers["x-robots-tag"], "noindex, nofollow");
    assert.match((await visit("/robots.txt", options)).body, /Disallow: \/\n/);
    assert.doesNotMatch((await visit("/sitemap.xml", options)).body, /<url>/);
  }
  assert.equal(entries().length, 0);
});
test("global disabled/malformed indexing flags cannot become truthy runtime indexing", async () => {
  publicOpen = true;
  for (const value of [false, "false", "0", "tru", "", undefined]) {
    allowIndexing = value;
    assert.match((await visit("/robots.txt")).body, /Disallow: \/\n/);
    assert.doesNotMatch((await visit("/sitemap.xml")).body, /<url>/);
    assert.equal((await visit("/catalog")).headers["x-robots-tag"], "noindex, nofollow");
  }
  assert.equal(entries().length, 0);
});
test("status outages fail closed with resource format, retry hint, and no catalog request", async () => {
  healthy = false;
  for (const path of ["/robots.txt", "/sitemap.xml"]) {
    const response = await visit(path);
    assert.equal(response.status, 503);
    assert.equal(response.headers["retry-after"], "60");
    assert.equal(response.headers["x-robots-tag"], "noindex, nofollow");
    assert.doesNotMatch(response.body, /<url>|STOREFRONT|<html/);
  }
  assert.equal(entries().length, 0);
});
test("reclosing suppresses the sitemap immediately, including a browser with preview access", async () => {
  for (const open of [true, false, true]) {
    publicOpen = open;
    const xml = await visit("/sitemap.xml", { headers: { cookie: "fd_preview_access=valid" } });
    assert.equal(xml.body.includes("<url>"), open);
    assert.match(xml.headers["cache-control"], /private, no-store/);
  }
});
test("public private routes keep noindex even if a handler tries to mark them indexable", async () => {
  publicOpen = true;
  for (const path of ["/cart", "/login", "/profile/orders", "/checkout/payment/success", "/business/finance", "/order-status", "/__preview", "/auth/facebook/callback"]) {
    assert.equal((await visit(path)).headers["x-robots-tag"], "noindex, nofollow", path);
  }
  assert.equal((await visit("/catalog")).headers["x-robots-tag"], "index, follow");
});
test("GET/HEAD resources agree while mutations do not bypass the closed guard", async () => {
  for (const path of ["/robots.txt", "/sitemap.xml"]) {
    const head = await visit(path, { method: "HEAD" });
    assert.equal(head.status, 200); assert.equal(head.body, "");
    assert.equal((await visit(path, { method: "POST" })).status, 403);
  }
});
test("backend sitemap failures are errors instead of a successful fabricated empty sitemap", async () => {
  publicOpen = true; sitemapHealthy = false;
  assert.equal((await visit("/sitemap.xml")).status, 500);
  sitemapHealthy = true; malformed = true;
  assert.equal((await visit("/sitemap.xml")).status, 502);
});
