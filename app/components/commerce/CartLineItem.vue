<script setup lang="ts">
import {
  MinusIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/vue/24/outline";
import BasePicture from "~/components/common/BasePicture.vue";
import { useCatalogPlaceholderMedia } from "~/composables/catalog/useCatalogPlaceholderMedia";
import { sanitizeText } from "~/composables/helpers";
import type {
  CommerceCartItem,
  CommerceCheckoutCartIssue,
} from "~/types/commerce";

const props = withDefaults(
  defineProps<{
    item: CommerceCartItem;
    attention?: CommerceCheckoutCartIssue | null;
    disabled?: boolean;
  }>(),
  {
    attention: null,
    disabled: false,
  },
);

defineEmits<{
  increment: [];
  decrement: [];
  remove: [];
}>();

const { cardPlaceholderImage } = useCatalogPlaceholderMedia();

const formatMoney = (value: string | number | null | undefined) =>
  `${Number(value || 0).toFixed(2)} GEL`;

const imageData = computed(() => {
  const asset = props.item.primary_image;

  if (asset?.desktop || asset?.tablet || asset?.mobile) {
    return asset;
  }

  return cardPlaceholderImage;
});

const categoryLabel = computed(
  () => sanitizeText(props.item.category?.name) || "კატეგორია",
);
const productTitle = computed(
  () => sanitizeText(props.item.name) || "პროდუქტი",
);
const stockLabel = computed(() => {
  if (props.item.availability_issue === "unavailable") {
    return "ხელმისაწვდომი არ არის";
  }

  return props.item.in_stock ? "მარაგშია" : "მარაგში არ არის";
});
const stockBadgeTone = computed(() =>
  props.item.availability_issue === "available" && props.item.in_stock
    ? "success"
    : "warning",
);
const priceChangeLabel = computed(() => {
  if (props.item.price_change_direction === "increase") {
    return "ფასი გაიზარდა";
  }

  if (props.item.price_change_direction === "decrease") {
    return "ფასი შემცირდა";
  }

  return "ფასი შეიცვალა";
});
const hasBlockingAvailabilityIssue = computed(
  () => props.item.availability_issue !== "available",
);
const attentionIssueType = computed(
  () => props.attention?.issue_type || null,
);
const availabilityNoticeTone = computed(() => {
  if (
    attentionIssueType.value === "out_of_stock" ||
    attentionIssueType.value === "unavailable" ||
    hasBlockingAvailabilityIssue.value
  ) {
    return "error";
  }

  if (attentionIssueType.value === "quantity_adjusted") {
    return "warning";
  }

  return null;
});
const availabilityNoticeTitle = computed(() => {
  if (attentionIssueType.value === "quantity_adjusted") {
    return "\u10e0\u10d0\u10dd\u10d3\u10d4\u10dc\u10dd\u10d1\u10d0 \u10d2\u10d0\u10dc\u10d0\u10ee\u10da\u10d3\u10d0";
  }

  if (
    attentionIssueType.value === "out_of_stock" ||
    props.item.availability_issue === "out_of_stock"
  ) {
    return "\u10db\u10d0\u10e0\u10d0\u10d2\u10d8 \u10d0\u10db\u10dd\u10d8\u10ec\u10e3\u10e0\u10d0";
  }

  if (
    attentionIssueType.value === "unavailable" ||
    props.item.availability_issue === "unavailable"
  ) {
    return "\u10de\u10e0\u10dd\u10d3\u10e3\u10e5\u10e2\u10d8 \u10db\u10d8\u10e3\u10ec\u10d5\u10d3\u10dd\u10db\u10d4\u10da\u10d8\u10d0";
  }

  return null;
});
const availabilityNoticeMessage = computed(() => {
  if (attentionIssueType.value === "quantity_adjusted" && props.attention) {
    return `\u10ee\u10d4\u10da\u10db\u10d8\u10e1\u10d0\u10ec\u10d5\u10d3\u10dd\u10db\u10d8\u10d0 \u10db\u10ee\u10dd\u10da\u10dd\u10d3 ${props.attention.available_quantity} \u10ea\u10d0\u10da\u10d8.`;
  }

  if (
    attentionIssueType.value === "out_of_stock" ||
    props.item.availability_issue === "out_of_stock"
  ) {
    return "\u10d4\u10e1 \u10de\u10e0\u10dd\u10d3\u10e3\u10e5\u10e2\u10d8 \u10d0\u10db\u10df\u10d0\u10db\u10d0\u10d3 \u10db\u10d0\u10e0\u10d0\u10d2\u10e8\u10d8 \u10d0\u10e6\u10d0\u10e0 \u10d0\u10e0\u10d8\u10e1. \u10e8\u10d4\u10d9\u10d5\u10d4\u10d7\u10d8\u10e1 \u10d2\u10d0\u10e1\u10d0\u10d2\u10e0\u10eb\u10d4\u10da\u10d4\u10d1\u10da\u10d0\u10d3 \u10ec\u10d0\u10e8\u10d0\u10da\u10d4 \u10d9\u10d0\u10da\u10d0\u10d7\u10d8\u10d3\u10d0\u10dc.";
  }

  if (
    attentionIssueType.value === "unavailable" ||
    props.item.availability_issue === "unavailable"
  ) {
    return "\u10d4\u10e1 \u10de\u10e0\u10dd\u10d3\u10e3\u10e5\u10e2\u10d8 \u10d0\u10e6\u10d0\u10e0 \u10d0\u10e0\u10d8\u10e1 \u10ee\u10d4\u10da\u10db\u10d8\u10e1\u10d0\u10ec\u10d5\u10d3\u10dd\u10db\u10d8. \u10e8\u10d4\u10d9\u10d5\u10d4\u10d7\u10d8\u10e1 \u10d2\u10d0\u10e1\u10d0\u10d2\u10e0\u10eb\u10d4\u10da\u10d4\u10d1\u10da\u10d0\u10d3 \u10ec\u10d0\u10e8\u10d0\u10da\u10d4 \u10d9\u10d0\u10da\u10d0\u10d7\u10d8\u10d3\u10d0\u10dc.";
  }

  return null;
});
const itemStateClass = computed(() => {
  if (availabilityNoticeTone.value === "error") {
    return "border-error/40 shadow-[0_24px_60px_-40px_rgba(255,95,95,0.28)]";
  }

  if (availabilityNoticeTone.value === "warning") {
    return "border-warning/40 shadow-[0_24px_60px_-40px_rgba(255,181,71,0.28)]";
  }

  return "";
});
const canIncrement = computed(
  () =>
    !props.disabled &&
    !hasBlockingAvailabilityIssue.value &&
    props.item.in_stock &&
    props.item.quantity < props.item.stock_qty,
);
const canDecrement = computed(
  () =>
    !props.disabled &&
    !hasBlockingAvailabilityIssue.value &&
    props.item.quantity > 1,
);
</script>

<template>
  <article
    :data-cart-item-id="item.id"
    class="overflow-hidden rounded-[24px] border border-border-default bg-surface shadow-[0_24px_60px_-38px_var(--shadow-color)] transition-colors duration-200"
    :class="itemStateClass"
  >
    <div
      class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-4 p-4 md:p-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start"
    >
      <NuxtLink
        :to="`/catalog/${item.slug}`"
        class="group relative w-[112px] self-start overflow-hidden rounded-[20px] border border-border-default bg-surface-2 transition-colors duration-200 hover:border-accent-primary md:w-[132px]"
      >
        <div class="absolute left-3 top-3 z-[2] flex flex-wrap gap-2">
          <span
            v-if="item.on_sale"
            class="inline-flex rounded-full bg-error px-2.5 py-1 text-[11px] font-bold text-text-invert"
          >
            Sale
          </span>
        </div>

        <div class="bg-[linear-gradient(135deg,#ff7b2c_0%,#ff9f4b_52%,#ffc968_100%)]">
          <BasePicture
            :data="imageData"
            :alt="productTitle"
            preset="thumb"
            class="relative z-[1] h-full w-full"
            fit="cover"
            lazy
          />
        </div>
      </NuxtLink>

      <div class="min-w-0 self-start">
        <p
          class="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-primary"
        >
          {{ categoryLabel }}
        </p>

        <NuxtLink
          :to="`/catalog/${item.slug}`"
          class="mt-2 block text-[20px] font-extrabold leading-tight text-text-primary transition-colors duration-200 hover:text-accent-primary md:text-[22px]"
        >
          {{ productTitle }}
        </NuxtLink>

        <p class="mt-2 text-sm text-text-secondary">
          SKU: {{ item.sku || "N/A" }}
        </p>

        <div class="mt-3 flex flex-wrap items-center gap-2.5">
          <span
            class="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold"
            :class="
              stockBadgeTone === 'success'
                ? 'border-success/25 bg-success/10 text-success'
                : 'border-warning/30 bg-warning/10 text-warning'
            "
          >
            {{ stockLabel }}
          </span>

          <span
            class="inline-flex rounded-full border border-border-default bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-secondary"
          >
            {{ item.quantity }} ცალი კალათაში
          </span>
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-3">
          <div
            class="inline-flex items-center self-start rounded-full border border-border-default bg-surface p-1"
          >
            <button
              type="button"
              :disabled="!canDecrement"
              class="inline-flex h-10 w-10 items-center justify-center rounded-full text-text-primary transition-colors duration-200 hover:bg-surface-2 hover:text-accent-primary disabled:cursor-not-allowed disabled:opacity-40"
              @click="$emit('decrement')"
            >
              <MinusIcon class="h-5 w-5" aria-hidden="true" />
            </button>

            <span
              class="inline-flex min-w-[44px] items-center justify-center px-3 text-base font-bold text-text-primary"
            >
              {{ item.quantity }}
            </span>

            <button
              type="button"
              :disabled="!canIncrement"
              class="inline-flex h-10 w-10 items-center justify-center rounded-full text-text-primary transition-colors duration-200 hover:bg-surface-2 hover:text-accent-primary disabled:cursor-not-allowed disabled:opacity-40"
              @click="$emit('increment')"
            >
              <PlusIcon class="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            :disabled="disabled"
            class="inline-flex items-center gap-2 rounded-full px-1 py-1 text-sm font-medium text-text-secondary transition-colors duration-200 hover:text-error disabled:cursor-not-allowed disabled:opacity-60"
            @click="$emit('remove')"
          >
            <TrashIcon class="h-4 w-4" aria-hidden="true" />
            წაშლა
          </button>
        </div>
        <div
          v-if="availabilityNoticeMessage && availabilityNoticeTitle"
          class="mt-4 rounded-[18px] px-4 py-3"
          :class="
            availabilityNoticeTone === 'error'
              ? 'border border-error/30 bg-error/10 text-error'
              : 'border border-warning/30 bg-warning/10 text-text-secondary'
          "
        >
          <p class="text-xs font-semibold uppercase tracking-[0.08em]">
            {{ availabilityNoticeTitle }}
          </p>
          <p class="mt-1 text-sm leading-6">
            {{ availabilityNoticeMessage }}
          </p>
        </div>
        <div
          v-if="item.price_changed"
          class="mt-4 rounded-[18px] border border-warning/30 bg-warning/10 px-4 py-3"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.08em] text-warning">
            {{ priceChangeLabel }}
          </p>
          <p class="mt-1 text-sm text-text-secondary">
            იყო {{ formatMoney(item.price_snapshot) }}, ახლა {{ formatMoney(item.price) }}
          </p>
        </div>
      </div>

      <div
        class="col-span-2 flex items-end justify-between gap-4 border-t border-border-default pt-4 sm:col-span-1 sm:min-w-[138px] sm:flex-col sm:items-end sm:justify-start sm:gap-1 sm:self-start sm:border-t-0 sm:pt-0"
      >
        <div class="flex flex-col gap-1 sm:items-end sm:text-right">
          <span
            v-if="item.old_price"
            class="text-sm text-text-muted line-through"
          >
            {{ formatMoney(item.old_price) }}
          </span>

          <span class="text-sm text-text-secondary">
            {{ formatMoney(item.price) }} / ც.
          </span>
        </div>

        <p class="text-[24px] font-extrabold leading-none text-accent-primary md:text-[26px]">
          {{ formatMoney(item.line_total) }}
        </p>
      </div>
    </div>
  </article>
</template>
