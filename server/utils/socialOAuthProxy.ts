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
    <style>
      :root {
        color-scheme: light dark;
        --bg-primary: #f8faf4;
        --bg-secondary: #eef3e8;
        --surface: #ffffff;
        --surface-2: #f3f6ee;
        --text-primary: #111827;
        --text-secondary: #3f4a3a;
        --text-muted: #596256;
        --border-default: #d7e0cd;
        --accent-primary: #4f6f1f;
        --accent-soft: #e8f1d6;
        --focus-ring: #5b7f24;
        --shadow-color: rgba(17, 24, 39, 0.12);
      }

      @media (prefers-color-scheme: dark) {
        :root {
          --bg-primary: #0e160b;
          --bg-secondary: #121d0f;
          --surface: #121a10;
          --surface-2: #182316;
          --text-primary: #f7faf2;
          --text-secondary: #d7e2cc;
          --text-muted: #aebda1;
          --border-default: #34452a;
          --accent-primary: #b7dd66;
          --accent-soft: #263a1c;
          --focus-ring: #b7dd66;
          --shadow-color: rgba(0, 0, 0, 0.58);
        }
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        min-height: 100%;
        margin: 0;
      }

      body {
        display: grid;
        min-height: 100vh;
        place-items: center;
        padding: 24px;
        background:
          radial-gradient(circle at top left, var(--accent-soft), transparent 34%),
          linear-gradient(135deg, var(--bg-primary), var(--bg-secondary));
        color: var(--text-primary);
        font-family:
          "Noto Sans Georgian",
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      main {
        width: min(100%, 420px);
        padding: 28px;
        border: 1px solid var(--border-default);
        border-radius: 18px;
        background: var(--surface);
        box-shadow: 0 22px 70px var(--shadow-color);
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 22px;
        font-size: 18px;
        font-weight: 800;
        letter-spacing: 0;
      }

      .brand-mark {
        display: grid;
        width: 38px;
        height: 38px;
        place-items: center;
        border-radius: 12px;
        background: var(--accent-primary);
        color: var(--bg-primary);
        font-size: 17px;
        line-height: 1;
      }

      .status {
        display: flex;
        align-items: flex-start;
        gap: 14px;
      }

      .spinner {
        width: 28px;
        height: 28px;
        flex: 0 0 auto;
        border: 3px solid var(--accent-soft);
        border-top-color: var(--accent-primary);
        border-radius: 999px;
        animation: spin 0.8s linear infinite;
      }

      h1 {
        margin: 0;
        font-size: 20px;
        font-weight: 800;
        line-height: 1.35;
      }

      p {
        margin: 8px 0 0;
        color: var(--text-secondary);
        font-size: 14px;
        line-height: 1.65;
      }

      .fallback {
        display: inline-flex;
        min-height: 42px;
        align-items: center;
        justify-content: center;
        margin-top: 22px;
        padding: 0 16px;
        border: 1px solid var(--border-default);
        border-radius: 12px;
        background: var(--surface-2);
        color: var(--text-primary);
        font-size: 14px;
        font-weight: 700;
        text-decoration: none;
      }

      .fallback:focus-visible {
        outline: 2px solid var(--focus-ring);
        outline-offset: 2px;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 420px) {
        body {
          padding: 16px;
        }

        main {
          padding: 22px;
          border-radius: 16px;
        }

        h1 {
          font-size: 18px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .spinner {
          animation: none;
        }
      }
    </style>
  </head>
  <body>
    <main aria-live="polite">
      <div class="brand" aria-label="FlexDrive">
        <span class="brand-mark" aria-hidden="true">FD</span>
        <span>FlexDrive</span>
      </div>

      <div class="status">
        <span class="spinner" aria-hidden="true"></span>
        <div>
          <h1>ავტორიზაცია გრძელდება</h1>
          <p>რამდენიმე წამში უსაფრთხოდ გადაგიყვანთ შემდეგ ეტაპზე.</p>
        </div>
      </div>

      <a class="fallback" href="${escapedLocation}" rel="nofollow">გაგრძელება</a>
    </main>
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
