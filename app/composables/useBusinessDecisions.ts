import type { BusinessPeriod } from "~/utils/businessReport";
import type { DecisionReport } from "~/utils/businessDecisions";
import { resolveHttpStatusCode } from "~/utils/httpError";

export const useBusinessDecisions = () => {
  const report = shallowRef<DecisionReport | null>(null), loading = ref(false), errorMessage = ref("");
  const { user } = useBusinessAuth();
  const route = useRoute();
  const fetchPrivate = $fetch.create({ baseURL: useApiBaseUrl(), credentials: "include", cache: "no-store", retry: 0, timeout: 90000, onResponseError() {} });
  let controller: AbortController | undefined, generation = 0;
  const load = async (period: BusinessPeriod, source: "all" | "google" | "meta") => {
    const request = ++generation;
    controller?.abort(); controller = new AbortController();
    report.value = null; loading.value = true; errorMessage.value = "";
    try {
      const result = await fetchPrivate<DecisionReport>(`/business/decisions/${source}/`, { query: { ...period }, signal: controller.signal });
      if (request === generation) report.value = result;
    } catch (error) {
      if (request !== generation) return;
      const status = resolveHttpStatusCode(error);
      if (status === 401 || status === 403) {
        user.value = null;
        await navigateTo({ path: "/business/login", query: { next: route.path, ...(status === 403 ? { reason: "denied" } : {}) } }, { replace: true });
      } else errorMessage.value = status === 400 ? "აირჩიე სწორი პერიოდი, მაქსიმუმ 366 დღე."
        : status === 429 ? "მოთხოვნები დროებით შეზღუდულია. ცოტა ხანში განაახლე." : "დამატებითი ანგარიშები ვერ განახლდა. სცადე ხელახლა.";
    } finally { if (request === generation) loading.value = false; }
  };
  onBeforeUnmount(() => { generation++; controller?.abort(); report.value = null; });
  return { report, loading, errorMessage, load };
};
