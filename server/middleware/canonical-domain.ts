import { defineEventHandler, getRequestHeader, getRequestURL, sendRedirect } from "h3";

// Only the agreed www alias redirects. Preview/local hosts stay usable until
// the restricted domain cutover; forwarded host headers cannot choose a target.
export default defineEventHandler((event) => {
  if (event.method !== "GET" && event.method !== "HEAD") return;

  const host = getRequestHeader(event, "host") || "";
  if (!/^www\.flexdrive\.ge(?::(?:80|443))?$/i.test(host)) return;

  const url = getRequestURL(event, {
    xForwardedHost: false,
    xForwardedProto: false,
  });
  return sendRedirect(event, `https://flexdrive.ge${url.pathname}${url.search}`, 308);
});
