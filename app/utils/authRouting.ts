import type { RouteLocationRaw } from "vue-router";

const AUTH_PUBLIC_PREFIXES = ["/login", "/register"];

export const normalizeAuthRedirect = (
  value: unknown,
  fallback = "/",
) => {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (typeof candidate !== "string") {
    return fallback;
  }

  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  return candidate;
};

export const buildLoginRedirectLocation = (
  fullPath?: string | null,
): RouteLocationRaw => {
  if (
    !fullPath ||
    !fullPath.startsWith("/") ||
    AUTH_PUBLIC_PREFIXES.some((prefix) => fullPath.startsWith(prefix))
  ) {
    return { path: "/login" };
  }

  return {
    path: "/login",
    query: { redirect: fullPath },
  };
};

export const routeRequiresAuth = (middleware: unknown) => {
  if (Array.isArray(middleware)) {
    return middleware.includes("auth-required");
  }

  return middleware === "auth-required";
};
