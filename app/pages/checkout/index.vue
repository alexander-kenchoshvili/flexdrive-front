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
import type {
  CheckoutPaymentMethod,
  CommerceCheckoutCartIssue,
} from "~/types/commerce";

type BreadcrumbItem = {
  label: string;
  to?: string;
};

definePageMeta({
  skipCmsLoader: true,
  middleware: "checkout-access",
});

const globalStore = useGlobalStore();
const cartStore = useCartStore();
const { checkoutOrder } = useCommerceApi();
const { executeRecaptcha } = useRecaptcha();

const isClientReady = ref(false);
const cartBootstrapPending = ref(false);
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
} = useCheckoutForm({ profileKey: "checkout-profile" });

const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
  { label: "მთავარი", to: "/" },
  { label: "კალათა", to: "/cart" },
  { label: "შეკვეთის გაფორმება" },
]);

const lineItemLabel = computed(() => `${cartStore.lineItemCount} პროდუქტი`);
const cartPriceConfirmationLabel = computed(() =>
  cartStore.priceChangeCount === 1
    ? "განახლებული ფასის დადასტურება"
    : "განახლებული ფასების დადასტურება",
);

const isInitialLoading = computed(
  () =>
    !isClientReady.value ||
    !globalStore.authResolved ||
    (!cartStore.initialized && !cartStore.error),
);

const hasHardLoadError = computed(
  () =>
    isClientReady.value &&
    !cartStore.loading &&
    !cartStore.initialized &&
    Boolean(cartStore.error),
);

const hasSoftError = computed(
  () =>
    isClientReady.value &&
    cartStore.initialized &&
    Boolean(cartStore.error) &&
    !cartStore.loading,
);

const isCartPriceChangeError = (error: unknown) => {
  const payload = extractApiErrorPayload(error);
  return Boolean(
    payload &&
      typeof payload === "object" &&
      !Array.isArray(payload) &&
      (payload as Record<string, unknown>).code === "cart_price_changed",
  );
};

const extractCartAvailabilityIssues = (
  error: unknown,
): CommerceCheckoutCartIssue[] => {
  const payload = extractApiErrorPayload(error);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return [];
  }

  const rawIssues = (payload as Record<string, unknown>).cart_issues;
  if (!Array.isArray(rawIssues)) {
    return [];
  }

  return rawIssues.flatMap((rawIssue) => {
    if (!rawIssue || typeof rawIssue !== "object" || Array.isArray(rawIssue)) {
      return [];
    }

    const issue = rawIssue as Record<string, unknown>;
    const cartItemId = Number(issue.cart_item_id);
    const productId = Number(issue.product_id);
    const requestedQuantity = Number(issue.requested_quantity);
    const availableQuantity = Number(issue.available_quantity);
    const issueType = issue.issue_type;

    if (
      !Number.isInteger(cartItemId) ||
      !Number.isInteger(productId) ||
      !Number.isInteger(requestedQuantity) ||
      !Number.isInteger(availableQuantity) ||
      !["quantity_adjusted", "out_of_stock", "unavailable"].includes(
        String(issueType),
      )
    ) {
      return [];
    }

    return [
      {
        cart_item_id: cartItemId,
        product_id: productId,
        requested_quantity: requestedQuantity,
        available_quantity: availableQuantity,
        issue_type: issueType as CommerceCheckoutCartIssue["issue_type"],
      },
    ];
  });
};

const isCartAvailabilityError = (error: unknown) => {
  const payload = extractApiErrorPayload(error);
  return Boolean(
    payload &&
      typeof payload === "object" &&
      !Array.isArray(payload) &&
      (payload as Record<string, unknown>).code === "cart_availability_changed",
  );
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

const bootstrapCart = async () => {
  if (
    !import.meta.client ||
    !globalStore.authResolved ||
    cartBootstrapPending.value
  ) {
    return;
  }

  cartBootstrapPending.value = true;

  try {
    await cartStore.ensureCartLoaded();
  } catch {
    // Store error is already normalized for UI rendering.
  } finally {
    cartBootstrapPending.value = false;
  }
};

const retryLoad = async () => {
  try {
    await cartStore.refreshCart();
  } catch {
    // Store error is already normalized for UI rendering.
  }
};

const confirmPriceChanges = async () => {
  if (submitPending.value || cartStore.mutating || !cartStore.hasPriceChanges) {
    return;
  }

  formError.value = null;

  try {
    await cartStore.confirmPrices();
  } catch {
    // Store error is already normalized for UI rendering.
  }
};

const selectPaymentMethod = (method: CheckoutPaymentMethod) => {
  setFieldValue("payment_method", method);
  clearFormError();
};

const submitForm = validateSubmit(
  async (submittedValues) => {
    if (submitPending.value || !cartStore.initialized || cartStore.isEmpty) {
      return;
    }

    if (cartStore.hasPriceChanges) {
      await scrollToSubmitFeedback();
      return;
    }

    formError.value = null;
    setErrors({});
    submitPending.value = true;

    try {
      const recaptchaToken = await executeRecaptcha("checkout");
      const order = await checkoutOrder({
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
      cartStore.clearAvailabilityAttention();
      await cartStore.refreshCart();
      await navigateTo(`/checkout/success/${order.public_token}`);
    } catch (submitError) {
      if (isCartPriceChangeError(submitError)) {
        formError.value = null;

        try {
          await cartStore.refreshCart();
        } catch {
          formError.value = normalizeApiErrorMessage(
            submitError,
            "კალათაში ფასები განახლდა. გადაამოწმე ახალი ფასები და დაადასტურე გაგრძელება.",
          );
        }

        await scrollToSubmitFeedback();
        return;
      }

      if (isCartAvailabilityError(submitError)) {
        formError.value = normalizeApiErrorMessage(
          submitError,
          "შეკვეთის გაფორმება ვერ მოხერხდა. გთხოვ, სცადო ხელახლა.",
        );
        cartStore.setAvailabilityAttention(
          extractCartAvailabilityIssues(submitError),
        );

        try {
          await cartStore.refreshCart();
        } catch {
          // Keep the original checkout error visible even if cart refresh fails.
        }

        await scrollToSubmitFeedback();
        return;
      }

      const nextFieldErrors = extractFieldErrors(submitError);
      setErrors(nextFieldErrors);

      if (Object.keys(nextFieldErrors).length) {
        await scrollToFirstInvalidField(nextFieldErrors);
      } else {
        formError.value = normalizeApiErrorMessage(
          submitError,
          "შეკვეთის გაფორმება ვერ მოხერხდა. გთხოვ, სცადო ხელახლა.",
        );
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
      void bootstrapCart();
    }
  },
  { immediate: true },
);

watch(
  [
    isClientReady,
    () => globalStore.authResolved,
    () => cartStore.initialized,
    () => cartStore.isEmpty,
  ],
  ([clientReady, authResolved, cartInitialized, cartEmpty]) => {
    if (
      clientReady &&
      authResolved &&
      cartInitialized &&
      cartEmpty &&
      !checkoutCompleted.value &&
      !submitPending.value
    ) {
      void navigateTo("/cart");
    }
  },
  { immediate: true },
);

onMounted(() => {
  isClientReady.value = true;
  void bootstrapCart();
});

useNoindexPage({
  title: "შეკვეთის გაფორმება",
  description:
    "შეავსე საკონტაქტო და მიწოდების ინფორმაცია შეკვეთის დასასრულებლად.",
});
</script>

<template>
  <main class="py-8 pb-32 md:py-10 md:pb-36 lg:pb-12">
    <div class="container-fluid">
      <div class="space-y-8">
        <AppBreadcrumbs
          v-if="!isInitialLoading && !hasHardLoadError && !cartStore.isEmpty"
          :items="breadcrumbItems"
        />

        <section
          v-if="!isInitialLoading && !hasHardLoadError && !cartStore.isEmpty"
          class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"
        >
          <div class="max-w-3xl">
            <h1
              class="title-under-xs text-[34px] font-extrabold upper leading-tight text-text-primary md:text-[44px]"
            >
              შეკვეთის გაფორმება
            </h1>
            <p
              class="subtitle-under-xs mt-3 text-sm leading-7 text-text-secondary md:text-base"
            >
              შეავსე საკონტაქტო და მიწოდების ინფორმაცია, შემდეგ დაადასტურე
              შეკვეთა.
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
            checkout-ის ჩატვირთვა ვერ მოხერხდა.
          </p>
          <p class="mt-2">
            {{ cartStore.error || "გთხოვ სცადო ხელახლა ან დაბრუნდე კალათაში." }}
          </p>
          <div class="mt-4 flex flex-col gap-3 sm:flex-row">
            <BaseButton type="button" variant="primary" @click="retryLoad">
              თავიდან ცდა
            </BaseButton>
            <BaseButton as="nuxt-link" to="/cart" variant="secondary">
              კალათაში დაბრუნება
            </BaseButton>
          </div>
        </section>

        <form
          v-else-if="!cartStore.isEmpty"
          class="space-y-8"
          novalidate
          @submit.prevent="submitForm"
        >
          <section
            class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start"
          >
            <div class="space-y-4">
              <div
                v-if="hasSoftError"
                class="rounded-[20px] border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-text-secondary"
              >
                {{ cartStore.error }}
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
                :items="cartStore.items"
                :item-count="cartStore.itemCount"
                :total="cartStore.total"
                :error-message="formError"
                :price-change-message="cartStore.priceChangeMessage"
                :confirmation-label="cartPriceConfirmationLabel"
                :confirming="cartStore.mutating"
                :requires-confirmation="cartStore.hasPriceChanges"
                :submitting="submitPending"
                :disabled="submitPending || cartStore.mutating"
                @confirm="void confirmPriceChanges()"
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
                v-if="cartStore.priceChangeMessage || formError"
                data-checkout-submit-feedback="mobile"
                class="rounded-[18px] px-4 py-3 text-sm sm:basis-full"
                :class="
                  cartStore.priceChangeMessage
                    ? 'border border-warning/30 bg-warning/10 text-text-secondary'
                    : 'border border-error/30 bg-error/10 text-error'
                "
              >
                {{ cartStore.priceChangeMessage || formError }}
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
                  {{ Number(cartStore.total || 0).toFixed(2) }} GEL
                </p>
              </div>

              <BaseButton
                :type="cartStore.hasPriceChanges ? 'button' : 'submit'"
                variant="primary"
                :loading="cartStore.hasPriceChanges ? cartStore.mutating : submitPending"
                :disabled="submitPending || cartStore.mutating"
                class="w-full px-5 py-3 text-sm upper sm:w-auto sm:whitespace-nowrap"
                @click="cartStore.hasPriceChanges ? void confirmPriceChanges() : undefined"
              >
                {{
                  cartStore.hasPriceChanges
                    ? cartPriceConfirmationLabel
                    : "შეკვეთის დადასტურება"
                }}
              </BaseButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  </main>
</template>
