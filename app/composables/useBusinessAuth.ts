import { resolveHttpStatusCode } from "~/utils/httpError";

export type BusinessUser = { id: number; username: string };
type BusinessSession = { authenticated: boolean; user: BusinessUser | null };

export const useBusinessAuth = () => {
  const user = useState<BusinessUser | null>("business-user", () => null);
  const baseURL = useApiBaseUrl();
  // Private login errors belong to this form, not the storefront's global modal.
  const fetchPrivate = $fetch.create({
    baseURL,
    credentials: "include",
    cache: "no-store",
    retry: 0,
    timeout: 15000,
    onResponseError() {},
  });

  const request = async <T>(path: string, body?: Record<string, unknown>) => {
    if (body === undefined) return fetchPrivate<T>(path);
    await fetchPrivate<BusinessSession>("/business/session/");
    const cookie = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/)?.[1];
    return fetchPrivate<T>(path, {
      method: "POST",
      headers: { "X-CSRFToken": cookie ? decodeURIComponent(cookie) : "" },
      body,
    });
  };

  const checkAccess = async () => {
    try {
      const session = await request<BusinessSession>("/business/access/");
      user.value = session.user;
      return session.user;
    } catch (error) {
      user.value = null;
      if (resolveHttpStatusCode(error) === 401) return null;
      throw error;
    }
  };

  const checkSession = async () => {
    const session = await request<BusinessSession>("/business/session/");
    user.value = session.authenticated ? session.user : null;
    return user.value;
  };

  const login = async (username: string, password: string, recaptchaToken: string) => {
    const session = await request<BusinessSession>("/business/login/", {
      username, password, recaptcha_token: recaptchaToken,
    });
    user.value = session.user;
  };

  const logout = async () => {
    await request<BusinessSession>("/business/logout/", {});
    user.value = null;
  };

  return { user, checkAccess, checkSession, login, logout };
};
