import {
  createError, getCookie, getRequestHeader, getRequestURL,
  send, sendRedirect, setCookie, setHeader, setResponseStatus,
  type H3Event,
} from "h3";
import { PREVIEW_COOKIE } from "../../app/utils/storefrontPreview";

type GuardConfig = { enabled: unknown; apiBaseUrl: string; production: boolean };
type AccessState = { guard_enabled: boolean; public_open: boolean; preview_allowed: boolean };

// Only recognized disabled values opt out; a misspelled activation fails closed.
export const guardEnabled = (value: unknown) => value !== false && value != null
  && !["false", "0", "no", "off"].includes(String(value).toLowerCase().trim());

export const preventStorefrontCaching = (event: H3Event) => {
  setHeader(event, "cache-control", "private, no-store");
  setHeader(event, "pragma", "no-cache");
  setHeader(event, "expires", "0");
  // All guarded responses vary by the tester's host-only cookie.
  const current = String(event.node.res.getHeader("vary") || "");
  setHeader(event, "vary", [...new Set([...current.split(",").map((v) => v.trim()).filter(Boolean), "Cookie"])].join(", "));
};

const readAccessState = async (event: H3Event, config: GuardConfig, code = getCookie(event, PREVIEW_COOKIE)): Promise<AccessState> => {
  const base = new URL(config.apiBaseUrl.endsWith("/") ? config.apiBaseUrl : `${config.apiBaseUrl}/`);
  if (!["http:", "https:"].includes(base.protocol) || base.username || base.password) throw new Error("Invalid API configuration");
  const response = await fetch(new URL("launch/status/", base), {
    headers: { accept: "application/json", ...(code && code.length <= 512 ? { cookie: `${PREVIEW_COOKIE}=${encodeURIComponent(code)}` } : {}) },
    redirect: "error", cache: "no-store", signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) throw new Error("Access state unavailable");
  const state: AccessState = await response.json();
  if (state.guard_enabled !== true || typeof state.public_open !== "boolean" || typeof state.preview_allowed !== "boolean") {
    throw new Error("Access control is not active");
  }
  return state;
};

const renderHoldingPage = (form = false, invalidCode = false, unavailable = false) => `<!doctype html>
<html lang="ka"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>FlexDrive — მალე გავეშვებით</title>
<style>body{margin:0;background:#f6f7f3;color:#20251a;font:17px/1.7 system-ui,sans-serif;display:grid;min-height:100dvh;place-items:center}main{max-width:540px;margin:24px;padding:36px;background:white;border:1px solid #e1e5db;border-radius:12px}h1{font-size:32px;line-height:1.3}a{color:#4f6f1f}label{display:block}input{box-sizing:border-box;width:100%;padding:12px;font:inherit;margin:8px 0 16px;border:1px solid #9ba98a;border-radius:6px}button{background:#4f6f1f;color:white;border:0;border-radius:6px;padding:12px 20px;font:inherit;cursor:pointer}.error{color:#a12622}</style></head>
<body><main><strong>FlexDrive</strong><h1>მალე გავეშვებით</h1><p>${unavailable ? "საიტი დროებით მიუწვდომელია. გთხოვთ, მოგვიანებით სცადოთ." : "საიტის გახსნისთვის ვემზადებით. მალე აქ ავტონაწილების შერჩევასა და შეკვეთას შეძლებთ."}</p>
${form && !unavailable ? `<form action="/__preview" method="post"><label for="code">სატესტო შესვლის კოდი</label><input id="code" name="code" type="password" maxlength="512" autocomplete="off" required>${invalidCode ? '<p class="error" role="alert">კოდი არასწორია ან ვადა გაუვიდა.</p>' : ""}<button type="submit">შესვლა</button></form>` : unavailable ? "" : '<a href="/__preview">სატესტო შესვლა</a>'}</main></body></html>`;

const sendHoldingPage = (event: H3Event, status: number, form = false, invalid = false, unavailable = false) => {
  setResponseStatus(event, status);
  setHeader(event, "content-type", "text/html; charset=utf-8");
  setHeader(event, "content-security-policy", "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
  setHeader(event, "x-frame-options", "DENY");
  // Preserve the same-origin Origin header on native form POSTs.
  setHeader(event, "referrer-policy", "same-origin");
  setHeader(event, "x-robots-tag", "noindex, nofollow");
  if (status === 503) setHeader(event, "retry-after", 60);
  return send(event, renderHoldingPage(form, invalid, unavailable));
};

const isProviderCallback = (path: string, method: string) => method === "POST" && (
  path === "/api/commerce/payments/bog/callback/"
  || /^\/api\/commerce\/wingo\/webhook\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{64}\/$/.test(path)
);

const sendAccessError = (event: H3Event, status: number, code: string) => {
  setResponseStatus(event, status);
  setHeader(event, "content-type", "application/json; charset=utf-8");
  return send(event, JSON.stringify({ code }));
};

const readPreviewCode = async (event: H3Event, production: boolean) => {
  const origin = getRequestHeader(event, "origin");
  const host = getRequestHeader(event, "host");
  let validOrigin = false;
  try {
    const source = new URL(origin || "");
    validOrigin = source.host === host && source.origin === origin && (production ? source.protocol === "https:" : ["https:", "http:"].includes(source.protocol));
  } catch { /* Missing and opaque origins are rejected. */ }
  if (!validOrigin) throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  if (!/^application\/x-www-form-urlencoded(?:;|$)/i.test(getRequestHeader(event, "content-type") || "")) {
    throw createError({ statusCode: 415, statusMessage: "Unsupported media type" });
  }
  // Bound the actual stream too, including requests with no Content-Length.
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of event.node.req) {
    const buffer = typeof chunk === "string" ? new TextEncoder().encode(chunk) : new Uint8Array(chunk);
    size += buffer.length;
    if (size > 2048) throw createError({ statusCode: 413, statusMessage: "Request too large" });
    chunks.push(buffer);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const body = new URLSearchParams(new TextDecoder().decode(bytes));
  const code = body.get("code") || "";
  return code.length <= 512 ? code : "";
};

export const guardStorefrontRequest = async (event: H3Event, config: GuardConfig) => {
  if (!guardEnabled(config.enabled)) return;
  preventStorefrontCaching(event);
  const path = getRequestURL(event, { xForwardedHost: false }).pathname;
  if (isProviderCallback(path, event.method)) return; // The backend still verifies provider identity/signatures.
  const previewForm = path === "/__preview";
  if (previewForm && !["GET", "HEAD", "POST"].includes(event.method)) {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }
  const submittedCode = previewForm && event.method === "POST" ? await readPreviewCode(event, config.production) : undefined;
  let state: AccessState;
  try {
    state = await readAccessState(event, config, submittedCode);
  } catch {
    if (path.startsWith("/api/") || !["GET", "HEAD"].includes(event.method)) {
      return sendAccessError(event, 503, "storefront_unavailable");
    }
    return sendHoldingPage(event, 503, false, false, true);
  }
  event.context.storefrontPreviewOnly = !state.public_open;
  if (previewForm) {
    if (state.public_open) return sendRedirect(event, "/", 303);
    if (event.method === "POST") {
      if (!submittedCode || !state.preview_allowed) return sendHoldingPage(event, 403, true, true);
      setCookie(event, PREVIEW_COOKIE, submittedCode, {
        httpOnly: true, secure: config.production, sameSite: "lax", path: "/", maxAge: 86400,
      });
      return sendRedirect(event, "/", 303);
    }
    return sendHoldingPage(event, 200, true);
  }
  if (state.public_open || state.preview_allowed) {
    if (!state.public_open) setHeader(event, "x-robots-tag", "noindex, nofollow");
    return;
  }
  if (path.startsWith("/api/") || !["GET", "HEAD"].includes(event.method)) {
    return sendAccessError(event, 403, "storefront_not_open");
  }
  // A planned closed storefront is a valid page. App Platform replaces 5xx bodies.
  // Actual status/backend failures above still return 503 and deny access.
  return sendHoldingPage(event, 200);
};
