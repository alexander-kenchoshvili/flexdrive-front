import type { H3Event } from "h3";

const MAX_PER_MINUTE = 20;
let windowStart = 0, windowCount = 0;
const TYPES = new Set(["Error", "TypeError", "ReferenceError", "RangeError", "SyntaxError", "FetchError", "H3Error"]);
const CODES = new Set(["ERR_INVALID_CHAR", "ERR_HTTP_INVALID_STATUS_CODE", "ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "UND_ERR_CONNECT_TIMEOUT"]);

const routeKind = (path: string) => {
  const pathname = path.split("?")[0] || "";
  return pathname === "/" ? "home" : /^\/catalog\/?$/.test(pathname) ? "catalog"
    : /^\/catalog\/[^/]+\/?$/.test(pathname) && !pathname.includes("%") ? "product" : null;
};

const describe = (value: Record<string, unknown>) => {
  const message = typeof value.message === "string" ? value.message : "";
  const response = value.response as { status?: unknown } | undefined;
  const status = value.statusCode ?? value.status ?? response?.status;
  const stack = typeof value.stack === "string" ? value.stack : "";
  // Keep only build-file locations. Never print raw error messages, URLs, paths,
  // request headers, credentials, query strings, bodies or customer identifiers.
  const locations = [...stack.matchAll(/\.output\/server\/((?:chunks\/)?[A-Za-z0-9_./-]+\.(?:mjs|js):\d+:\d+)/g)]
    .slice(0, 4).map((match) => match[1]);
  return {
    type: TYPES.has(String(value.name)) ? String(value.name) : "Error",
    status: typeof status === "number" && Number.isInteger(status) && status >= 400 && status <= 599 ? status : null,
    code: CODES.has(String(value.code)) ? String(value.code) : null,
    hint: message.includes("Nuxt instance is unavailable") || message.includes("nuxt instance unavailable") ? "nuxt_context"
      : /Cannot read properties of (undefined|null)/.test(message) ? "missing_value"
      : /Invalid character in (statusMessage|header content)/.test(message) ? "invalid_header"
      : /fetch failed|network error/i.test(message) ? "network" : "unclassified",
    locations,
  };
};

export const recordPublicPageFailure = (
  error: unknown, event?: H3Event, write: (line: string) => void = console.error,
) => {
  try {
    if (!event || !["GET", "HEAD"].includes(event.method)) return;
    const route = routeKind(event.path);
    if (!route || event.context.publicPageFailureLogged) return;
    const details = [], seen = new Set();
    let current = error;
    for (let index = 0; index < 3 && current && typeof current === "object" && !seen.has(current); index++) {
      seen.add(current);
      details.push(describe(current as Record<string, unknown>));
      current = (current as { cause?: unknown }).cause;
    }
    if (!details.length || (details[0]!.status !== null && details[0]!.status! < 500)) return;
    const now = Date.now();
    if (now - windowStart >= 60_000) { windowStart = now; windowCount = 0; }
    if (windowCount >= MAX_PER_MINUTE) return;
    windowCount++;
    event.context.publicPageFailureLogged = true;
    write(JSON.stringify({ event: "public_page_failure", version: 1, route, errors: details }));
  } catch {
    // A diagnostic or logger failure must never change the actual response.
  }
};
