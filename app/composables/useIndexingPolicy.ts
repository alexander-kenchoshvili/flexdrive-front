import { computed, toValue } from "vue";
import type { MaybeRefOrGetter } from "vue";
import { resolveRobotsValue } from "~/utils/seoIndexing";

type UseIndexingPolicyOptions = {
  path?: MaybeRefOrGetter<string | null | undefined>;
  pageNoindex?: MaybeRefOrGetter<boolean | null | undefined>;
};

export const useIndexingPolicy = (options: UseIndexingPolicyOptions = {}) => {
  const route = useRoute();
  const config = useRuntimeConfig();

  const resolvedPath = computed(
    () => toValue(options.path) || route.path || "/",
  );
  const pageNoindex = computed(() => Boolean(toValue(options.pageNoindex)));
  const allowIndexing = computed(() => Boolean(config.public.allowIndexing));
  const robots = computed(() =>
    resolveRobotsValue({
      allowIndexing: allowIndexing.value,
      path: resolvedPath.value,
      pageNoindex: pageNoindex.value,
    }),
  );

  return {
    allowIndexing,
    pageNoindex,
    path: resolvedPath,
    robots,
  };
};
