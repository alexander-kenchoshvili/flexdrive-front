import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript"), vue = require("vue");
const { parse, compileScript } = require("@vue/compiler-sfc");
const { renderToString } = require("@vue/server-renderer");
const source = (path) => readFileSync(new URL(`../app/${path}`, import.meta.url), "utf8");
const execute = (text, globals = {}, mocks = {}, tail = "return exports;") => {
  const { outputText } = ts.transpileModule(text.replaceAll("import.meta.server", "false"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  return new Function("require", "exports", ...Object.keys(globals), `${outputText}\n${tail}`)(
    (name) => mocks[name] ?? require(name), {}, ...Object.values(globals),
  );
};
const errors = execute(source("utils/authErrors.ts"));

test("only allowlisted missing email grants offer an explicit re-request", () => {
  for (const status of ["declined", "expired", "not_granted"]) {
    assert.equal(errors.canRetryFacebookEmail(`facebook_email_${status}`), true);
    assert.match(errors.translateAuthError(`facebook_email_${status}`), /ნებართვა/);
  }
  for (const code of [undefined, null, [], ["facebook_email_declined"], "facebook_email_unavailable", "facebook_email_check_unavailable", "facebook_email_retry_failed", "facebook_email_declined_extra"]) {
    assert.equal(errors.canRetryFacebookEmail(code), false);
  }
  assert.match(errors.translateAuthError("facebook_email_unavailable"), /ნებართვის მიუხედავად/);
  assert.match(errors.translateAuthError("facebook_email_check_unavailable"), /დროებით/);
  assert.match(errors.translateAuthError("facebook_email_retry_failed"), /ხელახალი მოთხოვნის შემდეგაც/);
  assert.equal(errors.translateAuthError("Facebook account did not provide an email address."), "Facebook-მა ელფოსტა არ მოგვაწოდა. სცადეთ შესვლის სხვა მეთოდი.");
});

test("actual Facebook button explains the opt-in and only changes its URL for recoverable errors", async () => {
  const { descriptor } = parse(source("components/common/FacebookAuthButton.vue"));
  for (const code of [undefined, "facebook_email_declined", "facebook_email_unavailable", "facebook_email_retry_failed"]) {
    const captures = [];
    const component = execute(compileScript(descriptor, { id: "facebook-retry", inlineTemplate: true }).content, {
      computed: vue.computed, useRoute: () => ({ query: { facebook_error: code } }),
    }, { "~/utils/authErrors": errors }).default;
    const app = vue.createSSRApp(component, { redirectTo: "/profile", returnPath: "/login", disabled: true });
    app.component("SocialAuthButton", {
      props: ["label", "startPath", "redirectTo", "returnPath", "disabled"],
      setup(props) { captures.push(props); return () => vue.h("button", { disabled: props.disabled }, props.label); },
    });
    const html = await renderToString(app);
    const retry = code === "facebook_email_declined";
    assert.equal(captures[0].startPath, `/auth/facebook/start${retry ? "?rerequest_email=1" : ""}`);
    assert.equal(captures[0].redirectTo, "/profile");
    assert.equal(captures[0].returnPath, "/login");
    assert.equal(captures[0].disabled, true);
    assert.equal(html.includes("ხელახლა გკითხავთ"), retry);
    assert.equal(html.includes("ელფოსტის გაზიარებით გაგრძელება"), retry);
  }
});

test("actual shared OAuth button preserves the retry flag, callback context and click-only navigation", () => {
  const { descriptor } = parse(source("components/common/SocialAuthButton.vue"));
  const navigations = [];
  const props = { startPath: "/auth/facebook/start?rerequest_email=1", redirectTo: "/profile?tab=orders", returnPath: "/login", loading: false, disabled: false };
  const controls = execute(descriptor.scriptSetup.content, {
    defineProps: () => props, withDefaults: (values, defaults) => ({ ...defaults, ...values }),
    defineEmits: () => () => {}, ref: vue.ref, computed: vue.computed,
    useRoute: () => ({ fullPath: "/login" }), document: { referrer: "" }, navigator: { userAgent: "Mozilla" },
    window: { location: { origin: "https://flexdrive.ge", assign: (url) => navigations.push(url) } },
  }, { "~/utils/authErrors": errors }, "return { buildStartUrl, handleClick };");
  assert.equal(navigations.length, 0);
  controls.handleClick();
  const url = new URL(navigations[0]);
  assert.equal(url.origin + url.pathname, "https://flexdrive.ge/auth/facebook/start");
  assert.equal(url.searchParams.get("rerequest_email"), "1");
  assert.equal(url.searchParams.get("next"), "/profile?tab=orders");
  assert.equal(url.searchParams.get("return_path"), "/login");
  controls.handleClick();
  assert.equal(navigations.length, 1);
});
