<script setup lang="ts">
import AppBreadcrumbs from "~/components/common/AppBreadcrumbs.vue";
import CardPaymentResultPanel from "~/components/commerce/CardPaymentResultPanel.vue";
import { useCardPaymentFlow } from "~/composables/commerce/useCardPaymentFlow";
import { useCommerceApi } from "~/composables/commerce/useCommerceApi";
import type { CommerceCardPayment } from "~/types/commerce";

const props = defineProps<{
  hint: "success" | "fail";
}>();

const route = useRoute();
const { getCardPaymentStatus } = useCommerceApi();
const {
  clearReturnContext,
  readReturnContext,
  redirectToProvider,
} = useCardPaymentFlow();

const payment = ref<CommerceCardPayment | null>(null);
const initialLoading = ref(true);
const refreshing = ref(false);
const loadError = ref(false);
const automaticChecksComplete = ref(false);
const lastCheckedAt = ref("");

const paymentToken = computed(() => {
  const rawValue = Array.isArray(route.query.payment_token)
    ? route.query.payment_token[0]
    : route.query.payment_token;
  return String(rawValue || "").trim();
});

const isValidPaymentToken = computed(() =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    paymentToken.value,
  ),
);

const returnContext = computed(() =>
  readReturnContext(paymentToken.value),
);
const recoveryPath = computed(
  () =>
    returnContext.value?.returnTo ||
    (returnContext.value?.source === "buy_now"
      ? "/buy-now/checkout"
      : "/checkout"),
);
const recoveryLabel = computed(() =>
  returnContext.value?.source === "buy_now"
    ? "სწრაფ ყიდვაზე დაბრუნება"
    : "შეკვეთაზე დაბრუნება",
);

const breadcrumbItems = computed(() => [
  { label: "მთავარი", to: "/" },
  { label: "გადახდის სტატუსი" },
]);

const shouldPoll = computed(() => {
  if (!payment.value) return !loadError.value;
  return ["pending", "authorized", "verification_pending", "refund_pending"].includes(
    payment.value.result,
  );
});

let pollTimer: ReturnType<typeof setTimeout> | null = null;
let pollAttempts = 0;
let paidRedirectStarted = false;

const formatCheckedTime = () =>
  new Intl.DateTimeFormat("ka-GE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());

const clearPollTimer = () => {
  if (!pollTimer) return;
  clearTimeout(pollTimer);
  pollTimer = null;
};

const redirectToOrder = async () => {
  if (
    !import.meta.client ||
    paidRedirectStarted ||
    payment.value?.result !== "paid" ||
    !payment.value.order_public_token
  ) {
    return;
  }

  paidRedirectStarted = true;
  clearPollTimer();
  clearReturnContext(paymentToken.value);
  await new Promise((resolve) => setTimeout(resolve, 900));
  await navigateTo(`/checkout/success/${payment.value.order_public_token}`);
};

const schedulePoll = () => {
  clearPollTimer();
  if (!import.meta.client || !shouldPoll.value) return;

  if (pollAttempts >= 18) {
    automaticChecksComplete.value = true;
    return;
  }

  const delay = pollAttempts < 6 ? 2000 : pollAttempts < 12 ? 4000 : 7000;
  pollTimer = setTimeout(() => {
    if (document.visibilityState === "hidden") {
      schedulePoll();
      return;
    }
    void loadPayment({ background: true });
  }, delay);
};

const loadPayment = async (
  options: { background?: boolean } = {},
) => {
  if (!isValidPaymentToken.value) {
    loadError.value = true;
    initialLoading.value = false;
    return;
  }

  if (options.background) {
    pollAttempts += 1;
  } else if (!initialLoading.value) {
    refreshing.value = true;
  }

  try {
    const nextPayment = await getCardPaymentStatus(paymentToken.value);
    payment.value = nextPayment;
    loadError.value = false;
    lastCheckedAt.value = formatCheckedTime();
    automaticChecksComplete.value = false;

    if (nextPayment.result === "paid") {
      await redirectToOrder();
      return;
    }
  } catch {
    loadError.value = true;
  } finally {
    initialLoading.value = false;
    refreshing.value = false;
  }

  schedulePoll();
};

const refreshPayment = async () => {
  automaticChecksComplete.value = false;
  pollAttempts = 0;
  await loadPayment();
};

const continuePayment = () => {
  if (!payment.value) return;
  redirectToProvider(payment.value);
};

const recoverCheckout = async () => {
  clearPollTimer();
  clearReturnContext(paymentToken.value);
  await navigateTo(recoveryPath.value);
};

const handleVisibilityChange = () => {
  if (document.visibilityState === "visible" && shouldPoll.value) {
    void loadPayment({ background: true });
  }
};

await loadPayment();

onMounted(() => {
  document.addEventListener("visibilitychange", handleVisibilityChange);
  void redirectToOrder();
  schedulePoll();
});

onBeforeUnmount(() => {
  clearPollTimer();
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});

useNoindexPage({
  title: "ბარათით გადახდის სტატუსი",
  description:
    "FlexDrive უსაფრთხოდ ამოწმებს ბარათით გადახდის საბოლოო სტატუსს.",
});
</script>

<template>
  <main class="py-4 pb-12 sm:py-6 sm:pb-16 md:py-10 md:pb-20">
    <div class="container-fluid">
      <div class="space-y-4 sm:space-y-6 md:space-y-8">
        <AppBreadcrumbs :items="breadcrumbItems" />

        <CardPaymentResultPanel
          :payment="payment"
          :hint="props.hint"
          :initial-loading="initialLoading"
          :refreshing="refreshing"
          :load-error="loadError"
          :automatic-checks-complete="automaticChecksComplete"
          :last-checked-at="lastCheckedAt"
          :recovery-label="recoveryLabel"
          @refresh="void refreshPayment()"
          @continue-payment="continuePayment"
          @recover="void recoverCheckout()"
        />
      </div>
    </div>
  </main>
</template>
