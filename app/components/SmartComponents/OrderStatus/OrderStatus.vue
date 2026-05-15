<script setup lang="ts">
import {
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  ReceiptRefundIcon,
} from "@heroicons/vue/24/outline";
import AppBreadcrumbs from "~/components/common/AppBreadcrumbs.vue";
import BaseButton from "~/components/common/BaseButton.vue";
import BaseInput from "~/components/common/BaseInput.vue";
import BasePicture from "~/components/common/BasePicture.vue";
import { useCatalogPlaceholderMedia } from "~/composables/catalog/useCatalogPlaceholderMedia";
import { useCommerceApi } from "~/composables/commerce/useCommerceApi";
import { useCommercePresentation } from "~/composables/commerce/useCommercePresentation";
import { sanitizeText } from "~/composables/helpers";
import type { CommerceOrderLookupItem, CommerceOrderLookupSummary } from "~/types/commerce";
import type { SmartComponentRenderData } from "~/types/page";

type OrderStatusData = SmartComponentRenderData & {
  updated_at?: string | null;
};

type StoredOrderLookup = {
  order_number: string;
  phone: string;
  result: CommerceOrderLookupSummary | null;
};

const ORDER_LOOKUP_STORAGE_KEY = "flexdrive:order-status:last-lookup";

const props = defineProps<{
  data?: OrderStatusData;
}>();

const { cardPlaceholderImage } = useCatalogPlaceholderMedia();
const { lookupOrder } = useCommerceApi();
const { executeRecaptcha } = useRecaptcha();
const {
  getOrderStatusBadgeClasses,
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusBadgeClasses,
  getPaymentStatusLabel,
} = useCommercePresentation();

const sectionTitle = computed(
  () => sanitizeText(props.data?.title) || "შეკვეთის სტატუსი",
);
const sectionSubtitle = computed(
  () =>
    sanitizeText(props.data?.subtitle) ||
    "შეიყვანეთ შეკვეთის ნომერი და ტელეფონის ნომერი, რომ ნახოთ შეკვეთის მიმდინარე მდგომარეობა.",
);

const breadcrumbItems = computed(() => [
  { label: "მთავარი", to: "/" },
  { label: "შეკვეთის სტატუსი" },
]);

const form = reactive({
  order_number: "",
  phone: "",
});

const errors = reactive({
  order_number: "",
  phone: "",
});

const loading = ref(false);
const errorMessage = ref("");
const order = ref<CommerceOrderLookupSummary | null>(null);

const trimmedOrderNumber = computed(() => form.order_number.trim());
const trimmedPhone = computed(() => form.phone.trim());

const formatMoney = (value: string | number | null | undefined) =>
  `${Number(value || 0).toFixed(2)} GEL`;

const formattedCreatedAt = computed(() => {
  if (!order.value?.created_at) return "";

  const date = new Date(order.value.created_at);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ka-GE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
});

const resolveItemImage = (item: CommerceOrderLookupItem) => {
  const asset = item.primary_image;
  if (asset?.desktop || asset?.tablet || asset?.mobile) {
    return asset;
  }
  return cardPlaceholderImage;
};

const clearErrors = () => {
  errors.order_number = "";
  errors.phone = "";
  errorMessage.value = "";
};

const applyFieldErrors = (payload: Record<string, unknown>) => {
  (["order_number", "phone"] as const).forEach((fieldName) => {
    const fieldErrors = payload[fieldName];
    if (Array.isArray(fieldErrors) && fieldErrors.length) {
      errors[fieldName] = String(fieldErrors[0]);
    }
  });
};

const validateForm = () => {
  clearErrors();

  if (!trimmedOrderNumber.value) {
    errors.order_number = "შეკვეთის ნომერი სავალდებულოა.";
  }

  if (!trimmedPhone.value) {
    errors.phone = "ტელეფონის ნომერი სავალდებულოა.";
  }

  return !errors.order_number && !errors.phone;
};

const readStoredLookup = (): StoredOrderLookup | null => {
  if (!import.meta.client) return null;

  try {
    const value = window.sessionStorage.getItem(ORDER_LOOKUP_STORAGE_KEY);
    if (!value) return null;

    const parsed = JSON.parse(value) as Partial<StoredOrderLookup>;
    if (
      typeof parsed.order_number !== "string" ||
      typeof parsed.phone !== "string" ||
      !parsed.order_number.trim() ||
      !parsed.phone.trim()
    ) {
      return null;
    }

    const result =
      parsed.result &&
      typeof parsed.result === "object" &&
      typeof parsed.result.order_number === "string" &&
      Array.isArray(parsed.result.items)
        ? (parsed.result as CommerceOrderLookupSummary)
        : null;

    return {
      order_number: parsed.order_number.trim(),
      phone: parsed.phone.trim(),
      result,
    };
  } catch {
    return null;
  }
};

const storeLookup = (
  payload: Pick<StoredOrderLookup, "order_number" | "phone">,
  result: CommerceOrderLookupSummary,
) => {
  if (!import.meta.client) return;

  window.sessionStorage.setItem(
    ORDER_LOOKUP_STORAGE_KEY,
    JSON.stringify({ ...payload, result }),
  );
};

const clearStoredLookup = () => {
  if (!import.meta.client) return;
  window.sessionStorage.removeItem(ORDER_LOOKUP_STORAGE_KEY);
};

const submitLookup = async () => {
  if (loading.value) return;

  if (!validateForm()) {
    order.value = null;
    clearStoredLookup();
    return;
  }

  loading.value = true;
  order.value = null;
  const lookupPayload = {
    order_number: trimmedOrderNumber.value,
    phone: trimmedPhone.value,
  };

  try {
    const recaptchaToken = await executeRecaptcha("order_lookup");
    const lookupResult = await lookupOrder({
      ...lookupPayload,
      recaptcha_token: recaptchaToken,
    });
    order.value = lookupResult;
    storeLookup(lookupPayload, lookupResult);
  } catch (error: any) {
    const payload = error?.data ?? {};
    applyFieldErrors(payload);
    clearStoredLookup();
    errorMessage.value =
      payload?.detail ||
      "მოთხოვნის გაგზავნა ვერ მოხერხდა. სცადეთ ხელახლა.";
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  const storedLookup = readStoredLookup();
  if (!storedLookup) return;

  form.order_number = storedLookup.order_number;
  form.phone = storedLookup.phone;
  order.value = storedLookup.result;
});
</script>

<template>
  <section class="overflow-hidden py-6 sm:py-8 lg:py-10">
    <div class="container-fluid min-w-0">
      <AppBreadcrumbs :items="breadcrumbItems" />

      <div class="mt-5 grid min-w-0 gap-5 lg:mt-7 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-6">
        <section
          class="min-w-0 overflow-hidden rounded-[22px] border border-border-default bg-surface p-4 shadow-[0_22px_52px_-40px_var(--shadow-color)] sm:rounded-[26px] sm:p-6 lg:p-7"
        >
          <div
            class="inline-flex h-12 w-12 items-center justify-center rounded-[16px] border border-accent-primary/30 bg-accent-primary/10 text-accent-primary"
          >
            <ClipboardDocumentCheckIcon class="h-6 w-6" aria-hidden="true" />
          </div>

          <h1
            class="upper mt-4 text-3xl font-extrabold leading-tight text-text-primary sm:text-4xl lg:text-5xl"
          >
            {{ sectionTitle }}
          </h1>

          <p class="mt-3 text-sm leading-7 text-text-secondary sm:text-base sm:leading-8">
            {{ sectionSubtitle }}
          </p>

          <form class="mt-6 grid gap-4" novalidate @submit.prevent="submitLookup">
            <BaseInput
              v-model="form.order_number"
              label="შეკვეთის ნომერი *"
              name="order_number"
              autocomplete="off"
              placeholder="მაგ: ORD-20260515-000001"
              :error="errors.order_number"
              :disabled="loading"
              required
            />

            <BaseInput
              v-model="form.phone"
              label="ტელეფონის ნომერი *"
              name="phone"
              type="tel"
              autocomplete="tel"
              placeholder="+995 5XX XX XX XX"
              :error="errors.phone"
              :disabled="loading"
              required
            />

            <BaseButton type="submit" size="lg" full-width :loading="loading">
              <template #left>
                <MagnifyingGlassIcon class="h-5 w-5" aria-hidden="true" />
              </template>
              შემოწმება
            </BaseButton>
          </form>

          <p
            v-if="errorMessage"
            class="mt-4 rounded-[16px] border border-error/30 bg-error/10 px-4 py-3 text-sm leading-6 text-error"
          >
            {{ errorMessage }}
          </p>
        </section>

        <section
          class="min-w-0 overflow-hidden rounded-[22px] border border-border-default bg-surface p-4 shadow-[0_22px_52px_-40px_var(--shadow-color)] sm:rounded-[26px] sm:p-6 lg:p-7"
        >
          <div v-if="order" class="min-w-0 space-y-5">
            <div class="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0">
                <p class="text-xs font-semibold uppercase tracking-[0.14em] text-accent-primary">
                  შეკვეთა
                </p>
                <h2 class="mt-2 break-words text-2xl font-extrabold text-text-primary sm:text-3xl">
                  {{ order.order_number }}
                </h2>
                <p v-if="formattedCreatedAt" class="mt-2 text-sm text-text-secondary">
                  {{ formattedCreatedAt }}
                </p>
              </div>

              <div class="min-w-0 text-left sm:text-right">
                <p class="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                  ჯამი
                </p>
                <p class="mt-1 break-words text-3xl font-extrabold leading-none text-accent-primary">
                  {{ formatMoney(order.total) }}
                </p>
              </div>
            </div>

            <div class="grid min-w-0 gap-3 sm:grid-cols-2">
              <div
                :class="[
                  'min-w-0 rounded-[16px] border px-4 py-3 text-sm font-semibold',
                  getOrderStatusBadgeClasses(order.status),
                ]"
              >
                <p class="text-[11px] uppercase tracking-[0.12em] opacity-75">
                  შეკვეთის სტატუსი
                </p>
                <p class="mt-1">{{ getOrderStatusLabel(order.status) }}</p>
              </div>

              <div
                :class="[
                  'min-w-0 rounded-[16px] border px-4 py-3 text-sm font-semibold',
                  getPaymentStatusBadgeClasses(order.payment_status),
                ]"
              >
                <p class="text-[11px] uppercase tracking-[0.12em] opacity-75">
                  გადახდის სტატუსი
                </p>
                <p class="mt-1">
                  {{ getPaymentStatusLabel(order.payment_status, order.payment_method) }}
                </p>
              </div>
            </div>

            <div
              class="flex min-w-0 items-center gap-3 rounded-[16px] border border-border-default bg-surface-2 px-4 py-3"
            >
              <span
                class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-border-default bg-surface text-text-primary"
              >
                <ReceiptRefundIcon class="h-5 w-5" aria-hidden="true" />
              </span>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-text-primary">
                  {{ getPaymentMethodLabel(order.payment_method) }}
                </p>
                <p class="mt-1 text-xs text-text-secondary">
                  პროდუქტი: {{ order.total_quantity }} ცალი
                </p>
              </div>
            </div>

            <div>
              <h3 class="text-base font-extrabold text-text-primary">
                პროდუქტები
              </h3>

              <div class="mt-3 space-y-3">
                <article
                  v-for="(item, index) in order.items"
                  :key="`${item.sku}-${index}`"
                    class="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-[16px] border border-border-default bg-surface-2 p-3 sm:flex sm:items-center"
                >
                  <div
                    class="h-14 w-14 shrink-0 overflow-hidden rounded-[12px] border border-border-default bg-white/95"
                  >
                    <BasePicture
                      :data="resolveItemImage(item)"
                      :alt="item.product_name"
                      class="h-full w-full"
                      preset="thumb"
                      fit="contain"
                      lazy
                    />
                  </div>

                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold text-text-primary">
                      {{ item.product_name }}
                    </p>
                    <p class="mt-1 text-xs text-text-muted">
                      {{ item.quantity }} ც. · SKU: {{ item.sku || "-" }}
                    </p>
                  </div>

                  <p class="col-span-2 min-w-0 break-words text-right text-sm font-semibold text-text-primary sm:col-span-1 sm:shrink-0">
                    {{ formatMoney(item.line_total) }}
                  </p>
                </article>
              </div>
            </div>
          </div>

          <div
            v-else
            class="flex h-full min-h-[288px] flex-col items-center justify-center rounded-[18px] border border-dashed border-border-default bg-surface-2 px-5 py-8 text-center"
          >
            <span
              class="inline-flex h-14 w-14 items-center justify-center rounded-[18px] border border-border-default bg-surface text-text-secondary"
            >
              <PhoneIcon class="h-7 w-7" aria-hidden="true" />
            </span>
            <h2 class="mt-4 text-xl font-extrabold text-text-primary">
              მონაცემები გამოჩნდება შემოწმების შემდეგ
            </h2>
            <p class="mt-2 max-w-md text-sm leading-7 text-text-secondary">
              გამოიყენეთ ის ტელეფონის ნომერი, რომელიც checkout-ში მიუთითეთ.
            </p>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>
