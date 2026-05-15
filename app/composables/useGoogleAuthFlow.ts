import type { AuthSessionState } from "~/types/auth";

const firstString = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }

  return "";
};

export const useGoogleAuthFlow = () => {
  const globalStore = useGlobalStore();
  const { applyAuthSession } = useAuthSession();

  const authenticateWithGoogle = async (credential: string) => {
    const loginResponse = await secureFetchRaw<{ session?: AuthSessionState }>(
      "/accounts/google/",
      {
        method: "POST",
        body: { credential },
      },
    );

    applyAuthSession(loginResponse?.session);

    const userResponse = await secureFetchRaw("/accounts/me/", {
      method: "GET",
    });

    globalStore.currentUser = userResponse;
    globalStore.authResolved = true;
  };

  const getGoogleAuthErrorMessage = (error: any, fallback: string) =>
    firstString(error?.data?.non_field_errors) ||
    firstString(error?.data?.credential) ||
    firstString(error?.data?.detail) ||
    error?.message ||
    fallback;

  return {
    authenticateWithGoogle,
    getGoogleAuthErrorMessage,
  };
};
