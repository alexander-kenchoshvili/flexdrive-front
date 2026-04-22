const UNSAFE_HTTP_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const isAbsoluteRequestUrl = (value: string) => /^[a-z][a-z0-9+.-]*:\/\//i.test(value);

const normalizeMethod = (method?: string) => String(method || "GET").toUpperCase();

export const buildSecureFetchOptions = async (
  url: string,
  options: Record<string, any> = {},
) => {
  const credentials: RequestCredentials = "include";
  const baseURL = useApiBaseUrl();
  const method = normalizeMethod(options.method);
  const headers = {
    ...(options.headers || {}),
  } as Record<string, string>;

  if (import.meta.client && UNSAFE_HTTP_METHODS.has(method) && !headers["X-CSRFToken"]) {
    const csrfCookie = useCookie<string | null>("csrftoken");

    if (!csrfCookie.value) {
      try {
        await $fetch(`${baseURL}/accounts/session/`, {
          credentials,
        });
      } catch {
        // Let the original request surface the real error if the CSRF seed call fails.
      }
    }

    headers["X-CSRFToken"] = csrfCookie.value || "";
  }

  return {
    ...(isAbsoluteRequestUrl(url) ? {} : { baseURL }),
    ...options,
    credentials,
    headers,
  };
};

export const secureFetchRaw = async <T>(
  url: string,
  options: Record<string, any> = {},
) => {
  return $fetch<T>(url, await buildSecureFetchOptions(url, options));
};
