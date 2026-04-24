<script setup lang="ts">
import { useMediaQuery, watchDebounced } from "@vueuse/core";
import type { LocationQuery, LocationQueryValue } from "vue-router";
import AppBreadcrumbs from "~/components/common/AppBreadcrumbs.vue";
import BaseButton from "~/components/common/BaseButton.vue";
import { useBlogApi } from "~/composables/blog/useBlogApi";
import { buildBreadcrumbStructuredData } from "~/utils/structuredData";
import type {
  BlogCategoryFacet,
  BlogListItem,
  BlogListParams,
  BlogListResponse,
  BlogSort,
} from "~/types/blog";
import type { SmartComponentData } from "~/types/page";
import BlogCard from "../BlogSection/parts/BlogCard.vue";
import BlogGridSkeleton from "../BlogSection/parts/BlogGridSkeleton.vue";
import BlogListFiltersBar from "./parts/BlogListFiltersBar.vue";
import BlogListResultsToolbar from "./parts/BlogListResultsToolbar.vue";

const props = defineProps<{
  data?: SmartComponentData;
}>();

const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();
const { fetchBlogPosts } = useBlogApi();

const SORT_VALUES: BlogSort[] = [
  "newest",
  "oldest",
  "read_time_asc",
  "read_time_desc",
];

const postsResponse = ref<BlogListResponse | null>(null);
const postsPending = ref(false);
const postsError = ref<unknown>(null);
const latestRequestId = ref(0);
const hasInitialized = ref(false);

const selectedSort = ref<BlogSort>("newest");
const selectedCategory = ref<string | null>(null);
const searchTerm = ref("");
const currentPage = ref(1);

const isMobilePagination = useMediaQuery("(max-width: 640px)");

const title = computed(
  () => (props.data?.title as string) || "ბლოგი",
);
const subtitle = computed(
  () =>
    (props.data?.subtitle as string) ||
    "იხილეთ ექსპერტული რჩევები, გზამკვლევები და სიახლეები ავტონაწილებზე, ავტომობილის მოვლასა და სწორ არჩევანზე.",
);

const breadcrumbItems = computed(() => [
  { label: "მთავარი", to: "/" },
  { label: title.value },
]);

const siteUrl = computed(() =>
  String(config.public.siteUrl || "https://localhost:3000").replace(/\/+$/, ""),
);
const breadcrumbSchema = computed(() =>
  buildBreadcrumbStructuredData({
    items: breadcrumbItems.value,
    siteUrl: siteUrl.value,
    currentPath:
      currentPage.value > 1 ? `/blogs?page=${currentPage.value}` : "/blogs",
  }),
);
const posts = computed<BlogListItem[]>(() => postsResponse.value?.results ?? []);
const resultCount = computed(() => postsResponse.value?.count ?? 0);
const totalPages = computed(() => postsResponse.value?.total_pages ?? 1);
const pageSize = computed(() => postsResponse.value?.page_size ?? 9);
const categories = computed<BlogCategoryFacet[]>(
  () => postsResponse.value?.facets?.categories ?? [],
);

const paginationMaxPagesShown = computed(() => (isMobilePagination.value ? 3 : 5));
const paginationShowEndingButtons = computed(() => !isMobilePagination.value);
const paginationSeoTitle = computed(() =>
  currentPage.value > 1 ? `${title.value} - გვერდი ${currentPage.value}` : undefined,
);

const hasBlogData = computed(() => postsResponse.value !== null);
const isInitialLoading = computed(() => !hasInitialized.value && postsPending.value);
const hasBlockingError = computed(() => !isInitialLoading.value && Boolean(postsError.value) && !hasBlogData.value);
const hasNonBlockingError = computed(() => !isInitialLoading.value && Boolean(postsError.value) && hasBlogData.value);
const controlsDisabled = computed(() => isInitialLoading.value && !hasBlogData.value);

const firstQueryValue = (
  value: LocationQueryValue | LocationQueryValue[] | undefined,
): string | undefined => {
  if (Array.isArray(value)) return value[0] ?? undefined;
  return value ?? undefined;
};

const toPositiveIntOrNull = (value: string | undefined): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const toBlogSortValue = (value: string | undefined): BlogSort => {
  if (!value) return "newest";
  return SORT_VALUES.includes(value as BlogSort) ? (value as BlogSort) : "newest";
};

const syncControlsFromQuery = (query: LocationQuery) => {
  selectedSort.value = toBlogSortValue(firstQueryValue(query.ordering));
  selectedCategory.value = firstQueryValue(query.category) || null;
  searchTerm.value = firstQueryValue(query.search) || "";
  currentPage.value = toPositiveIntOrNull(firstQueryValue(query.page)) ?? 1;
};

const buildParamsFromControls = (): BlogListParams => {
  const params: BlogListParams = {
    placement: "list",
    page: currentPage.value,
  };

  if (selectedSort.value !== "newest") {
    params.ordering = selectedSort.value;
  }

  if (selectedCategory.value) {
    params.category = selectedCategory.value;
  }

  if (searchTerm.value.trim()) {
    params.search = searchTerm.value.trim();
  }

  return params;
};

const buildRouteQueryFromControls = (page: number): Record<string, string> => {
  const query: Record<string, string> = {};

  if (selectedSort.value !== "newest") {
    query.ordering = selectedSort.value;
  }

  if (selectedCategory.value) {
    query.category = selectedCategory.value;
  }

  if (searchTerm.value.trim()) {
    query.search = searchTerm.value.trim();
  }

  if (page > 1) {
    query.page = String(page);
  }

  return query;
};

const normalizeRouteQuery = (query: LocationQuery): Record<string, string> => {
  const normalized: Record<string, string> = {};

  Object.entries(query).forEach(([key, value]) => {
    const parsed = firstQueryValue(value);
    if (parsed !== undefined && parsed !== "") {
      normalized[key] = parsed;
    }
  });

  return normalized;
};

const areQueriesEqual = (a: Record<string, string>, b: Record<string, string>) => {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every((key) => a[key] === b[key]);
};

const pushQueryFromControls = async (options?: { resetPage?: boolean }) => {
  const targetPage = options?.resetPage ? 1 : currentPage.value;
  const targetQuery = buildRouteQueryFromControls(targetPage);
  const currentQuery = normalizeRouteQuery(route.query);

  if (areQueriesEqual(targetQuery, currentQuery)) return;

  await router.push({ query: targetQuery });
};

const loadPosts = async () => {
  const requestId = ++latestRequestId.value;
  postsPending.value = true;
  postsError.value = null;

  try {
    const responseData = await fetchBlogPosts(buildParamsFromControls());

    if (requestId !== latestRequestId.value) return;

    postsResponse.value = responseData;
  } catch (error) {
    if (requestId !== latestRequestId.value) return;
    postsError.value = error;
  } finally {
    if (requestId === latestRequestId.value) {
      postsPending.value = false;
    }
  }
};

const handleCategoryUpdate = async (value: string | null) => {
  selectedCategory.value = value;
  await pushQueryFromControls({ resetPage: true });
};

const handleSortUpdate = async (value: BlogSort) => {
  selectedSort.value = value;
  await pushQueryFromControls({ resetPage: true });
};

const handlePageClick = async (page: number) => {
  currentPage.value = page;
  await pushQueryFromControls();

  if (import.meta.client) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};

const retryLoad = async () => {
  await loadPosts();
};

syncControlsFromQuery(route.query);
await loadPosts();
hasInitialized.value = true;

watch(
  () => route.query,
  async (query) => {
    syncControlsFromQuery(query);
    await loadPosts();
  },
);

watchDebounced(
  searchTerm,
  async () => {
    if (!hasInitialized.value) return;
    await pushQueryFromControls({ resetPage: true });
  },
  {
    debounce: 350,
    maxWait: 700,
  },
);

useSeoMeta({
  title: () => paginationSeoTitle.value,
});

useHead(() => ({
  script: breadcrumbSchema.value
    ? [
        {
          key: "blog-list-breadcrumb-schema",
          type: "application/ld+json",
          children: JSON.stringify(breadcrumbSchema.value),
        },
      ]
    : [],
}));
</script>

<template>
  <section class="py-8 md:py-10">
    <div class="container-fluid">
      <AppBreadcrumbs :items="breadcrumbItems" />

      <header class="py-10 text-center md:py-12">
        <h1
          class="title-under-xs upper text-[34px] font-extrabold leading-[1.1] text-text-primary md:text-[42px] lg:text-[48px]"
        >
          {{ title }}
        </h1>
        <p class="subtitle-under-xs mx-auto mt-4 max-w-3xl text-base leading-7 text-text-secondary md:text-lg">
          {{ subtitle }}
        </p>
      </header>

      <BlogListFiltersBar
        :categories="categories"
        :selected-category="selectedCategory"
        :search="searchTerm"
        :disabled="controlsDisabled"
        @update:selected-category="handleCategoryUpdate"
        @update:search="searchTerm = $event"
      />

      <div class="mt-6 space-y-4">
        <BlogListResultsToolbar
          :result-count="resultCount"
          :sort="selectedSort"
          :disabled="controlsDisabled"
          @update:sort="handleSortUpdate"
        />

        <div
          v-if="hasNonBlockingError"
          class="rounded-[20px] border border-warning/30 bg-surface px-4 py-3 text-sm text-text-secondary"
        >
          მონაცემების განახლება ვერ მოხერხდა. ნაჩვენებია ბოლოს მიღებული შედეგები.
        </div>

        <BlogGridSkeleton
          v-if="isInitialLoading"
          variant="list"
          :cards-count="9"
        />

        <div
          v-else-if="hasBlockingError"
          class="rounded-[20px] border border-error/25 bg-surface p-6"
        >
          <p class="text-base font-semibold text-text-primary">
            ბლოგების ჩატვირთვა ვერ მოხერხდა.
          </p>
          <p class="mt-2 text-sm leading-6 text-text-secondary">
            სცადე თავიდან ან გადაამოწმე API კავშირი.
          </p>
          <BaseButton
            type="button"
            variant="accent-outline"
            size="sm"
            class="mt-4"
            @click="retryLoad"
          >
            თავიდან ცდა
          </BaseButton>
        </div>

        <div
          v-else-if="!posts.length"
          class="rounded-[20px] border border-dashed border-border-default bg-surface p-6 text-sm text-text-secondary"
        >
          არჩეული პარამეტრებით სტატიები ვერ მოიძებნა.
        </div>

        <div
          v-else
          class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
        >
          <BlogCard
            v-for="post in posts"
            :key="post.id"
            :post="post"
          />
        </div>

        <ClientOnly>
          <div v-if="totalPages > 1" class="flex justify-center py-4">
            <vue-awesome-paginate
              v-model="currentPage"
              :total-items="resultCount"
              :items-per-page="pageSize"
              :max-pages-shown="paginationMaxPagesShown"
              :show-ending-buttons="paginationShowEndingButtons"
              :show-breakpoint-buttons="true"
              :hide-prev-next-when-ends="true"
              first-page-content="პირველი"
              last-page-content="ბოლო"
              pagination-container-class="blog-list-pagination"
              paginate-buttons-class="blog-list-paginate-button"
              number-buttons-class="blog-list-paginate-number"
              first-button-class="blog-list-paginate-edge"
              last-button-class="blog-list-paginate-edge"
              back-button-class="blog-list-paginate-nav"
              next-button-class="blog-list-paginate-nav"
              active-page-class="blog-list-paginate-active"
              disabled-paginate-buttons-class="blog-list-paginate-disabled"
              @click="handlePageClick"
            />
          </div>
        </ClientOnly>
      </div>
    </div>
  </section>
</template>

<style scoped>
:deep(.blog-list-pagination) {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.blog-list-paginate-button) {
  min-width: 40px;
  min-height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid var(--border-default);
  background: var(--surface);
  color: var(--text-primary);
  font-weight: 600;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

:deep(.blog-list-paginate-number) {
  min-width: 40px;
  padding: 0 10px;
}

:deep(.blog-list-paginate-nav) {
  padding: 0 12px;
}

:deep(.blog-list-paginate-edge) {
  min-width: 58px;
  padding: 0 14px;
}

@media (hover: hover) and (pointer: fine) {
  :deep(.blog-list-paginate-button:hover) {
    border-color: var(--accent-primary);
    background: var(--bg-secondary);
  }
}

:deep(.blog-list-paginate-active) {
  border-color: var(--accent-primary);
  background: var(--accent-primary);
  color: var(--text-invert);
}

:deep(.blog-list-paginate-disabled) {
  cursor: not-allowed;
  opacity: 0.45;
}

@media (max-width: 640px) {
  :deep(.blog-list-pagination) {
    gap: 6px;
    flex-wrap: wrap;
    justify-content: center;
  }

  :deep(.blog-list-paginate-button) {
    min-width: 34px;
    min-height: 34px;
    padding: 0 9px;
    font-size: 13px;
  }

  :deep(.blog-list-paginate-number) {
    min-width: 34px;
    padding: 0 8px;
  }

  :deep(.blog-list-paginate-nav) {
    padding: 0 10px;
  }
}
</style>
