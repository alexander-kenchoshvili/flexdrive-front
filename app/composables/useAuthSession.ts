import type { AuthSessionState } from "~/types/auth";
import { secureFetchRaw } from "./secureFetch";

const normalizeAuthSession = (payload: unknown): AuthSessionState | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const session = payload as Partial<AuthSessionState>;

  return {
    has_access: Boolean(session.has_access),
    has_refresh: Boolean(session.has_refresh),
    access_expires_at:
      typeof session.access_expires_at === "string" ? session.access_expires_at : null,
    refresh_expires_at:
      typeof session.refresh_expires_at === "string" ? session.refresh_expires_at : null,
  };
};

export const useAuthSession = () => {
  const globalStore = useGlobalStore();

  const applyAuthSession = (payload: unknown) => {
    const nextSession = normalizeAuthSession(payload);
    globalStore.authSession = nextSession;
    return nextSession;
  };

  const clearAuthSession = () => {
    globalStore.authSession = null;
  };

  const fetchAuthSession = async (options: { headers?: Record<string, string> } = {}) => {
    const session = await secureFetchRaw<AuthSessionState>(
      "/accounts/session/",
      {
        headers: options.headers,
      },
    );

    return applyAuthSession(session);
  };

  return {
    applyAuthSession,
    clearAuthSession,
    fetchAuthSession,
  };
};
