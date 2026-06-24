import {
  appendResponseHeader,
  createError,
  getRequestHeader,
  getRequestURL,
  setHeader,
  setResponseStatus,
  type H3Event,
} from "h3";

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "cookie",
  "referer",
  "user-agent",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-proto",
] as const;

const FORWARDED_RESPONSE_HEADERS = [
  "cache-control",
  "content-type",
  "expires",
  "pragma",
  "referrer-policy",
  "vary",
  "x-content-type-options",
] as const;

const getSetCookieHeaders = (response: Response) => {
  const headersWithSetCookie = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof headersWithSetCookie.getSetCookie === "function") {
    return headersWithSetCookie.getSetCookie();
  }

  const combinedHeader = response.headers.get("set-cookie");
  if (!combinedHeader) {
    return [];
  }

  return combinedHeader.split(/,(?=\s*[^;,\s]+=)/g).map((value) => value.trim());
};

const stripCookieDomain = (cookie: string) =>
  cookie.replace(/;\s*Domain=[^;]*/gi, "");

const escapeHtmlAttribute = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const renderRedirectBridge = (location: string) => {
  const escapedLocation = escapeHtmlAttribute(location);
  const serializedLocation = JSON.stringify(location);

  return `<!doctype html>
<html lang="ka">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="refresh" content="0;url=${escapedLocation}">
    <title>ავტორიზაცია გრძელდება</title>
  </head>
  <body>
    <p>ავტორიზაცია გრძელდება...</p>
    <p><a href="${escapedLocation}" rel="nofollow">გაგრძელება</a></p>
    <script>
      window.location.replace(${serializedLocation});
    </script>
  </body>
</html>`;
};

const buildUpstreamUrl = (event: H3Event, upstreamPath: string) => {
  const config = useRuntimeConfig(event);
  const upstreamBase = String(config.apiBaseUrl || "").trim();

  if (!upstreamBase) {
    throw createError({
      statusCode: 500,
      statusMessage: "Missing upstream API base URL.",
    });
  }

  const requestUrl = getRequestURL(event);
  const upstreamRoot = upstreamBase.endsWith("/") ? upstreamBase : `${upstreamBase}/`;
  const target = new URL(upstreamPath, upstreamRoot);
  target.search = requestUrl.search;

  return target.toString();
};

const buildForwardedHeaders = (event: H3Event) => {
  const headers = new Headers();

  for (const headerName of FORWARDED_REQUEST_HEADERS) {
    const value = getRequestHeader(event, headerName);
    if (value) {
      headers.set(headerName, value);
    }
  }

  return headers;
};

const forwardResponseHeaders = (event: H3Event, response: Response) => {
  for (const headerName of FORWARDED_RESPONSE_HEADERS) {
    const value = response.headers.get(headerName);
    if (value) {
      setHeader(event, headerName, value);
    }
  }

  for (const cookie of getSetCookieHeaders(response)) {
    appendResponseHeader(event, "set-cookie", stripCookieDomain(cookie));
  }
};

export const proxySocialOAuthRequest = async (
  event: H3Event,
  upstreamPath: string,
) => {
  const target = buildUpstreamUrl(event, upstreamPath);

  let upstreamResponse: Response;

  try {
    upstreamResponse = await fetch(target, {
      headers: buildForwardedHeaders(event),
      method: "GET",
      redirect: "manual",
    });
  } catch (error: any) {
    throw createError({
      statusCode: 502,
      statusMessage: error?.message || "OAuth upstream request failed.",
    });
  }

  const location = upstreamResponse.headers.get("location");
  forwardResponseHeaders(event, upstreamResponse);

  if (location && REDIRECT_STATUSES.has(upstreamResponse.status)) {
    setResponseStatus(event, 200);
    setHeader(event, "content-type", "text/html; charset=utf-8");
    setHeader(event, "cache-control", "no-store");
    return renderRedirectBridge(location);
  }

  setResponseStatus(event, upstreamResponse.status, upstreamResponse.statusText);
  return upstreamResponse.text();
};
