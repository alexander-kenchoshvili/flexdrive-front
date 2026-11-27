import type { BusinessPeriod } from "~/utils/businessReport";
import type { PageFilters, PageReport } from "~/utils/businessPages";
import { resolveHttpStatusCode } from "~/utils/httpError";

export const useBusinessPages = () => {
  const report = shallowRef<PageReport | null>(null), loading = ref(false), errorMessage = ref("");
  const { user } = useBusinessAuth();
  const route = useRoute();
  const fetchPrivate = $fetch.create({ baseURL: useApiBaseUrl(), credentials: "include", cache: "no-store", retry: 0, timeout: 90000, onResponseError() {} });
  let controller: AbortController | undefined, generation = 0;
  const clear = () => {
    generation++; controller?.abort(); report.value = null; loading.value = false; errorMessage.value = "";
  };
  const load = async (period: BusinessPeriod, filters: PageFilters = {}) => {
    const request = ++generation;
    controller?.abort(); controller = new AbortController();
    report.value = null; loading.value = true; errorMessage.value = "";
    try {
      const result = await fetchPrivate<PageReport>("/business/pages/", {
        query: { ...period, q: filters.q || undefined, page: filters.page || 1, path: filters.path || undefined },
        signal: controller.signal,
      });
      if (request === generation) report.value = result;
    } catch (error) {
      if (request !== generation) return;
      const status = resolveHttpStatusCode(error);
      if (status === 401 || status === 403) {
        user.value = null;
        await navigateTo({ path: "/business/login", query: { next: route.path, ...(status === 403 ? { reason: "denied" } : {}) } }, { replace: true });
      } else errorMessage.value = status === 400 ? "შეამოწმე პერიოდი, გვერდის მისამართი ან ძიება (მაქსიმუმ 120 სიმბოლო)."
        : status === 429 ? "მოთხოვნები დროებით შეზღუდულია. ცოტა ხანში განაახლე." : "გვერდების ანგარიში ვერ განახლდა. სცადე ხელახლა.";
    } finally { if (request === generation) loading.value = false; }
  };
  onBeforeUnmount(clear);
  return { report, loading, errorMessage, load, clear };
};
