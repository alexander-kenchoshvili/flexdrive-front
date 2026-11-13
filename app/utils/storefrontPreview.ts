export const PREVIEW_COOKIE = "fd_preview_access";

// Forward only the preview cookie, and only to the configured API's own path.
export const previewCookieForUpstream = (
  request: string, baseURL: string, configuredUpstream: string, cookie?: string,
): string | undefined => {
  try {
    const upstream = new URL(configuredUpstream.endsWith("/") ? configuredUpstream : `${configuredUpstream}/`);
    const base = new URL(baseURL.endsWith("/") ? baseURL : `${baseURL}/`);
    const target = new URL(request.replace(/^\/(?!\/)/, ""), base);
    if (target.origin !== upstream.origin || !target.pathname.startsWith(upstream.pathname)) return;
    return cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${PREVIEW_COOKIE}=`));
  } catch {
    return;
  }
};
