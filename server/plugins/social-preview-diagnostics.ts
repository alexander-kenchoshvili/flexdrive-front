import { getRequestHeader, getResponseStatus, type H3Event } from "h3";

type PreviewTrace = {
  id: number;
  resource: "robots" | "blog";
  crawler: "facebookexternalhit" | "facebot";
};

// Temporary, bounded diagnostics for the unresolved Facebook preview 403.
// Log only fixed classifications and status: no URLs, query, IP, cookies or body.
export default defineNitroPlugin((nitroApp) => {
  const traces = new WeakMap<H3Event, PreviewTrace>();
  let windowStartedAt = Date.now();
  let windowCount = 0;
  let sequence = 0;

  const writeTrace = (trace: PreviewTrace, phase: string, status?: number) => {
    try {
      console.info(JSON.stringify({
        event: "social_preview_request",
        ...trace,
        phase,
        ...(status === undefined ? {} : { status }),
      }));
    } catch {
      // Diagnostics must never interfere with a response.
    }
  };

  nitroApp.hooks.hook("request", (event) => {
    if (event.method !== "GET" && event.method !== "HEAD") return;
    const path = event.path.split("?")[0] || "/";
    const resource = path === "/robots.txt" ? "robots"
      : path.startsWith("/blogs/") ? "blog" : null;
    if (!resource) return;
    const userAgent = getRequestHeader(event, "user-agent") || "";
    const crawler = /\bfacebookexternalhit\b/i.test(userAgent) ? "facebookexternalhit"
      : /\bfacebot\b/i.test(userAgent) ? "facebot" : null;
    if (!crawler) return;

    const now = Date.now();
    if (now - windowStartedAt >= 60_000) {
      windowStartedAt = now;
      windowCount = 0;
    }
    if (windowCount >= 20) return;
    windowCount += 1;
    const trace: PreviewTrace = { id: ++sequence, resource, crawler };
    traces.set(event, trace);
    writeTrace(trace, "received");
  });

  nitroApp.hooks.hook("afterResponse", (event) => {
    const trace = traces.get(event);
    if (!trace) return;
    traces.delete(event);
    writeTrace(trace, "completed", getResponseStatus(event));
  });
});
