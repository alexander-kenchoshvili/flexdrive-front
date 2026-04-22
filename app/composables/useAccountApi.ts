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

  const deleteProfile = async (options?: AccountRequestOptions) => {
    return apiFetchRaw<void>("/accounts/profile/", {
      method: "DELETE",
      headers: resolveHeaders(options),
    });
  };

  return {
    getProfile,
    updateProfile,
    deleteProfile,
  };
};
