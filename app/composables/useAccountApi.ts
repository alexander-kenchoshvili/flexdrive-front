import { apiFetchRaw } from "~/composables/apiFetch";
import type { AccountProfile, AccountProfileUpdatePayload } from "~/types/account";

type AccountRequestOptions = {
  headers?: Record<string, string>;
};

export const useAccountApi = () => {
  const resolveHeaders = (options?: AccountRequestOptions) => {
    const nextHeaders = {
      ...(import.meta.server ? useRequestHeaders(["cookie"]) : {}),
      ...(options?.headers || {}),
    } as Record<string, string | undefined>;

    return Object.fromEntries(
      Object.entries(nextHeaders).filter(([, value]) => Boolean(value)),
    ) as Record<string, string>;
  };

  const getProfile = async (options?: AccountRequestOptions) => {
    return apiFetchRaw<AccountProfile>("/accounts/profile/", {
      headers: resolveHeaders(options),
    });
  };

  const updateProfile = async (
    payload: Partial<AccountProfileUpdatePayload>,
    options?: AccountRequestOptions,
  ) => {
    return apiFetchRaw<AccountProfile>("/accounts/profile/", {
      method: "PATCH",
      body: payload,
      headers: resolveHeaders(options),
    });
  };

  const deleteProfile = async (
    currentPassword: string,
    options?: AccountRequestOptions,
  ) => {
    return apiFetchRaw<void>("/accounts/profile/", {
      method: "DELETE",
      body: { current_password: currentPassword },
      headers: resolveHeaders(options),
    });
  };

  const confirmEmailChange = async (token: string) => {
    return apiFetchRaw<{ message: string }>("/accounts/email/confirm/", {
      method: "POST",
      body: { token },
    });
  };

  return {
    getProfile,
    updateProfile,
    deleteProfile,
    confirmEmailChange,
  };
};
