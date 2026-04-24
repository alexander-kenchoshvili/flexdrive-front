<script setup lang="ts">
import BaseButton from "~/components/common/BaseButton.vue";
import ProfileOrdersList from "~/components/profile/ProfileOrdersList.vue";
import ProfileOrdersSkeleton from "~/components/profile/ProfileOrdersSkeleton.vue";
import ProfileShell from "~/components/profile/ProfileShell.vue";
import { useCommerceApi } from "~/composables/commerce/useCommerceApi";

definePageMeta({
  skipCmsLoader: true,
  middleware: "auth-required",
});

const route = useRoute();
const globalStore = useGlobalStore();
const { getOwnedOrders } = useCommerceApi();

const isClientReady = ref(false);
const pageSize = 10;

const currentPage = computed(() => {
  const raw = Number.parseInt(String(route.query.page || "1"), 10);

  if (Number.isNaN(raw) || raw < 1) {
    return 1;
  }

  return raw;
});

const shouldLoadOrders = computed(
  () =>
    isClientReady.value &&
    globalStore.authResolved &&
    Boolean(globalStore.currentUser),
);

const {
  data: ordersResponse,
  pending,
  error,
  refresh,
} = useAsyncData(
  "profile-orders",
  () => getOwnedOrders(currentPage.value),
  {
    server: false,
    immediate: false,
  },
);

const orders = computed(() => ordersResponse.value?.results || []);
const totalCount = computed(() => ordersResponse.value?.count || 0);
const summary = computed(() => ordersResponse.value?.summary || null);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalCount.value / pageSize)),
);
const isInitialLoading = computed(
  () => !shouldLoadOrders.value || (pending.value && !ordersResponse.value),
);
const hasHardLoadError = computed(
  () => !isInitialLoading.value && !ordersResponse.value && Boolean(error.value),
);

watch(
  [shouldLoadOrders, currentPage],
  ([canLoadOrders]) => {
    if (!canLoadOrders) {
      return;
    }

    void refresh();
  },
  { immediate: true },
);

const changePage = async (page: number) => {
  const nextQuery = { ...route.query } as Record<string, string>;

  if (page <= 1) {
    delete nextQuery.page;
  } else {
    nextQuery.page = String(page);
  }

  await navigateTo({
    path: "/profile/orders",
    query: nextQuery,
  });
};

const retryLoad = async () => {
  await refresh();
};

onMounted(() => {
  isClientReady.value = true;
});

useNoindexPage({
  title: "ჩემი შეკვეთები",
  description:
    "გადახედე შეკვეთების ისტორიას და მიმდინარე tracking სტატუსებს FlexDrive-ის პროფილში.",
});
</script>

<template>
  <ProfileShell
    active-section="orders"
    eyebrow="შეკვეთები"
    subtitle="აქ ნახავ შეკვეთების ისტორიას და თითოეულის მიმდინარე სტატუსს."
  >
    <ProfileOrdersSkeleton v-if="isInitialLoading" />

    <section
      v-else-if="hasHardLoadError"
      class="rounded-[28px] border border-error/30 bg-surface p-6 text-sm text-text-secondary shadow-[0_24px_60px_-38px_var(--shadow-color)]"
    >
      <p class="text-base font-semibold text-text-primary">
        შეკვეთების ისტორიის ჩატვირთვა ვერ მოხერხდა.
      </p>
      <p class="mt-2">
        გთხოვ სცადო თავიდან ან მოგვიანებით დაბრუნდე ამ გვერდზე.
      </p>
      <div class="mt-4 flex flex-col gap-3 sm:flex-row">
        <BaseButton type="button" variant="primary" @click="retryLoad">
          თავიდან ცდა
        </BaseButton>
        <BaseButton as="nuxt-link" to="/" variant="secondary">
          მთავარზე დაბრუნება
        </BaseButton>
      </div>
    </section>

    <ProfileOrdersList
      v-else
      :orders="orders"
      :summary="summary"
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-count="totalCount"
      @change-page="changePage"
    />
  </ProfileShell>
</template>
