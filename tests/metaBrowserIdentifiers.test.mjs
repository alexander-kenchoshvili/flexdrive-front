import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
const require=createRequire(import.meta.url), ts=require("typescript");
const output=ts.transpileModule(readFileSync(new URL("../app/utils/metaBrowserIdentifiers.ts",import.meta.url),"utf8").replaceAll("import.meta.client","true"), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function headers(cookie, consent=true, host="flexdrive.ge") {
  const exports={};
  new Function("require","exports","window","document",output)(() => ({isProductionTrackingHost:(value)=>value==="flexdrive.ge"}),exports,{location:{hostname:host}},{get cookie(){if(cookie instanceof Error)throw cookie; return cookie;}});
  return exports.metaBrowserIdentifierHeaders(consent);
}
const fbp="fb.1.1700000000000.12345", fbc="fb.1.1700000000000.MetaClick_CaseSensitive";
test("only genuine existing cookie values are forwarded without hashing or case changes",()=>{
  assert.deepEqual(headers(`csrftoken=private; _fbp=${fbp}; _fbc=${fbc}; sessionid=private`),{"X-FlexDrive-Meta-Fbp":fbp,"X-FlexDrive-Meta-Fbc":fbc});
});
test("no consent, non-production host and direct traffic produce no invented click",()=>{
  assert.deepEqual(headers(`_fbp=${fbp}; _fbc=${fbc}`,false),{});
  assert.deepEqual(headers(`_fbp=${fbp}`,true,"localhost"),{});
  assert.deepEqual(headers(`_fbp=${fbp}`),{"X-FlexDrive-Meta-Fbp":fbp});
});
test("malformed, oversized and inaccessible cookies never affect checkout",()=>{
  for(const value of ["_fbp=email@example.com; _fbc=private", "_fbc=fb.1.1700000000000."+"a".repeat(401), "_fbp=%ZZ",new Error("blocked")]) assert.deepEqual(headers(value),{});
});
