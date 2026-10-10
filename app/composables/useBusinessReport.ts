import { resolveHttpStatusCode } from "~/utils/httpError";
import { businessReturnPath } from "~/utils/businessRouting";
import type { BusinessPeriod, BusinessReport } from "~/utils/businessReport";

export const useBusinessReport = () => {
  const report = shallowRef<BusinessReport | null>(null);
  const loading = ref(false);
  const errorMessage = ref("");
  const route = useRoute();
  const { user } = useBusinessAuth();
  const fetchPrivate = $fetch.create({ baseURL: useApiBaseUrl(), credentials: "include", cache: "no-store", retry: 0, timeout: 20000, onResponseError() {} });
  let controller: AbortController | undefined;
  let generation = 0;

  const load = async (period: BusinessPeriod) => {
    const request = ++generation;
    controller?.abort();
    controller = new AbortController();
    report.value = null;
    loading.value = true;
    errorMessage.value = "";
    try {
      const result = await fetchPrivate<BusinessReport>("/business/report/", { query: period, signal: controller.signal });
      if (request === generation) report.value = result;
    } catch (error) {
      if (request !== generation) return;
      const status = resolveHttpStatusCode(error);
      if (status === 401 || status === 403) {
        report.value = null;
        user.value = null;
        await navigateTo({ path: "/business/login", query: { next: businessReturnPath(route.path), ...(status === 403 ? { reason: "denied" } : {}) } }, { replace: true });
      } else {
        errorMessage.value = status === 400 ? "შეამოწმეთ თარიღები ან შეამცირეთ პერიოდი (მაქსიმუმ 366 დღე)."
          : status === 429 ? "მოთხოვნები დროებით შეზღუდულია. ცოტა ხანში სცადეთ ხელახლა."
          : "მონაცემების წამოღება ვერ მოხერხდა. სცადეთ ხელახლა.";
      }
    } finally {
      if (request === generation) loading.value = false;
    }
  };
  onBeforeUnmount(() => { generation++; controller?.abort(); report.value = null; });
  return { report, loading, errorMessage, load };
};
