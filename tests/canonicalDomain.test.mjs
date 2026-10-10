import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const { outputText } = ts.transpileModule(
  readFileSync(new URL("../server/middleware/canonical-domain.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
);
const exports = {};
const h3 = require("h3");
const redirects = [];
new Function("require", "exports", outputText)(
  () => ({ ...h3, sendRedirect: (_event, target, status) => { redirects.push({ target, status }); } }),
  exports,
);
const request = (host, path = "/", method = "GET", headers = {}) =>
  exports.default(h3.createEvent(
    { url: path, method, headers: { host, ...headers }, connection: {} },
    { statusCode: 200 },
  ));

test("www browser requests retain their path/query on the fixed HTTPS main domain", () => {
  for (const [host, method] of [["www.flexdrive.ge", "GET"], ["WWW.FLEXDRIVE.GE:443", "HEAD"]]) {
    redirects.length = 0;
    request(host, "/catalog?q=%E1%83%A4%E1%83%90%E1%83%A0%E1%83%98&page=2", method);
    assert.deepEqual(redirects, [{
      target: "https://flexdrive.ge/catalog?q=%E1%83%A4%E1%83%90%E1%83%A0%E1%83%98&page=2",
      status: 308,
    }]);
  }
});

test("main/local/preview/lookalike hosts and POST callbacks are not redirected", () => {
  redirects.length = 0;
  for (const host of ["flexdrive.ge", "localhost:3000", "flexdrive-front.vercel.app",
    "flexdrive-prod-front-pdzcv.ondigitalocean.app", "www.flexdrive.ge.evil.test", ""]) {
    request(host, "/", "GET", { "x-forwarded-host": "www.flexdrive.ge" });
  }
  request("www.flexdrive.ge", "/api/payment/callback", "POST");
  assert.deepEqual(redirects, []);
});

test("forwarded hosts and URL-shaped paths cannot change the redirect destination", () => {
  redirects.length = 0;
  request("www.flexdrive.ge", "//evil.test/catalog?q=test", "GET", { "x-forwarded-host": "evil.test" });
  assert.equal(new URL(redirects[0].target).origin, "https://flexdrive.ge");
});
