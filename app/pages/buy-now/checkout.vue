<script setup lang="ts">
import AppBreadcrumbs from "~/components/common/AppBreadcrumbs.vue";
import BaseButton from "~/components/common/BaseButton.vue";
import CheckoutFormSections from "~/components/commerce/CheckoutFormSections.vue";
import CheckoutPageSkeleton from "~/components/commerce/CheckoutPageSkeleton.vue";
import CheckoutSummaryCard from "~/components/commerce/CheckoutSummaryCard.vue";
import {
  type CheckoutFieldErrors,
  type CheckoutFormValues,
  useCheckoutForm,
} from "~/composables/commerce/useCheckoutForm";
import {
  extractApiErrorPayload,
  normalizeApiErrorMessage,
} from "~/composables/commerce/errorUtils";
import { useCommerceApi } from "~/composables/commerce/useCommerceApi";
import { useCheckoutIdempotency } from "~/composables/commerce/useCheckoutIdempotency";
import { useCardPaymentFlow } from "~/composables/commerce/useCardPaymentFlow";
import { useBuyNowStore } from "~/stores/useBuyNowStore";
import type {
  CheckoutPaymentMethod,
  CheckoutPayload,
  CommerceBuyNowErrorCode,
  CommerceBuyNowIssue,
  CommerceCheckoutSummaryItem,
} from "~/types/commerce";

type BreadcrumbItem = {
  label: string;
  to?: string;
};

definePageMeta({
  skipCmsLoader: true,
});

const route = useRoute();
const globalStore = useGlobalStore();
const buyNowStore = useBuyNowStore();
const { checkoutBuyNow, startBuyNowCardPayment } = useCommerceApi();
const { getOrCreateKey, clearKey } = useCheckoutIdempotency("buy-now");
const {
  cardPaymentEnabled,
  availabilityPending: cardPaymentAvailabilityPending,
  extractPaymentError,
  redirectToProvider,
  storeReturnContext,
} = useCardPaymentFlow();
const { executeRecaptcha } = useRecaptcha();
const { trackAddPaymentInfo, trackBeginCheckout } = useEcommerceAnalytics();

const isClientReady = ref(false);
const sessionBootstrapPending = ref(false);
const submitPending = ref(false);
const checkoutCompleted = ref(false);
const trackedBeginCheckout = ref(false);
const formError = ref<string | null>(null);
const desktopSubmitFeedbackSelector = '[data-checkout-submit-feedback="desktop"]';

const {
  errors,
  validateSubmit,
  setErrors,
  setFieldValue,
  buyerType,
  companyName,
  companyNameAttrs,
  companyIdentificationCode,
  companyIdentificationCodeAttrs,
  firstName,
  firstNameAttrs,
  lastName,
  lastNameAttrs,
  email,
  emailAttrs,
  phone,
  phoneAttrs,
  city,
  cityAttrs,
  addressLine,
  addressLineAttrs,
  note,
  noteAttrs,
  termsAccepted,
  paymentMethod,
  extractFieldErrors,
  scrollToFirstInvalidField,
  syncProfileBackfill,
} = useCheckoutForm({ profileKey: "buy-now-checkout-profile" });

const sanitizeReturnTo = (value: unknown) => {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
};

const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
  { label: "მთავარი", to: "/" },
  { label: "სწრაფი ყიდვა" },
  { label: "შეკვეთის გაფორმება" },
]);

const lineItemLabel = computed(() => `${buyNowStore.itemCount} პროდუქტი`);
const returnToQuery = computed(() => sanitizeReturnTo(route.query.return_to));
const submitLabel = computed(() => "შეკვეთის დადასტურება");

const toBuyNowCheckoutAnalyticsItem = (
  item: CommerceCheckoutSummaryItem,
) => ({
  id: item.product_id,
  slug: item.slug,
  name: item.name,
  sku: item.sku,
  price: item.price,
  quantity: item.quantity,
});

const buyNowCheckoutAnalyticsItems = computed(() =>
  buyNowStore.summaryItems.map((item) => toBuyNowCheckoutAnalyticsItem(item)),
);

const buyNowInlineMessage = computed(() => {
  if (formError.value) {
    return formError.value;
  }

  const issues = buyNowStore.issues as CommerceBuyNowIssue[];
  if (!issues.length) {
    return null;
  }

  const issueTypes = new Set(issues.map((issue) => issue.issue_type));

  if (issueTypes.has("unavailable") || issueTypes.has("out_of_stock")) {
    return "პროდუქტი აღარ არის ხელმისაწვდომი. დაბრუნდი პროდუქტის გვერდზე და გადაამოწმე ხელმისაწვდომობა.";
  }

  if (issueTypes.has("quantity_adjusted")) {
    return "მოთხოვნილი რაოდენობა აღარ შეესაბამება ხელმისაწვდომ მარაგს. გადაამოწმე განახლებული რაოდენობა და დაადასტურე გაგრძელება.";
  }

  return "პროდუქტის ფასი შეიცვალა. გადაამოწმე განახლებული ფასი და დაადასტურე გაგრძელება.";
});

const isInitialLoading = computed(
  () =>
    !isClientReady.value ||
    !globalStore.authResolved ||
    (!buyNowStore.initialized && !buyNowStore.error),
);

const hasHardLoadError = computed(
  () =>
    isClientReady.value &&
    !buyNowStore.loading &&
    buyNowStore.initialized &&
    !buyNowStore.hasSession &&
    Boolean(buyNowStore.error) &&
    !buyNowStore.hasInactiveState,
);

const hasInactiveState = computed(
  () =>
    isClientReady.value &&
    buyNowStore.initialized &&
    !buyNowStore.hasSession &&
    buyNowStore.hasInactiveState,
);

const isBuyNowConflictCode = (code: unknown): code is CommerceBuyNowErrorCode =>
  [
    "buy_now_price_changed",
    "buy_now_availability_changed",
    "buy_now_session_not_found",
    "buy_now_session_expired",
  ].includes(String(code));

const extractBuyNowErrorCode = (
  error: unknown,
): CommerceBuyNowErrorCode | null => {
  const payload = extractApiErrorPayload(error);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const code = (payload as Record<string, unknown>).code;
  return isBuyNowConflictCode(code) ? code : null;
};

const extractBuyNowIssues = (error: unknown): CommerceBuyNowIssue[] => {
  const payload = extractApiErrorPayload(error);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return [];
  }

  const rawIssues = (payload as Record<string, unknown>).buy_now_issues;
  if (!Array.isArray(rawIssues)) {
    return [];
  }

  return rawIssues.flatMap((rawIssue) => {
    if (!rawIssue || typeof rawIssue !== "object" || Array.isArray(rawIssue)) {
      return [];
    }

    const issue = rawIssue as Record<string, unknown>;
    const productId = Number(issue.product_id);
    const requestedQuantity = Number(issue.requested_quantity);
    const availableQuantity = Number(issue.available_quantity);
    const issueType = String(issue.issue_type || "");
    const priceSnapshot = String(issue.price_snapshot || "");
    const currentPrice = String(issue.current_price || "");

    if (
      !Number.isInteger(productId) ||
      !Number.isInteger(requestedQuantity) ||
      !Number.isInteger(availableQuantity) ||
      ![
        "price_changed",
        "quantity_adjusted",
        "out_of_stock",
        "unavailable",
      ].includes(issueType)
    ) {
      return [];
    }

    return [
      {
        product_id: productId,
        issue_type: issueType as CommerceBuyNowIssue["issue_type"],
        requested_quantity: requestedQuantity,
        available_quantity: availableQuantity,
        price_snapshot: priceSnapshot,
        current_price: currentPrice,
      },
    ];
  });
};

const scrollToSubmitFeedback = async () => {
  if (!import.meta.client) return;
  if (window.matchMedia("(max-width: 1023px)").matches) return;

  await nextTick();

  const target = document.querySelector<HTMLElement>(desktopSubmitFeedbackSelector);
  if (!target) return;

  target.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "center",
    inline: "nearest",
  });
};

const clearFormError = () => {
  if (formError.value) {
    formError.value = null;
  }
};

const bootstrapSession = async () => {
  if (
    !import.meta.client ||
    !globalStore.authResolved ||
    sessionBootstrapPending.value
  ) {
    return;
  }

  sessionBootstrapPending.value = true;

  try {
    buyNowStore.setReturnToProduct(returnToQuery.value);
    await buyNowStore.ensureSessionLoaded();
  } catch {
    // Store error is already normalized for UI rendering.
  } finally {
    sessionBootstrapPending.value = false;
  }
};

const retryLoad = async () => {
  try {
    buyNowStore.setReturnToProduct(returnToQuery.value);
    await buyNowStore.refreshSession();
  } catch {
    // Store error is already normalized for UI rendering.
  }
};

const confirmUpdates = async () => {
  if (submitPending.value || buyNowStore.mutating || !buyNowStore.hasSession) {
    return;
  }

  formError.value = null;

  try {
    await buyNowStore.confirmSession();
  } catch (error) {
    const code = extractBuyNowErrorCode(error);
    if (
      code === "buy_now_price_changed" ||
      code === "buy_now_availability_changed"
    ) {
      try {
        await buyNowStore.refreshSession();
      } catch {
        // Keep current error visible if refresh fails.
      }
    }
  }
};

const selectPaymentMethod = (method: CheckoutPaymentMethod) => {
  if (paymentMethod.value !== method) {
    clearKey();
  }
  setFieldValue("payment_method", method);
  clearFormError();
};

const buildCheckoutPayload = (
  submittedValues: CheckoutFormValues,
  recaptchaToken: string,
): CheckoutPayload => ({
  buyer_type: submittedValues.buyer_type,
  company_name:
    submittedValues.buyer_type === "legal_entity"
      ? submittedValues.company_name.trim()
      : "",
  company_identification_code:
    submittedValues.buyer_type === "legal_entity"
      ? submittedValues.company_identification_code.trim()
      : "",
  first_name: submittedValues.first_name.trim(),
  last_name: submittedValues.last_name.trim(),
  email: submittedValues.email.trim(),
  phone: submittedValues.phone.trim(),
  city: submittedValues.city.trim(),
  address_line: submittedValues.address_line.trim(),
  note: submittedValues.note?.trim() || "",
  terms_accepted: submittedValues.terms_accepted,
  payment_method: submittedValues.payment_method,
  recaptcha_token: recaptchaToken,
});

const submitForm = validateSubmit(
  async (submittedValues) => {
    if (submitPending.value || !buyNowStore.hasSession) {
      return;
    }

    if (buyNowStore.requiresConfirmation || !buyNowStore.isCheckoutAvailable) {
      await scrollToSubmitFeedback();
      return;
    }

    formError.value = null;
    setErrors({});
    submitPending.value = true;
    trackAddPaymentInfo(
      buyNowCheckoutAnalyticsItems.value,
      submittedValues.payment_method,
    );

    try {
      const recaptchaToken = await executeRecaptcha("checkout");
      const checkoutPayload = buildCheckoutPayload(
        submittedValues,
        recaptchaToken,
      );

      if (submittedValues.payment_method === "card") {
        const payment = await startBuyNowCardPayment(
          checkoutPayload,
          getOrCreateKey(),
        );

        await syncProfileBackfill(submittedValues);
        storeReturnContext(payment.payment_token, {
          source: "buy_now",
          returnTo: route.fullPath,
        });

        if (payment.result === "paid" && payment.order_public_token) {
          checkoutCompleted.value = true;
          clearKey();
          buyNowStore.clear();
          await navigateTo(
            `/checkout/success/${payment.order_public_token}`,
          );
          return;
        }

        redirectToProvider(payment);
        return;
      }

      const order = await checkoutBuyNow(checkoutPayload, getOrCreateKey());

      await syncProfileBackfill(submittedValues);

      checkoutCompleted.value = true;
      clearKey();
      buyNowStore.clear();
      await navigateTo(`/checkout/success/${order.public_token}`);
    } catch (submitError) {
      const code = extractBuyNowErrorCode(submitError);
      const paymentError =
        submittedValues.payment_method === "card"
          ? extractPaymentError(submitError)
          : null;
      const failedPayment = paymentError?.payment;
      const isCardProviderError = Boolean(
        failedPayment || paymentError?.code?.startsWith("card_payment"),
      );

      if (
        submittedValues.payment_method === "card" &&
        isCardProviderError
      ) {
        if (failedPayment) {
          storeReturnContext(failedPayment.payment_token, {
            source: "buy_now",
            returnTo: route.fullPath,
          });

          if (failedPayment.redirect_url) {
            redirectToProvider(failedPayment);
            return;
          }

          if (paymentError?.code === "card_payment_already_active") {
            await navigateTo({
              path: "/checkout/payment/success",
              query: { payment_token: failedPayment.payment_token },
            });
            return;
          }
        }

        if (!paymentError?.retryable) {
          clearKey();
        }

        formError.value =
          paymentError?.detail ||
          "ბარათით გადახდის დაწყება ვერ მოხერხდა. თანხა არ ჩამოჭრილა.";
        await scrollToSubmitFeedback();
        return;
      }

      if (
        code === "buy_now_price_changed" ||
        code === "buy_now_availability_changed"
      ) {
        formError.value = normalizeApiErrorMessage(
          submitError,
          "სწრაფი ყიდვის გაგრძელება ვერ მოხერხდა. გადაამოწმე განახლებული მონაცემები.",
        );

        try {
          await buyNowStore.refreshSession();
        } catch {
          // Keep original conflict message visible.
        }

        await scrollToSubmitFeedback();
        return;
      }

      if (
        code === "buy_now_session_not_found" ||
        code === "buy_now_session_expired"
      ) {
        try {
          await buyNowStore.refreshSession();
        } catch {
          // Store captures the inactive-state message.
        }

        await scrollToSubmitFeedback();
        return;
      }

      const nextFieldErrors = extractFieldErrors(submitError);
      setErrors(nextFieldErrors);

      if (Object.keys(nextFieldErrors).length) {
        await scrollToFirstInvalidField(nextFieldErrors);
      } else {
        const issueTypes = new Set(
          extractBuyNowIssues(submitError).map((issue) => issue.issue_type),
        );

        if (issueTypes.has("unavailable") || issueTypes.has("out_of_stock")) {
          formError.value =
            "პროდუქტი აღარ არის ხელმისაწვდომი. დაბრუნდი პროდუქტის გვერდზე და გადაამოწმე ხელმისაწვდომობა.";
        } else {
          formError.value = normalizeApiErrorMessage(
            submitError,
            "სწრაფი ყიდვის დასრულება ვერ მოხერხდა. გთხოვ, სცადო ხელახლა.",
          );
        }

        await scrollToSubmitFeedback();
      }
    } finally {
      submitPending.value = false;
    }
  },
  async ({ errors: invalidErrors }) => {
    formError.value = null;
    await scrollToFirstInvalidField(invalidErrors as CheckoutFieldErrors);
  },
);

watch(returnToQuery, (nextValue) => {
  buyNowStore.setReturnToProduct(nextValue);
});

watch(
  cardPaymentEnabled,
  (enabled) => {
    if (!enabled && paymentMethod.value === "card") {
      setFieldValue("payment_method", "cash_on_delivery");
      clearKey();
    }
  },
  { immediate: true },
);

watch(
  () => [
    firstName.value,
    buyerType.value,
    companyName.value,
    companyIdentificationCode.value,
    lastName.value,
    email.value,
    phone.value,
    city.value,
    addressLine.value,
    note.value,
    termsAccepted.value,
    paymentMethod.value,
  ],
  () => {
    clearFormError();
  },
);

watch(
  () => globalStore.authResolved,
  (resolved) => {
    if (resolved) {
      void bootstrapSession();
    }
  },
  { immediate: true },
);

watch(
  [
    isClientReady,
    () => globalStore.authResolved,
    () => buyNowStore.initialized,
    () => buyNowStore.hasSession,
    () => buyNowStore.summaryItems.length,
  ],
  ([clientReady, authResolved, sessionInitialized, hasSession]) => {
    if (
      trackedBeginCheckout.value ||
      !clientReady ||
      !authResolved ||
      !sessionInitialized ||
      !hasSession ||
      !buyNowStore.summaryItems.length
    ) {
      return;
    }

    trackBeginCheckout(buyNowCheckoutAnalyticsItems.value);
    trackedBeginCheckout.value = true;
  },
  { immediate: true },
);

onMounted(() => {
  isClientReady.value = true;
  void bootstrapSession();
});

useNoindexPage({
  title: "სწრაფი ყიდვა",
  description:
    "შეავსე საკონტაქტო და მიწოდების ინფორმაცია სწრაფი ყიდვის დასასრულებლად.",
});
</script>

<template>
  <main class="py-4 pb-16 md:py-10 md:pb-36 lg:pb-12">
    <div class="container-fluid">
      <div class="space-y-4 md:space-y-8">
        <AppBreadcrumbs
          v-if="!isInitialLoading && (buyNowStore.hasSession || hasInactiveState || hasHardLoadError)"
          :items="breadcrumbItems"
        />

        <section
          v-if="!isInitialLoading && buyNowStore.hasSession"
          class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"
        >
          <div class="max-w-3xl">
            <h1
              class="title-under-xs text-[34px] font-extrabold upper leading-tight text-text-primary md:text-[44px]"
            >
              სწრაფი ყიდვა
            </h1>
            <p
              class="subtitle-under-xs mt-2 text-sm leading-6 text-text-secondary md:mt-3 md:text-base md:leading-7"
            >
              შეავსე საკონტაქტო და მიწოდების ინფორმაცია და დაადასტურე შეკვეთა
              პირდაპირ ამ პროდუქტისთვის.
            </p>
          </div>

          <div
            class="inline-flex w-fit items-center gap-2 rounded-full border border-border-default bg-surface px-3 py-1.5 text-sm font-semibold text-text-secondary shadow-[0_16px_40px_-34px_var(--shadow-color)] md:px-4 md:py-2"
          >
            <span class="h-2.5 w-2.5 rounded-full bg-accent-primary" />
            {{ lineItemLabel }}
          </div>
        </section>

        <CheckoutPageSkeleton v-if="isInitialLoading" />

        <section
          v-else-if="hasHardLoadError"
          class="rounded-[24px] border border-error/30 bg-surface p-4 text-sm text-text-secondary shadow-[0_24px_60px_-38px_var(--shadow-color)] md:p-6"
        >
          <p class="text-base font-semibold text-text-primary">
            სწრაფი ყიდვის ჩატვირთვა ვერ მოხერხდა.
          </p>
          <p class="mt-2">
            {{ buyNowStore.error || "გთხოვ, სცადო ხელახლა ან დაბრუნდე პროდუქტზე." }}
          </p>
          <div class="mt-4 flex flex-col gap-3 sm:flex-row">
            <BaseButton type="button" variant="primary" @click="retryLoad">
              თავიდან ცდა
            </BaseButton>
            <BaseButton
              as="nuxt-link"
              :to="buyNowStore.resolvedReturnToProduct"
              variant="secondary"
            >
              პროდუქტის გვერდზე დაბრუნება
            </BaseButton>
          </div>
        </section>

        <section
          v-else-if="hasInactiveState"
          class="rounded-[24px] border border-warning/30 bg-surface p-4 text-sm text-text-secondary shadow-[0_24px_60px_-38px_var(--shadow-color)] md:p-6"
        >
          <p class="text-base font-semibold text-text-primary">
            სწრაფი ყიდვის სესია აღარ არის აქტიური.
          </p>
          <p class="mt-2">
            {{
              buyNowStore.error ||
              "დაბრუნდი პროდუქტის გვერდზე და დაიწყე სწრაფი ყიდვა თავიდან."
            }}
          </p>
          <div class="mt-4 flex flex-col gap-3 sm:flex-row">
            <BaseButton
              as="nuxt-link"
              :to="buyNowStore.resolvedReturnToProduct"
              variant="primary"
            >
              პროდუქტის გვერდზე დაბრუნება
            </BaseButton>
            <BaseButton as="nuxt-link" to="/catalog" variant="secondary">
              კატალოგში დაბრუნება
            </BaseButton>
          </div>
        </section>

        <form
          v-else-if="buyNowStore.hasSession"
          class="space-y-4 md:space-y-8"
          novalidate
          @submit.prevent="submitForm"
        >
          <section
            class="grid min-w-0 gap-4 md:gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start"
          >
            <div class="min-w-0 space-y-3 md:space-y-4">
              <div
                v-if="buyNowStore.error && !buyNowStore.hasInactiveState"
                class="rounded-[20px] border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-text-secondary md:px-4 md:py-3"
              >
                {{ buyNowStore.error }}
              </div>

              <CheckoutFormSections
                v-model:buyer-type="buyerType"
                v-model:company-name="companyName"
                v-model:company-identification-code="companyIdentificationCode"
                v-model:first-name="firstName"
                v-model:last-name="lastName"
                v-model:email="email"
                v-model:phone="phone"
                v-model:city="city"
                v-model:address-line="addressLine"
                v-model:note="note"
                v-model:terms-accepted="termsAccepted"
                v-model:payment-method="paymentMethod"
                :disabled="submitPending"
                :errors="errors"
                :company-name-attrs="companyNameAttrs"
                :company-identification-code-attrs="companyIdentificationCodeAttrs"
                :first-name-attrs="firstNameAttrs"
                :last-name-attrs="lastNameAttrs"
                :email-attrs="emailAttrs"
                :phone-attrs="phoneAttrs"
                :city-attrs="cityAttrs"
                :address-line-attrs="addressLineAttrs"
                :note-attrs="noteAttrs"
                :card-payment-enabled="cardPaymentEnabled"
                :card-payment-loading="cardPaymentAvailabilityPending"
                @select-payment-method="selectPaymentMethod"
              />
            </div>

            <div class="min-w-0 max-w-full xl:sticky xl:top-40">
              <CheckoutSummaryCard
                :items="buyNowStore.summaryItems"
                :item-count="buyNowStore.itemCount"
                :total="buyNowStore.total"
                :error-message="buyNowStore.hasBlockingIssues ? buyNowInlineMessage : null"
                :price-change-message="
                  !buyNowStore.hasBlockingIssues ? buyNowInlineMessage : null
                "
                :confirmation-label="buyNowStore.confirmationLabel"
                :confirming="buyNowStore.mutating"
                :requires-confirmation="buyNowStore.requiresConfirmation"
                :submitting="submitPending"
                :disabled="submitPending || buyNowStore.mutating"
                :submit-label="submitLabel"
                :allow-submit="buyNowStore.isCheckoutAvailable"
                secondary-action-label="პროდუქტის გვერდზე დაბრუნება"
                :secondary-action-to="buyNowStore.resolvedReturnToProduct"
                source-mode="buy_now"
                @confirm="void confirmUpdates()"
              />
            </div>
          </section>

          <div
            class="fixed inset-x-0 bottom-0 z-30 border-t border-[#17345f] bg-[#020c1d] px-2 py-2 shadow-[0_-10px_34px_rgba(2,6,23,0.28)] md:px-6 md:py-3 lg:hidden"
          >
            <div
              class="mx-auto flex max-w-[1440px] flex-col gap-2 rounded-[18px] border border-[#17345f] bg-[#081a38] px-3 py-2.5 sm:flex-wrap sm:items-center md:gap-3 md:rounded-[20px] md:px-4 md:py-3"
            >
              <div
                v-if="buyNowInlineMessage"
                data-checkout-submit-feedback="mobile"
                class="rounded-[16px] px-3 py-2 text-sm sm:basis-full md:rounded-[18px] md:px-4 md:py-3"
                :class="
                  buyNowStore.hasBlockingIssues
                    ? 'border border-error/30 bg-error/10 text-error'
                    : 'border border-warning/30 bg-warning/10 text-text-secondary'
                "
              >
                {{ buyNowInlineMessage }}
              </div>

              <div class="min-w-0 flex-1">
                <p
                  class="text-xs font-medium uppercase tracking-[0.12em] text-text-muted"
                >
                  სულ
                </p>
                <p
                  class="mt-1 text-[22px] font-extrabold leading-none text-accent-primary md:text-2xl"
                >
                  {{ Number(buyNowStore.total || 0).toFixed(2) }} GEL
                </p>
              </div>

              <BaseButton
                v-if="buyNowStore.requiresConfirmation"
                type="button"
                variant="primary"
                :loading="buyNowStore.mutating"
                :disabled="submitPending || buyNowStore.mutating"
                class="w-full px-4 py-2.5 text-[12px] upper sm:w-auto sm:whitespace-nowrap md:px-5 md:py-3 md:text-sm"
                @click="void confirmUpdates()"
              >
                {{ buyNowStore.confirmationLabel }}
              </BaseButton>

              <BaseButton
                v-else-if="buyNowStore.isCheckoutAvailable"
                type="submit"
                variant="primary"
                :loading="submitPending"
                :disabled="submitPending || buyNowStore.mutating"
                class="w-full px-4 py-2.5 text-[12px] upper sm:w-auto sm:whitespace-nowrap md:px-5 md:py-3 md:text-sm"
              >
                {{ submitLabel }}
              </BaseButton>

              <BaseButton
                v-else
                as="nuxt-link"
                :to="buyNowStore.resolvedReturnToProduct"
                variant="primary"
                class="w-full px-4 py-2.5 text-[12px] upper sm:w-auto sm:whitespace-nowrap md:px-5 md:py-3 md:text-sm"
              >
                პროდუქტის გვერდზე დაბრუნება
              </BaseButton>

              <BaseButton
                v-if="!buyNowStore.isCheckoutAvailable"
                as="nuxt-link"
                to="/catalog"
                variant="secondary"
                class="w-full px-4 py-2.5 text-[12px] upper sm:w-auto sm:whitespace-nowrap md:px-5 md:py-3 md:text-sm"
              >
                კატალოგში დაბრუნება
              </BaseButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  </main>
</template>
