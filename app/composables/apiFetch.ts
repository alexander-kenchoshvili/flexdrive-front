import { useAsyncData } from "#app";
import { useTokenRefreshHandler } from "./useTokenRefreshHandler";
import { useAuth } from "./useAuth";
import { buildSecureFetchOptions } from "./secureFetch";
import { buildLoginRedirectLocation } from "~/utils/authRouting";

const performApiFetch = async <T>(
  url: string,
  options: Record<string, any> = {},
): Promise<T> => {
  try {
    return (await $fetch<T>(
      url,
      await buildSecureFetchOptions(url, options),
    )) as T;
  } catch (error: any) {
    const failedRequestUrl = String(error?.request?.url || error?.response?.url || url);

    if (
      //@ts-ignore
      process.client &&
      error.response?.status === 401 &&
      !failedRequestUrl.includes("token/refresh")
    ) {
      const { handle401Error } = useTokenRefreshHandler();
      const success = await handle401Error();

      if (success) {
        return (await $fetch<T>(
          url,
          await buildSecureFetchOptions(url, options),
        )) as T;
      }

      const { logout } = useAuth();
      const currentPath = useNuxtApp().$router.currentRoute.value.fullPath;
      await logout({
        redirectTo: buildLoginRedirectLocation(currentPath),
      });
    }

    throw error;
  }
};

export const apiFetchRaw = <T>(url: string, options: Record<string, any> = {}) => {
  return performApiFetch<T>(url, options);
};

export const apiFetch = <T>(url: string, options: Record<string, any> = {}) => {
  const key = `${url}-${JSON.stringify(options.body)}`;
  return useAsyncData<T, unknown, T, never[], null>(
    key,
    () => performApiFetch<T>(url, options),
    {
      default: () => null,
    },
  );
};
