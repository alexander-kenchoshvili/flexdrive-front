import type { CatalogVehicleMake } from "~/types/catalog";
import { apiFetchRaw } from "~/composables/apiFetch";

const MAKES_CACHE_TTL_MS = 5 * 60 * 1000;
const pendingRequests = new WeakMap<object, Promise<CatalogVehicleMake[]>>();

export const useCatalogVehicleMakes = () => {
  const nuxtApp = useNuxtApp();
  const cache = useState<{
    items: CatalogVehicleMake[];
    expiresAt: number;
  } | null>("catalog-vehicle-makes-v1", () => null);

  const getVehicleMakes = (): Promise<CatalogVehicleMake[]> => {
    if (cache.value && cache.value.expiresAt > Date.now()) {
      return Promise.resolve(cache.value.items);
    }

    const pending = pendingRequests.get(nuxtApp);
    if (pending) return pending;

    const request = apiFetchRaw<CatalogVehicleMake[]>("/catalog/vehicles/makes/")
      .then((items) => {
        cache.value = { items, expiresAt: Date.now() + MAKES_CACHE_TTL_MS };
        return items;
      })
      .finally(() => pendingRequests.delete(nuxtApp));

    pendingRequests.set(nuxtApp, request);
    return request;
  };

  return { getVehicleMakes };
};
