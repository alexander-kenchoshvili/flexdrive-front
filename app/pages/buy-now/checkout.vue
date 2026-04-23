<script setup lang="ts">
import AppBreadcrumbs from "~/components/common/AppBreadcrumbs.vue";
import BaseButton from "~/components/common/BaseButton.vue";
import CheckoutFormSections from "~/components/commerce/CheckoutFormSections.vue";
import CheckoutPageSkeleton from "~/components/commerce/CheckoutPageSkeleton.vue";
import CheckoutSummaryCard from "~/components/commerce/CheckoutSummaryCard.vue";
import {
  type CheckoutFieldErrors,
  useCheckoutForm,
} from "~/composables/commerce/useCheckoutForm";
import {
  extractApiErrorPayload,
  normalizeApiErrorMessage,
} from "~/composables/commerce/errorUtils";
import { useCommerceApi } from "~/composables/commerce/useCommerceApi";
import { useBuyNowStore } from "~/stores/useBuyNowStore";
import type {
  CheckoutPaymentMethod,
  CommerceBuyNowErrorCode,
  CommerceBuyNowIssue,
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
const { checkoutBuyNow } = useCommerceApi();
const { executeRecaptcha } = useRecaptcha();

const isClientReady = ref(false);
const sessionBootstrapPending = ref(false);
const submitPending = ref(false);
const checkoutCompleted = ref(false);
const formError = ref<string | null>(null);
const desktopSubmitFeedbackSelector = '[data-checkout-submit-feedback="desktop"]';

const {
  errors,
  validateSubmit,
  setErrors,
  setFieldValue,
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
  setFieldValue("payment_method", method);
  clearFormError();
};

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

    try {
      const recaptchaToken = await executeRecaptcha("checkout");
      const order = await checkoutBuyNow({
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

      await syncProfileBackfill(submittedValues);

      checkoutCompleted.value = true;
      buyNowStore.clear();
      await navigateTo(`/checkout/success/${order.public_token}`);
    } catch (submitError) {
      const code = extractBuyNowErrorCode(submitError);

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
  () => [
    firstName.value,
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
  <main class="py-8 pb-32 md:py-10 md:pb-36 lg:pb-12">
    <div class="container-fluid">
      <div class="space-y-8">
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
              class="subtitle-under-xs mt-3 text-sm leading-7 text-text-secondary md:text-base"
            >
              შეავსე საკონტაქტო და მიწოდების ინფორმაცია და დაადასტურე შეკვეთა
              პირდაპირ ამ პროდუქტისთვის.
            </p>
          </div>

          <div
            class="inline-flex w-fit items-center gap-2 rounded-full border border-border-default bg-surface px-4 py-2 text-sm font-semibold text-text-secondary shadow-[0_16px_40px_-34px_var(--shadow-color)]"
          >
            <span class="h-2.5 w-2.5 rounded-full bg-accent-primary" />
            {{ lineItemLabel }}
          </div>
        </section>

        <CheckoutPageSkeleton v-if="isInitialLoading" />

        <section
          v-else-if="hasHardLoadError"
          class="rounded-[24px] border border-error/30 bg-surface p-6 text-sm text-text-secondary shadow-[0_24px_60px_-38px_var(--shadow-color)]"
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
          class="rounded-[24px] border border-warning/30 bg-surface p-6 text-sm text-text-secondary shadow-[0_24px_60px_-38px_var(--shadow-color)]"
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
          class="space-y-8"
          novalidate
          @submit.prevent="submitForm"
        >
          <section
            class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start"
          >
            <div class="space-y-4">
              <div
                v-if="buyNowStore.error && !buyNowStore.hasInactiveState"
                class="rounded-[20px] border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-text-secondary"
              >
                {{ buyNowStore.error }}
              </div>

              <CheckoutFormSections
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
                :first-name-attrs="firstNameAttrs"
                :last-name-attrs="lastNameAttrs"
                :email-attrs="emailAttrs"
                :phone-attrs="phoneAttrs"
                :city-attrs="cityAttrs"
                :address-line-attrs="addressLineAttrs"
                :note-attrs="noteAttrs"
                @select-payment-method="selectPaymentMethod"
              />
            </div>

            <div class="xl:sticky xl:top-40">
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
                :allow-submit="buyNowStore.isCheckoutAvailable"
                secondary-action-label="პროდუქტის გვერდზე დაბრუნება"
                :secondary-action-to="buyNowStore.resolvedReturnToProduct"
                source-mode="buy_now"
                @confirm="void confirmUpdates()"
              />
            </div>
          </section>

          <div
            class="fixed inset-x-0 bottom-0 z-30 border-t border-[#17345f] bg-[#020c1d] px-3 py-3 shadow-[0_-10px_34px_rgba(2,6,23,0.28)] md:px-6 lg:hidden"
          >
            <div
              class="mx-auto flex max-w-[1440px] flex-col gap-3 rounded-[20px] border border-[#17345f] bg-[#081a38] px-4 py-3 sm:flex-wrap sm:items-center"
            >
              <div
                v-if="buyNowInlineMessage"
                data-checkout-submit-feedback="mobile"
                class="rounded-[18px] px-4 py-3 text-sm sm:basis-full"
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
                  class="mt-1 text-2xl font-extrabold leading-none text-accent-primary"
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
                class="w-full px-5 py-3 text-sm upper sm:w-auto sm:whitespace-nowrap"
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
                class="w-full px-5 py-3 text-sm upper sm:w-auto sm:whitespace-nowrap"
              >
                შეკვეთის დადასტურება
              </BaseButton>

              <BaseButton
                v-else
                as="nuxt-link"
                :to="buyNowStore.resolvedReturnToProduct"
                variant="primary"
                class="w-full px-5 py-3 text-sm upper sm:w-auto sm:whitespace-nowrap"
              >
                პროდუქტის გვერდზე დაბრუნება
              </BaseButton>

              <BaseButton
                v-if="!buyNowStore.isCheckoutAvailable"
                as="nuxt-link"
                to="/catalog"
                variant="secondary"
                class="w-full px-5 py-3 text-sm upper sm:w-auto sm:whitespace-nowrap"
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
