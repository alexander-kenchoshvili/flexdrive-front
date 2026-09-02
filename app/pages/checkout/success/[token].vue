<script setup lang="ts">
import AppBreadcrumbs from "~/components/common/AppBreadcrumbs.vue";
import BaseButton from "~/components/common/BaseButton.vue";
import CheckoutSuccessSkeleton from "~/components/commerce/CheckoutSuccessSkeleton.vue";
import CheckoutSuccessSummary from "~/components/commerce/CheckoutSuccessSummary.vue";
import { useCommerceApi } from "~/composables/commerce/useCommerceApi";
import { useOrderReceipt } from "~/composables/commerce/useOrderReceipt";
import type { CommerceOrderSummary } from "~/types/commerce";

type BreadcrumbItem = {
  label: string;
  to?: string;
};

definePageMeta({
  skipCmsLoader: true,
  key: (route) => route.fullPath,
});

const route = useRoute();
const { getOrderSummary } = useCommerceApi();
const { downloadReceipt, readReceiptAccessToken } = useOrderReceipt();
const { trackPurchase } = useEcommerceAnalytics();
const globalStore = useGlobalStore();

const order = ref<CommerceOrderSummary | null>(null);
const pending = ref(true);
const loadError = ref<unknown>(null);
const receiptAccessToken = ref("");
const receiptLoading = ref(false);
const receiptError = ref("");

const token = computed(() => String(route.params.token || ""));
const receiptEligible = computed(
  () =>
    order.value?.payment_method === "cash_on_delivery" ||
    (order.value?.payment_method === "card" &&
      order.value.payment_status === "paid"),
);
const receiptAvailable = computed(
  () =>
    receiptEligible.value &&
    (Boolean(receiptAccessToken.value) || Boolean(globalStore.currentUser)),
);

const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
  { label: "მთავარი", to: "/" },
  { label: "შეკვეთის გაფორმება" },
  { label: "წარმატება" },
]);

const purchaseAnalyticsItems = computed(() =>
  (order.value?.items || []).map((item) => ({
    id: item.id,
    name: item.product_name,
    sku: item.sku,
    price: item.unit_price,
    quantity: item.quantity,
  })),
);

const trackLoadedPurchase = () => {
  if (!order.value) return;
  if (
    order.value.payment_method === "card" &&
    order.value.payment_status !== "paid"
  ) {
    return;
  }

  trackPurchase({
    transactionId: order.value.order_number || order.value.public_token,
    value: order.value.total,
    paymentType: order.value.payment_method,
    items: purchaseAnalyticsItems.value,
  });
};

const resolveStatusCode = (error: unknown): number | null => {
  const normalized = error as
    | { statusCode?: number; status?: number; response?: { status?: number } }
    | null
    | undefined;

  return (
    normalized?.statusCode ??
    normalized?.status ??
    normalized?.response?.status ??
    null
  );
};

const loadOrder = async () => {
  pending.value = true;
  loadError.value = null;
  order.value = null;

  try {
    order.value = await getOrderSummary(token.value);
  } catch (error) {
    loadError.value = error;
  } finally {
    pending.value = false;
  }
};

const handleReceiptDownload = async () => {
  if (!order.value || receiptLoading.value) return;

  receiptLoading.value = true;
  receiptError.value = "";
  try {
    await downloadReceipt({
      orderToken: order.value.public_token,
      orderNumber: order.value.order_number,
      accessToken: receiptAccessToken.value,
    });
  } catch {
    receiptError.value =
      "PDF-ის ჩამოტვირთვა ვერ მოხერხდა. სცადე ხელახლა ან გადაამოწმე შეკვეთის სტატუსი.";
  } finally {
    receiptLoading.value = false;
  }
};

await loadOrder();

if (!order.value && resolveStatusCode(loadError.value) === 404) {
  throw createError({
    statusCode: 404,
    statusMessage: "შეკვეთა ვერ მოიძებნა",
  });
}

if (!order.value && !loadError.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "შეკვეთა ვერ მოიძებნა",
  });
}

onMounted(() => {
  receiptAccessToken.value = readReceiptAccessToken(token.value);
  trackLoadedPurchase();
});

watch(order, () => {
  trackLoadedPurchase();
});

useNoindexPage({
  title: "შეკვეთა მიღებულია",
  description:
    "შეკვეთა წარმატებით შეიქმნა და დამადასტურებელი ინფორმაცია ხელმისაწვდომია ამ გვერდზე.",
});
</script>

<template>
  <main class="py-8 pb-16 md:py-10 md:pb-20">
    <div class="container-fluid">
      <div class="space-y-8">
        <AppBreadcrumbs :items="breadcrumbItems" />

        <CheckoutSuccessSkeleton v-if="pending" />

        <section
          v-else-if="loadError || !order"
          class="rounded-[24px] border border-error/30 bg-surface p-6 text-sm text-text-secondary shadow-[0_24px_60px_-38px_var(--shadow-color)]"
        >
          <p class="text-base font-semibold text-text-primary">
            შეკვეთის მონაცემების ჩატვირთვა ვერ მოხერხდა.
          </p>
          <p class="mt-2">
            გთხოვ სცადო ხელახლა ან დაბრუნდე მთავარ გვერდზე.
          </p>
          <div class="mt-4 flex flex-col gap-3 sm:flex-row">
            <BaseButton type="button" variant="primary" @click="loadOrder">
              თავიდან ცდა
            </BaseButton>
            <BaseButton as="nuxt-link" to="/" variant="secondary">
              მთავარზე დაბრუნება
            </BaseButton>
          </div>
        </section>

        <CheckoutSuccessSummary
          v-else
          :order="order"
          :receipt-available="receiptAvailable"
          :receipt-loading="receiptLoading"
          :receipt-error="receiptError"
          @download-receipt="void handleReceiptDownload()"
        />
      </div>
    </div>
  </main>
</template>
