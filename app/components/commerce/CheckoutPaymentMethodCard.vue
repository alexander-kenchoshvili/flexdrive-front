<script setup lang="ts">
import { BanknotesIcon, CreditCardIcon } from "@heroicons/vue/24/outline";
import type { CheckoutPaymentMethod } from "~/types/commerce";

const props = withDefaults(
  defineProps<{
    method: CheckoutPaymentMethod;
    title: string;
    description: string;
    selected?: boolean;
    disabled?: boolean;
    badge?: string;
  }>(),
  {
    selected: false,
    disabled: false,
    badge: "",
  },
);

const emit = defineEmits<{
  (e: "select", method: CheckoutPaymentMethod): void;
}>();

const iconComponent = computed(() =>
  props.method === "cash_on_delivery" ? BanknotesIcon : CreditCardIcon,
);

const rootClasses = computed(() => {
  const base =
    "flex w-full items-start gap-4 rounded-[20px] border p-5 text-left transition-colors duration-200";

  if (props.disabled) {
    return `${base} border-border-default bg-surface-2 opacity-70`;
  }

  if (props.selected) {
    return `${base} border-accent-primary bg-accent-primary/8 shadow-[0_18px_44px_-34px_rgba(255,107,53,0.4)]`;
  }

  return `${base} border-border-default bg-surface-2 hover:border-accent-primary/60 hover:bg-surface`;
});

const indicatorClasses = computed(() => {
  const base =
    "mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-200";

  if (props.selected) {
    return `${base} border-accent-primary bg-accent-primary`;
  }

  return `${base} border-border-default bg-transparent`;
});

const handleSelect = () => {
  if (props.disabled) return;
  emit("select", props.method);
};
</script>

<template>
  <button
    type="button"
    :class="rootClasses"
    :disabled="disabled"
    @click="handleSelect"
  >
    <span
      class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-border-default bg-surface text-text-primary"
    >
      <component :is="iconComponent" class="h-6 w-6" aria-hidden="true" />
    </span>

    <span class="min-w-0 flex-1">
      <span class="flex flex-wrap items-center gap-2">
        <span class="text-base font-bold text-text-primary">
          {{ title }}
        </span>
        <span
          v-if="badge"
          class="inline-flex rounded-full border border-border-default bg-surface px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary"
        >
          {{ badge }}
        </span>
      </span>

      <span class="mt-2 block text-sm leading-6 text-text-secondary">
        {{ description }}
      </span>
    </span>

    <span :class="indicatorClasses">
      <span
        v-if="selected"
        class="h-2 w-2 rounded-full bg-text-invert"
      />
    </span>
  </button>
</template>
