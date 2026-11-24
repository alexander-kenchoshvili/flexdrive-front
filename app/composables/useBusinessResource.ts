import { resolveHttpStatusCode } from "~/utils/httpError";
import { businessReturnPath } from "~/utils/businessRouting";

// Shared only by the new private reports; existing report contracts stay intact.
export const useBusinessResource = <T>(endpoint: string) => {
  const report = shallowRef<T | null>(null), loading = ref(false), errorMessage = ref("");
  const route = useRoute(), { user } = useBusinessAuth();
  const fetchPrivate = $fetch.create({ baseURL: useApiBaseUrl(), credentials: "include", cache: "no-store", retry: 0, timeout: 40000, onResponseError() {} });
  let controller: AbortController | undefined, generation = 0;
  const load = async (query: Record<string, string | number>) => {
    const request = ++generation; controller?.abort(); controller = new AbortController();
    report.value = null; loading.value = true; errorMessage.value = "";
    try { const result = await fetchPrivate<T>(endpoint, { query: { ...query }, signal: controller.signal }); if (request === generation) report.value = result; }
    catch (error) {
      if (request !== generation) return;
      const status = resolveHttpStatusCode(error);
      if (status === 401 || status === 403) { user.value = null; await navigateTo({ path: "/business/login", query: { next: businessReturnPath(route.path), ...(status === 403 ? { reason: "denied" } : {}) } }, { replace: true }); }
      else errorMessage.value = status === 400 ? "შეამოწმეთ თარიღები და ფილტრები." : status === 429 ? "მოთხოვნები დროებით შეზღუდულია. განაახლეთ ცოტა ხანში." : "ანგარიში ვერ ჩაიტვირთა. სცადეთ ხელახლა.";
    } finally { if (request === generation) loading.value = false; }
  };
  onBeforeUnmount(() => { generation++; controller?.abort(); report.value = null; });
  return { report, loading, errorMessage, load };
};
