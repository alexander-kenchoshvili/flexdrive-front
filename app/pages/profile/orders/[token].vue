<script setup lang="ts">
import BaseButton from "~/components/common/BaseButton.vue";
import ProfileOrderDetail from "~/components/profile/ProfileOrderDetail.vue";
import ProfileOrderDetailSkeleton from "~/components/profile/ProfileOrderDetailSkeleton.vue";
import ProfileShell from "~/components/profile/ProfileShell.vue";
import { useCommerceApi } from "~/composables/commerce/useCommerceApi";
import type { CommerceOrderSummary } from "~/types/commerce";

definePageMeta({
  skipCmsLoader: true,
  middleware: "auth-required",
  key: (route) => route.fullPath,
});

const route = useRoute();
const globalStore = useGlobalStore();
const { getOwnedOrderDetail } = useCommerceApi();

const isClientReady = ref(false);
const token = computed(() => String(route.params.token || ""));
const shouldLoadOrder = computed(
  () =>
    isClientReady.value &&
    globalStore.authResolved &&
    Boolean(globalStore.currentUser) &&
    Boolean(token.value),
);

const {
  data: orderData,
  pending,
  error,
  refresh,
} = useAsyncData(
  "profile-order-detail",
  () => getOwnedOrderDetail(token.value),
  {
    server: false,
    immediate: false,
  },
);

const order = computed(() => orderData.value || null);
const resolvedOrder = computed(() => order.value as CommerceOrderSummary);
const isInitialLoading = computed(
  () => !shouldLoadOrder.value || (pending.value && !order.value),
);
const hasHardLoadError = computed(
  () => !isInitialLoading.value && !order.value && Boolean(error.value),
);

watch(
  [shouldLoadOrder, token],
  ([canLoadOrder]) => {
    if (!canLoadOrder) {
      return;
    }

    void refresh();
  },
  { immediate: true },
);

const retryLoad = async () => {
  await refresh();
};

onMounted(() => {
  isClientReady.value = true;
});

useNoindexPage({
  title: "შეკვეთის დეტალი",
  description:
    "იხილე შეკვეთის დეტალები და მიმდინარე tracking სტატუსი AutoMate-ის პროფილის გვერდიდან.",
});
</script>

<template>
  <ProfileShell
    active-section="orders"
    eyebrow="სტატუსი"
    subtitle="აქ ჩანს კონკრეტული შეკვეთის დეტალები, მიწოდების ინფორმაცია და მიმდინარე ეტაპი."
  >
    <ProfileOrderDetailSkeleton v-if="isInitialLoading" />

    <section
      v-else-if="hasHardLoadError"
      class="rounded-[28px] border border-error/30 bg-surface p-6 text-sm text-text-secondary shadow-[0_24px_60px_-38px_var(--shadow-color)]"
    >
      <p class="text-base font-semibold text-text-primary">
        შეკვეთის დეტალების ჩატვირთვა ვერ მოხერხდა.
      </p>
      <p class="mt-2">
        ეს შეკვეთა ვერ მოიძებნა ან ამ ანგარიშს არ ეკუთვნის.
      </p>
      <div class="mt-4 flex flex-col gap-3 sm:flex-row">
        <BaseButton type="button" variant="primary" @click="retryLoad">
          თავიდან ცდა
        </BaseButton>
        <BaseButton as="nuxt-link" to="/profile/orders" variant="secondary">
          შეკვეთების სიაში დაბრუნება
        </BaseButton>
      </div>
    </section>

    <ProfileOrderDetail v-else :order="resolvedOrder" />
  </ProfileShell>
</template>
