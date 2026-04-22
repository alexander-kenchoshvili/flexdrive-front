export const useApiBaseUrl = () => {
  const config = useRuntimeConfig();

  if (import.meta.server) {
    return String(config.apiBaseUrl || config.public.NUXT_BASE_API_URL || "");
  }

  return String(config.public.NUXT_BASE_API_URL || config.apiBaseUrl || "");
};
