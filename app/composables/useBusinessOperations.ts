import { resolveHttpStatusCode } from "~/utils/httpError";
import type { OperationsQuery, OperationsReport } from "~/utils/businessOperations";

export const useBusinessOperations = () => {
  const report = shallowRef<OperationsReport | null>(null);
  const loading = ref(false);
  const errorMessage = ref("");
  const { user } = useBusinessAuth();
  const fetchPrivate = $fetch.create({ baseURL: useApiBaseUrl(), credentials: "include", cache: "no-store", retry: 0, timeout: 20000, onResponseError() {} });
  let controller: AbortController | undefined;
  let generation = 0;
  const load = async (query: OperationsQuery) => {
    const request = ++generation;
    controller?.abort();
    controller = new AbortController();
    report.value = null; loading.value = true; errorMessage.value = "";
    try {
      const result = await fetchPrivate<OperationsReport>("/business/operations/", { query: { ...query }, signal: controller.signal });
      if (request === generation) report.value = result;
    } catch (error) {
      if (request !== generation) return;
      const status = resolveHttpStatusCode(error);
      if (status === 401 || status === 403) {
        user.value = null;
        await navigateTo({ path: "/business/login", query: { next: "/business/operations", ...(status === 403 ? { reason: "denied" } : {}) } }, { replace: true });
      } else {
        errorMessage.value = status === 400 ? "შეამოწმეთ სიის ფილტრი ან გვერდის ნომერი."
          : status === 429 ? "მოთხოვნები დროებით შეზღუდულია. ცოტა ხანში სცადეთ ხელახლა."
          : "ოპერაციების მონაცემების წამოღება ვერ მოხერხდა. სცადეთ ხელახლა.";
      }
    } finally {
      if (request === generation) loading.value = false;
    }
  };
  onBeforeUnmount(() => { generation++; controller?.abort(); report.value = null; });
  return { report, loading, errorMessage, load };
};
