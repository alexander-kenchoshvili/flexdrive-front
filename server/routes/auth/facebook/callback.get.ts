import { createError, defineEventHandler, getRequestURL, proxyRequest } from "h3";

const FACEBOOK_CALLBACK_PATH = "accounts/facebook/callback/";

export default defineEventHandler((event) => {
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
  const target = new URL(FACEBOOK_CALLBACK_PATH, upstreamRoot);
  target.search = requestUrl.search;

  return proxyRequest(event, target.toString(), {
    cookieDomainRewrite: "",
    fetchOptions: {
      redirect: "manual",
    },
  });
});
