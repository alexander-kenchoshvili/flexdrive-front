import { appendResponseHeader } from "h3";
import type { AuthSessionState } from "~/types/auth";

const getSetCookieHeaders = (response: Response) => {
  const nextHeaders =
    typeof (response.headers as Headers & { getSetCookie?: () => string[] })
      .getSetCookie === "function"
      ? (response.headers as Headers & { getSetCookie: () => string[] }).getSetCookie()
      : [];

  if (nextHeaders.length) {
    return nextHeaders;
  }

  const singleHeader = response.headers.get("set-cookie");
  return singleHeader ? [singleHeader] : [];
};

const extractCookieValue = (headers: string[], cookieName: string) => {
  for (const header of headers) {
    const match = header.match(
      new RegExp(`(?:^|\\s|,)${cookieName}=([^;]+)`),
    );

    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
};

const upsertCookie = (
  cookieHeader: string | undefined,
  cookieName: string,
  cookieValue: string,
) => {
  const normalizedParts = (cookieHeader || "")
    .split(/;\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !part.startsWith(`${cookieName}=`));

  normalizedParts.push(`${cookieName}=${cookieValue}`);
  return normalizedParts.join("; ");
};

export default defineNuxtPlugin(async () => {
  const globalStore = useGlobalStore();

  if (globalStore.authResolved) return;

  if (globalStore.currentUser) {
    globalStore.authResolved = true;
    return;
  }

  const baseURL = useApiBaseUrl();
  const event = useRequestEvent();
  const requestHeaders = useRequestHeaders(["cookie"]);
  const cookieHeader = requestHeaders.cookie;

  const resolveUser = async (resolvedCookieHeader?: string) =>
    $fetch(`${baseURL}/accounts/me/`, {
      credentials: "include",
      headers: resolvedCookieHeader ? { cookie: resolvedCookieHeader } : undefined,
    });

  try {
    globalStore.currentUser = await resolveUser(cookieHeader);
    globalStore.authResolved = true;
    return;
  } catch {
    // Fall through to refresh recovery below.
  }

  let hasRefresh = false;

  try {
    const sessionStatus = await $fetch<AuthSessionState>(
      `${baseURL}/accounts/session/`,
      {
        credentials: "include",
        headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      },
    );
    globalStore.authSession = sessionStatus;
    hasRefresh = Boolean(sessionStatus?.has_refresh);
  } catch {
    hasRefresh = false;
  }

  if (!hasRefresh) {
    globalStore.currentUser = null;
    globalStore.authSession = null;
    globalStore.authResolved = true;
    return;
  }

  try {
    const refreshResponse = await $fetch.raw(
      `${baseURL}/accounts/token/refresh/`,
      {
        method: "POST",
        credentials: "include",
        headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      },
    );

    const setCookieHeaders = getSetCookieHeaders(refreshResponse);

    if (event && setCookieHeaders.length) {
      for (const header of setCookieHeaders) {
        appendResponseHeader(event, "set-cookie", header);
      }
    }

    const nextAccessToken = extractCookieValue(setCookieHeaders, "access_token");
    const nextCookieHeader = nextAccessToken
      ? upsertCookie(cookieHeader, "access_token", nextAccessToken)
      : cookieHeader;

    globalStore.authSession =
      (refreshResponse as { _data?: { session?: AuthSessionState } })._data?.session || null;
    globalStore.currentUser = await resolveUser(nextCookieHeader);
  } catch {
    globalStore.currentUser = null;
    globalStore.authSession = null;
  } finally {
    globalStore.authResolved = true;
  }
});
