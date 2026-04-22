import { createError, defineEventHandler, getRequestURL, proxyRequest } from "h3";

const API_PREFIX = "/api";

export default defineEventHandler(async (event) => {
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
  const upstreamPath = requestUrl.pathname.startsWith(API_PREFIX)
    ? requestUrl.pathname.slice(API_PREFIX.length)
    : requestUrl.pathname;
  const normalizedPath = upstreamPath.replace(/^\/+/, "");
  const target = new URL(normalizedPath, upstreamRoot);
  target.search = requestUrl.search;

  return proxyRequest(event, target.toString(), {
    // Keep cookies on the frontend host so preview/staging domains work without shared subdomains.
    cookieDomainRewrite: "",
  });
});
