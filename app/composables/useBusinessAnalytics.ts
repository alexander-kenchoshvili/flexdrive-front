import { resolveHttpStatusCode } from "~/utils/httpError";
import type { BusinessPeriod } from "~/utils/businessReport";
import type { AnalyticsReport } from "~/utils/businessAnalytics";

export const useBusinessAnalytics = () => {
  const report = shallowRef<AnalyticsReport | null>(null);
  const loading = ref(false);
  const errorMessage = ref("");
  const { user } = useBusinessAuth();
  const fetchPrivate = $fetch.create({ baseURL: useApiBaseUrl(), credentials: "include", cache: "no-store", retry: 0, timeout: 40000, onResponseError() {} });
  let controller: AbortController | undefined;
  let generation = 0;
  const load = async (period: BusinessPeriod) => {
    const request = ++generation;
    controller?.abort();
    controller = new AbortController();
    report.value = null; loading.value = true; errorMessage.value = "";
    try {
      const result = await fetchPrivate<AnalyticsReport>("/business/analytics/", { query: { ...period }, signal: controller.signal });
      if (request === generation) report.value = result;
    } catch (error) {
      if (request !== generation) return;
      const status = resolveHttpStatusCode(error);
      if (status === 401 || status === 403) {
        user.value = null;
        await navigateTo({ path: "/business/login", query: { next: "/business/users", ...(status === 403 ? { reason: "denied" } : {}) } }, { replace: true });
      } else {
        errorMessage.value = status === 400 ? "აირჩიეთ სწორი თარიღები: მაქსიმუმ 366 დღე, დღევანდელ დღემდე."
          : status === 429 ? "მოთხოვნები დროებით შეზღუდულია. ცოტა ხანში სცადეთ ხელახლა."
          : "ანალიტიკის წამოღება ვერ მოხერხდა. სცადეთ ხელახლა.";
      }
    } finally {
      if (request === generation) loading.value = false;
    }
  };
  onBeforeUnmount(() => { generation++; controller?.abort(); report.value = null; });
  return { report, loading, errorMessage, load };
};
