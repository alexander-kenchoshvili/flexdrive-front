<script setup lang="ts">
import BaseButton from "~/components/common/BaseButton.vue";
import BasePicture from "~/components/common/BasePicture.vue";
import { useCatalogPlaceholderMedia } from "~/composables/catalog/useCatalogPlaceholderMedia";
import type { CommerceCheckoutSummaryItem } from "~/types/commerce";

type SummaryActionAs = "button" | "nuxt-link";

const props = withDefaults(
  defineProps<{
    items: CommerceCheckoutSummaryItem[];
    itemCount: number;
    total: string;
    errorMessage?: string | null;
    priceChangeMessage?: string | null;
    confirmationLabel?: string;
    submitLabel?: string;
    submitting?: boolean;
    confirming?: boolean;
    requiresConfirmation?: boolean;
    disabled?: boolean;
    secondaryActionLabel?: string;
    secondaryActionTo?: string;
    secondaryActionAs?: SummaryActionAs;
    secondaryActionDisabled?: boolean;
    allowSubmit?: boolean;
    sourceMode?: "cart" | "buy_now";
  }>(),
  {
    errorMessage: null,
    priceChangeMessage: null,
    confirmationLabel: "განახლებული მონაცემების დადასტურება",
    submitLabel: "შეკვეთის დადასტურება",
    submitting: false,
    confirming: false,
    requiresConfirmation: false,
    disabled: false,
    secondaryActionLabel: "კალათაში დაბრუნება",
    secondaryActionTo: "/cart",
    secondaryActionAs: "nuxt-link",
    secondaryActionDisabled: false,
    allowSubmit: true,
    sourceMode: "cart",
  },
);

defineEmits<{
  confirm: [];
  secondaryAction: [];
}>();

const { cardPlaceholderImage } = useCatalogPlaceholderMedia();

const formatMoney = (value: string | number | null | undefined) =>
  `${Number(value || 0).toFixed(2)} GEL`;

const resolveThumbnail = (item: CommerceCheckoutSummaryItem) => {
  const asset = item.primary_image;
  if (asset?.desktop || asset?.tablet || asset?.mobile) {
    return asset;
  }
  return cardPlaceholderImage;
};

const priceChangeLabel = (item: CommerceCheckoutSummaryItem) => {
  if (item.price_change_direction === "increase") {
    return "ფასი გაიზარდა";
  }

  if (item.price_change_direction === "decrease") {
    return "ფასი შემცირდა";
  }

  return "ფასი შეიცვალა";
};
</script>

<template>
  <aside
    class="rounded-[24px] border border-border-default bg-surface p-6 shadow-[0_24px_60px_-38px_var(--shadow-color)] md:p-7"
  >
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.12em] text-accent-primary">
          შეკვეთა
        </p>
        <h2 class="mt-2 text-[28px] font-extrabold leading-tight text-text-primary">
          შეკვეთის დეტალები
        </h2>
      </div>

      <span
        class="inline-flex shrink-0 whitespace-nowrap rounded-full border border-border-default bg-surface-2 px-3 py-1 text-xs font-semibold text-text-secondary"
      >
        {{ itemCount }} ც.
      </span>
    </div>

    <div class="mt-6 space-y-3">
      <article
        v-for="item in items"
        :key="item.id"
        class="flex items-center gap-3 rounded-[18px] border border-border-default bg-surface-2 p-3"
      >
        <div class="h-16 w-16 shrink-0 overflow-hidden rounded-[14px] bg-white/95">
          <BasePicture
            :data="resolveThumbnail(item)"
            :alt="item.name"
            preset="thumb"
            class="h-full w-full"
            fit="contain"
            lazy
          />
        </div>

        <div class="min-w-0 flex-1">
          <p class="truncate text-[13px] font-bold text-text-primary">
            {{ item.name }}
          </p>
          <p class="mt-1 text-xs text-text-muted">
            {{ item.quantity }} ცალი
          </p>

          <div
            v-if="item.price_changed"
            class="mt-2 rounded-[14px] border border-warning/30 bg-warning/10 px-3 py-2"
          >
            <p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-warning">
              {{ priceChangeLabel(item) }}
            </p>
            <p class="mt-1 text-[11px] leading-5 text-text-secondary">
              იყო {{ formatMoney(item.price_snapshot) }}, ახლა
              {{ formatMoney(item.price) }}
            </p>
          </div>
        </div>

        <div class="shrink-0 text-right">
          <p class="text-sm font-semibold text-text-primary">
            {{ formatMoney(item.line_total) }}
          </p>
        </div>
      </article>
    </div>

    <div class="mt-6 space-y-3 rounded-[20px] border border-border-default bg-surface-2 p-4">
      <div class="flex items-center justify-between gap-3 text-sm text-text-secondary">
        <span>პროდუქტები</span>
        <span>{{ itemCount }} ცალი</span>
      </div>

      <div class="flex items-center justify-between gap-3 text-sm text-text-secondary">
        <span>მიწოდება</span>
        <span class="font-semibold text-success">უფასო</span>
      </div>

      <div class="flex items-center justify-between gap-3 border-t border-border-default pt-3">
        <span class="text-base font-semibold text-text-primary">სულ</span>
        <span class="text-[28px] font-extrabold leading-none text-accent-primary">
          {{ formatMoney(total) }}
        </span>
      </div>
    </div>

    <div class="mt-6 space-y-3">
      <div
        v-if="priceChangeMessage || errorMessage"
        data-checkout-submit-feedback="desktop"
        class="hidden rounded-[20px] px-4 py-3 text-sm lg:block"
        :class="
          priceChangeMessage
            ? 'border border-warning/30 bg-warning/10 text-text-secondary'
            : 'border border-error/30 bg-error/10 text-error'
        "
      >
        {{ priceChangeMessage || errorMessage }}
      </div>

      <BaseButton
        v-if="requiresConfirmation"
        type="button"
        variant="primary"
        :loading="confirming"
        :disabled="disabled"
        class="px-6 py-3.5 text-sm upper"
        full-width
        @click="$emit('confirm')"
      >
        {{ confirmationLabel }}
      </BaseButton>

      <BaseButton
        v-else-if="allowSubmit"
        type="submit"
        variant="primary"
        :loading="submitting"
        :disabled="disabled"
        class="px-6 py-3.5 text-sm upper"
        full-width
      >
        {{ submitLabel }}
      </BaseButton>

      <BaseButton
        :as="secondaryActionAs"
        :to="secondaryActionAs === 'nuxt-link' ? secondaryActionTo : undefined"
        :type="secondaryActionAs === 'button' ? 'button' : undefined"
        variant="secondary"
        :disabled="secondaryActionDisabled"
        class="px-6 py-3.5 text-sm upper"
        full-width
        @click="$emit('secondaryAction')"
      >
        {{ secondaryActionLabel }}
      </BaseButton>

      <BaseButton
        v-if="sourceMode === 'buy_now' && !allowSubmit"
        as="nuxt-link"
        to="/catalog"
        variant="secondary"
        class="px-6 py-3.5 text-sm upper"
        full-width
      >
        კატალოგში დაბრუნება
      </BaseButton>
    </div>
  </aside>
</template>
