import { businessReturnPath } from "~/utils/businessRouting";
import { resolveHttpStatusCode } from "~/utils/httpError";

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return;
  const { checkAccess } = useBusinessAuth();
  try {
    if (await checkAccess()) return;
  } catch (error) {
    const status = resolveHttpStatusCode(error);
    return navigateTo({
      path: "/business/login",
      query: { next: businessReturnPath(to.path), reason: status === 403 ? "denied" : "connection" },
    }, { replace: true });
  }
  return navigateTo({ path: "/business/login", query: { next: businessReturnPath(to.path) } }, { replace: true });
});
