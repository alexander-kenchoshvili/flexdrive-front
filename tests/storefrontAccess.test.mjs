import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer, request as httpRequest } from "node:http";
import { createRequire } from "node:module";
import { Readable } from "node:stream";
import { after, before, beforeEach, test } from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const h3 = require("h3");
const loadTs = (relative, mocks = {}, globals = {}) => {
  const source = readFileSync(new URL(relative, import.meta.url), "utf8")
    .replaceAll("import.meta.server", "true").replaceAll("import.meta.client", "false");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const exports = {};
  new Function("require", "exports", ...Object.keys(globals), outputText)(
    (name) => mocks[name] ?? require(name), exports, ...Object.values(globals),
  );
  return exports;
};
const preview = loadTs("../app/utils/storefrontPreview.ts");
const access = loadTs("../server/utils/storefrontAccess.ts", { "../../app/utils/storefrontPreview": preview });
const code = "signed-preview:timestamp:signature";
let publicOpen, healthy, backendEnabled, enabled, requests, legalHealthy;
let apiServer, frontServer, apiURL, frontURL, beforeResponse;
const config = () => ({ storefrontAccessGuardEnabled: enabled, apiBaseUrl: apiURL });
const listen = (server) => new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(`http://127.0.0.1:${server.address().port}`)));

before(async () => {
  apiServer = createServer((req, res) => {
    requests.push({ url: req.url, headers: req.headers });
    const authorized = (req.headers.cookie || "").split(";").some((part) => decodeURIComponent(part.trim()) === `${preview.PREVIEW_COOKIE}=${code}`);
    res.setHeader("content-type", "application/json");
    if (req.url === "/api/launch/status/") {
      res.statusCode = healthy ? 200 : 503;
      res.end(JSON.stringify(healthy ? { guard_enabled: backendEnabled, public_open: publicOpen, preview_allowed: authorized } : { code: "unavailable" }));
    } else if (/^\/api\/launch\/information\/(terms|privacy-policy)\/$/.test(req.url)) {
      res.statusCode = legalHealthy ? 200 : 503;
      const slug = req.url.split("/").at(-2);
      res.end(JSON.stringify({ slug, title: "Legal <test>", intro: "Existing policy", sections: [{ title: "Section <test>", html: "<p>Public legal text</p>" }] }));
    } else {
      res.statusCode = publicOpen || authorized ? 200 : 403;
      res.setHeader("cache-control", "public, max-age=3600");
      res.end(JSON.stringify({ catalog: "upstream", authorized }));
    }
  });
  apiURL = `${await listen(apiServer)}/api`;
  loadTs("../server/plugins/storefront-access-cache.ts", { "../utils/storefrontAccess": access }, {
    useRuntimeConfig: config,
    defineNitroPlugin: (callback) => callback({ hooks: { hook: (_name, handler) => { beforeResponse = handler; } } }),
  });
  const proxy = loadTs("../server/routes/api/[...path].ts", { "../../utils/storefrontAccess": access }, { useRuntimeConfig: config }).default;
  const app = h3.createApp({ onBeforeResponse: (event) => beforeResponse(event) });
  app.use(h3.defineEventHandler((event) => access.guardStorefrontRequest(event, { enabled, apiBaseUrl: apiURL, production: true })));
  app.use(h3.defineEventHandler((event) => {
    if (event.path.startsWith("/api/")) return proxy(event);
    h3.setHeader(event, "cache-control", "public, max-age=3600");
    return "STOREFRONT";
  }));
  frontServer = createServer(h3.toNodeListener(app));
  frontURL = await listen(frontServer);
});
beforeEach(() => { publicOpen = false; healthy = true; backendEnabled = true; enabled = true; legalHealthy = true; requests = []; });
after(async () => {
  await Promise.all([frontServer, apiServer].map((server) => new Promise((resolve) => { server.closeAllConnections(); server.close(resolve); })));
});

const visit = (path = "/", options = {}) => new Promise((resolve, reject) => {
  const headers = { host: "flexdrive.ge", ...options.headers };
  const body = options.body instanceof URLSearchParams ? options.body.toString() : options.body;
  if (options.body instanceof URLSearchParams) headers["content-type"] = "application/x-www-form-urlencoded;charset=UTF-8";
  const req = httpRequest(`${frontURL}${path}`, { method: options.method || "GET", headers, signal: AbortSignal.timeout(5000) }, (res) => {
    const chunks = [];
    res.on("data", (chunk) => chunks.push(chunk));
    res.on("end", () => {
      const responseHeaders = new Headers();
      for (let i = 0; i < res.rawHeaders.length; i += 2) responseHeaders.append(res.rawHeaders[i], res.rawHeaders[i + 1]);
      resolve(new Response(Buffer.concat(chunks), { status: res.statusCode, headers: responseHeaders }));
    });
    res.on("error", reject);
  });
  req.on("error", reject);
  if (body instanceof Readable) body.pipe(req);
  else req.end(body);
});
const unlock = (value = code, extra = {}) => visit("/__preview", {
  method: "POST", body: new URLSearchParams({ code: value }),
  headers: { origin: "https://flexdrive.ge", ...extra },
});

test("all storefront hosts show a private holding page, without HTML application data", async () => {
  for (const host of ["flexdrive.ge", "www.flexdrive.ge", "flexdrive-prod-front-pdzcv.ondigitalocean.app"]) {
    const response = await visit("/catalog?q=private", { headers: { host, "x-forwarded-host": "trusted.example.test", authorization: "Bearer unrelated" } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("retry-after"), null);
    assert.match(response.headers.get("cache-control"), /private, no-store/);
    assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
    const html = await response.text();
    assert.match(html, /მალე გავეშვებით/);
    assert.doesNotMatch(html, /STOREFRONT|<script|private/);
  }
  assert.ok(requests.every((r) => r.url === "/api/launch/status/" && !r.headers.authorization));
});

test("closed API and mutations do not reach the storefront or upstream business endpoint", async () => {
  for (const [path, method] of [["/api/catalog/", "GET"], ["/api/commerce/orders/checkout/", "POST"], ["/auth/google/start", "GET"]]) {
    const response = await visit(path, { method });
    assert.equal(response.status, path.startsWith("/api/") || method === "POST" ? 403 : 200);
    assert.doesNotMatch(await response.text(), /STOREFRONT|"catalog"/);
  }
  assert.ok(requests.every((r) => r.url === "/api/launch/status/"));
});

test("preview form accepts only same-origin POST and sets a host-only secure HttpOnly cookie", async () => {
  const form = await visit("/__preview");
  assert.equal(form.status, 200);
  assert.equal(form.headers.get("referrer-policy"), "same-origin");
  assert.match(form.headers.get("content-security-policy"), /form-action 'self'/);
  const response = await unlock();
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/");
  const cookie = response.headers.get("set-cookie");
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Max-Age=86400/);
  assert.doesNotMatch(cookie, /Domain=/i);
  const allowed = await visit("/catalog", { headers: { cookie: cookie.split(";")[0] } });
  assert.equal(allowed.status, 200);
  assert.equal(await allowed.text(), "STOREFRONT");
  assert.match(allowed.headers.get("cache-control"), /private, no-store/);
  assert.equal(allowed.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.ok(requests.every((r) => !r.url.includes(code)));
});

test("an unlocked browser's actual API proxy forwards its cookie and remains uncached", async () => {
  const response = await visit("/api/catalog/?page=2", { headers: { cookie: `${preview.PREVIEW_COOKIE}=${encodeURIComponent(code)}; account=unrelated` } });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).authorized, true);
  assert.match(response.headers.get("cache-control"), /private, no-store/);
  assert.equal(requests[0].headers.cookie, `${preview.PREVIEW_COOKIE}=${encodeURIComponent(code)}`);
  assert.equal(requests[1].url, "/api/catalog/?page=2");
});

test("invalid and expired codes do not set cookies or reflect their contents", async () => {
  const response = await unlock('invalid-<script>alert(1)</script>');
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("set-cookie"), null);
  const body = await response.text();
  assert.match(body, /კოდი არასწორია/);
  assert.doesNotMatch(body, /alert\(1\)/);
  const invalid = await visit("/catalog", { headers: { cookie: `${preview.PREVIEW_COOKIE}=expired` } });
  assert.equal(invalid.status, 200);
});

test("cross-origin, missing origin, insecure origin and forwarded-host spoof cannot unlock", async () => {
  for (const origin of ["https://evil.test", "null", "http://flexdrive.ge", ""]) {
    const response = await unlock(code, { origin, "x-forwarded-host": "evil.test" });
    assert.equal(response.status, 403);
    assert.equal(response.headers.get("set-cookie"), null);
  }
  assert.equal(requests.length, 0);
});

test("preview input is bounded for oversized chunked bodies and unsupported methods", async () => {
  const response = await visit("/__preview", {
    method: "POST", headers: { origin: "https://flexdrive.ge", "content-type": "application/x-www-form-urlencoded" },
    body: Readable.from(["code=", "x".repeat(2049)]), duplex: "half",
  });
  assert.equal(response.status, 413);
  assert.equal((await visit("/__preview", { method: "DELETE" })).status, 405);
  assert.equal(requests.length, 0);
});

test("backend outage or disabled/mismatched backend protection fails closed", async () => {
  for (const mismatch of [false, true]) {
    healthy = mismatch; backendEnabled = false;
    const response = await visit("/catalog", { headers: { cookie: `${preview.PREVIEW_COOKIE}=${code}` } });
    assert.equal(response.status, 503);
    assert.doesNotMatch(await response.text(), /STOREFRONT|127\.0\.0\.1|stack/i);
  }
});

test("one backend switch opens and recloses the site immediately without redeployment", async () => {
  for (const open of [true, false, true]) {
    publicOpen = open;
    const response = await visit("/catalog");
    assert.equal(response.status, 200);
    assert.equal((await response.text()).includes("STOREFRONT"), open);
  }
});

test("only exact POST bank and Wingo callbacks pass to the existing API proxy", async () => {
  const wingo = `/api/commerce/wingo/webhook/12345678-1234-1234-1234-123456789abc/${"a".repeat(64)}/`;
  const bog = "/api/commerce/payments/bog/callback/";
  for (const path of [wingo, bog]) {
    requests = [];
    await visit(path, { method: "POST" });
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, path);
    assert.equal((await visit(path)).status, 403);
    assert.equal((await visit(path + "forged/", { method: "POST" })).status, 403);
  }
});

test("disabled frontend environment leaves existing storefront behavior unchanged", async () => {
  enabled = false;
  const response = await visit("/catalog");
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "STOREFRONT");
  assert.equal(response.headers.get("cache-control"), "public, max-age=3600");
  assert.equal(requests.length, 0);
});

test("SSR forwards only its preview cookie to the exact configured API, never another origin or path", () => {
  const api = "https://api.flexdrive.ge/api";
  const cookie = `account=private; ${preview.PREVIEW_COOKIE}=${code}; csrftoken=private`;
  assert.equal(preview.previewCookieForUpstream("/pages/menu/", api, api, cookie), `${preview.PREVIEW_COOKIE}=${code}`);
  assert.equal(preview.previewCookieForUpstream(`${api}/catalog/`, api, api, cookie), `${preview.PREVIEW_COOKIE}=${code}`);
  for (const target of ["https://evil.test/api/catalog/", "//evil.test/catalog/", "https://api.flexdrive.ge/other/", "https://api.flexdrive.ge/api/../other/", "https://api.flexdrive.ge.evil.test/api/"]) {
    assert.equal(preview.previewCookieForUpstream(target, api, api, cookie), undefined);
  }
});

test("the actual SSR fetch composable carries preview access without leaking account cookies", async () => {
  const api = "https://api.flexdrive.ge/api";
  const secure = loadTs("../app/composables/secureFetch.ts", { "~/utils/storefrontPreview": preview }, {
    useApiBaseUrl: () => api,
    useRuntimeConfig: () => ({ apiBaseUrl: api }),
    useRequestHeaders: () => ({ cookie: `account=private; ${preview.PREVIEW_COOKIE}=${code}` }),
  });
  const options = await secure.buildSecureFetchOptions("/pages/menu/", {});
  assert.equal(options.headers.cookie, `${preview.PREVIEW_COOKIE}=${code}`);
  const external = await secure.buildSecureFetchOptions("https://other.test/endpoint", {});
  assert.equal(external.headers.cookie, undefined);
  const existing = await secure.buildSecureFetchOptions("/accounts/me/", { headers: { cookie: `account=private; ${preview.PREVIEW_COOKIE}=${code}` } });
  assert.match(existing.headers.cookie, /account=private/);
});

test("misspelled frontend activation cannot disable the guard", () => {
  assert.equal(access.guardEnabled("tru"), true);
  assert.equal(access.guardEnabled(""), true);
  assert.equal(access.guardEnabled("false"), false);
  assert.equal(access.guardEnabled(false), false);
});


test("holding homepage describes FlexDrive and links the public legal documents", async () => {
  const response = await visit("/");
  const html = await response.text();
  assert.match(html, /ავტონაწილების ონლაინ მაღაზია საქართველოში/);
  assert.match(html, /href="\/privacy-policy"/);
  assert.match(html, /href="\/terms"/);
  assert.match(html, /href="mailto:support@flexdrive.ge"/);
  assert.doesNotMatch(html, /<script|STOREFRONT/);
  assert.equal(response.headers.get("set-cookie"), null);
});

test("only two exact legal paths expose script-free CMS documents without preview credentials", async () => {
  for (const path of ["/terms", "/terms/", "/privacy-policy", "/privacy-policy/?slug=catalog&content_id=1"]) {
    requests = [];
    const response = await visit(path, { headers: { cookie: "sessionid=private; fd_preview_access=invalid", authorization: "Bearer private" } });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control"), /private, no-store/);
    assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
    assert.equal(response.headers.get("set-cookie"), null);
    const html = await response.text();
    assert.match(html, /Legal &lt;test&gt;/);
    assert.match(html, /Section &lt;test&gt;/);
    assert.match(html, /<p>Public legal text<\/p>/);
    assert.doesNotMatch(html, /<script|STOREFRONT|<test>/);
    const upstream = requests.at(-1);
    assert.match(upstream.url, /^\/api\/launch\/information\/(terms|privacy-policy)\/$/);
    assert.equal(upstream.headers.cookie, undefined);
    assert.equal(upstream.headers.authorization, undefined);
  }
  const head = await visit("/terms", { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  for (const open of [false, true]) {
    publicOpen = open;
    const response = await visit("/terms", { headers: { cookie: `${preview.PREVIEW_COOKIE}=${code}` } });
    assert.equal(await response.text(), "STOREFRONT");
  }
});

test("public legal documents do not permit path tricks, CMS API access, or mutations", async () => {
  for (const path of ["/terms/extra", "/Terms", "/privacy-policy-extra", "/api/pages/terms/", "/api/launch/information/terms/"]) {
    requests = [];
    const response = await visit(path);
    assert.doesNotMatch(await response.text(), /Public legal text|STOREFRONT/);
    assert.ok(requests.every((request) => request.url === "/api/launch/status/"));
  }
  assert.equal((await visit("/terms", { method: "POST" })).status, 403);
  assert.equal((await visit("/privacy-policy", { method: "DELETE" })).status, 403);
  assert.equal((await visit("/catalog")).status, 200);
});

test("legal data failure fails closed without reflecting upstream details", async () => {
  legalHealthy = false;
  const response = await visit("/privacy-policy");
  assert.equal(response.status, 503);
  assert.match(response.headers.get("cache-control"), /private, no-store/);
  assert.doesNotMatch(await response.text(), /Public legal text|STOREFRONT|stack|127\.0\.0\.1/);
});
