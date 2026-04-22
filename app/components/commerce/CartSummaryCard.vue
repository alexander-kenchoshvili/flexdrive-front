<script setup lang="ts">
import BaseButton from "~/components/common/BaseButton.vue";

type PrimaryButtonAs = "button" | "nuxt-link";

const props = withDefaults(
  defineProps<{
    itemCount: number;
    subtotal: string;
    total: string;
    disabled?: boolean;
    primaryLabel?: string;
    primaryAs?: PrimaryButtonAs;
    primaryTo?: string;
    primaryLoading?: boolean;
    priceChangeMessage?: string | null;
  }>(),
  {
    disabled: false,
    primaryLabel: "შეკვეთის გაფორმება",
    primaryAs: "nuxt-link",
    primaryTo: "/checkout",
    primaryLoading: false,
    priceChangeMessage: null,
  },
);

defineEmits<{
  primaryAction: [];
}>();

const formatMoney = (value: string | number | null | undefined) =>
  `${Number(value || 0).toFixed(2)} GEL`;
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
          შეკვეთის შეჯამება
        </h2>
      </div>

      <span
        class="inline-flex shrink-0 whitespace-nowrap rounded-full border border-border-default bg-surface-2 px-3 py-1 text-xs font-semibold text-text-secondary"
      >
        {{ itemCount }} ც.
      </span>
    </div>

    <div class="mt-6 space-y-3 rounded-[20px] border border-border-default bg-surface-2 p-4">
      <div class="flex items-center justify-between gap-3 text-sm text-text-secondary">
        <span>პროდუქტები</span>
        <span>{{ itemCount }} ცალი</span>
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
        v-if="priceChangeMessage"
        data-cart-price-feedback="desktop"
        class="rounded-[20px] border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-text-secondary"
      >
        {{ priceChangeMessage }}
      </div>

      <BaseButton
        :as="primaryAs"
        :to="primaryAs === 'nuxt-link' ? primaryTo : undefined"
        :type="primaryAs === 'button' ? 'button' : undefined"
        variant="primary"
        :loading="primaryLoading"
        :disabled="disabled"
        class="px-6 py-3.5 text-sm upper"
        full-width
        @click="$emit('primaryAction')"
      >
        {{ primaryLabel }}
      </BaseButton>

      <BaseButton
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
