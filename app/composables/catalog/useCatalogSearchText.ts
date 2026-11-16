/** Share the editable query between header search and catalog filter controls. */
export const useCatalogSearchText = () => {
  const route = useRoute();
  const draft = useState<{ scope: string; text: string } | null>("catalog-search-text-draft", () => null);
  const routeText = computed(() => {
    const value = route.query.q;
    return String((Array.isArray(value) ? value[0] : value) || "");
  });
  const scope = computed(() => JSON.stringify([route.path.replace(/\/$/, ""), routeText.value]));
  // A new search/page (including browser Back) restores its own query. Changing
  // vehicle/refinement filters alone must not restore text the user just erased.
  watch(scope, () => { draft.value = null; }, { flush: "sync" });
  return computed({
    get: () => draft.value?.scope === scope.value ? draft.value.text : routeText.value,
    set: (text: string) => { draft.value = { scope: scope.value, text }; },
  });
};
