import type { CatalogListParams } from "~/types/catalog";

type SearchSnapshot = {
  path: string;
  term: string;
  filtered: boolean;
  revision: number;
};

const FILTER_KEYS: Array<keyof CatalogListParams> = [
  "category", "make", "model", "year", "engine", "brand", "placement", "side",
  "min_price", "max_price", "in_stock", "on_sale", "has_image", "is_new", "is_featured",
];

export const useCatalogSearchAnalytics = () => {
  const router = useRouter();
  const { trackSearch } = useEcommerceAnalytics();
  // Shared across catalog/category remounts, memory only: pagination and filter
  // changes must not create another search. Leaving the listing resets it.
  const search = useState("catalog-search-analytics", () => ({ term: "", handled: false, revision: 0 }));

  if (import.meta.client) {
    watch(() => router.currentRoute.value.fullPath, () => {
      const route = router.currentRoute.value;
      const query = Array.isArray(route.query.q) ? route.query.q[0] : route.query.q;
      const term = /^\/catalog(?:\/category\/[^/]+)?\/?$/.test(route.path)
        ? String(query || "").trim() : "";
      if (search.value.term !== term) search.value = { term, handled: false, revision: search.value.revision + 1 };
    }, { immediate: true, flush: "sync" });
  }

  const captureSearch = (params: CatalogListParams): SearchSnapshot => ({
    path: router.currentRoute.value.fullPath,
    term: String(params.q || "").trim(),
    revision: search.value.revision,
    filtered: FILTER_KEYS.some((key) => params[key] !== undefined && params[key] !== null && params[key] !== "" && params[key] !== false),
  });

  const recordSearchResults = (snapshot: SearchSnapshot, count: number) => {
    if (!import.meta.client || !snapshot.term ||
      router.currentRoute.value.fullPath !== snapshot.path ||
      search.value.revision !== snapshot.revision ||
      search.value.term !== snapshot.term || search.value.handled ||
      !Number.isSafeInteger(count) || count < 0) return;
    // Even a denied event is consumed: granting consent later must not replay
    // a search performed without consent. A fresh search/view can be counted.
    search.value.handled = true;
    trackSearch(snapshot.term, count, snapshot.filtered);
  };

  return { captureSearch, recordSearchResults };
};
