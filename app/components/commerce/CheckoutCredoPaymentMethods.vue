<script setup lang="ts">
import BaseChoiceCard from "~/components/common/BaseChoiceCard.vue";
import type { CheckoutPaymentMethod } from "~/types/commerce";
defineProps<{ enabled?: boolean; loading?: boolean; disabled?: boolean; modelValue?: CheckoutPaymentMethod }>();
const emit = defineEmits<{ select: [method: CheckoutPaymentMethod] }>();

// The server controls availability; unavailable choices remain native disabled radios.
const options: Array<{ value: CheckoutPaymentMethod; title: string; logo: string; logoAlt: string; logoWidth: number; logoHeight: number }> = [
  {
    value: "credo_installment",
    title: "კრედოს განვადება",
    logo: "/payments/credo-ge.svg",
    logoAlt: "კრედო ბანკი",
    logoWidth: 200,
    logoHeight: 32,
  },
  {
    value: "credo_dayavi",
    title: "დაყავი",
    logo: "/payments/dayavi.svg",
    logoAlt: "დაყავი",
    logoWidth: 100,
    logoHeight: 40,
  },
];
</script>

<template>
  <BaseChoiceCard
    v-for="option in options"
    :key="option.value"
    class="checkout-payment-option checkout-payment-option--credo"
    :class="{ 'checkout-payment-option--credo-enabled': enabled && !loading }"
    name="payment_method"
    :value="option.value"
    :model-value="modelValue || ''"
    :title="option.title"
    :description="loading ? 'ხელმისაწვდომობა მოწმდება.' : enabled ? 'საბოლოო პირობებს ირჩევთ კრედოს გვერდზე. დამტკიცებას წყვეტს კრედო.' : 'ამჟამად მიუწვდომელია.'"
    :disabled="disabled || loading || !enabled"
    @update:model-value="emit('select', option.value)"
  >
    <span class="checkout-credo-logo-wrap mt-3 flex min-h-10 min-w-0 items-center">
      <img
        :src="option.logo"
        :alt="option.logoAlt"
        :width="option.logoWidth"
        :height="option.logoHeight"
        class="checkout-credo-logo block max-w-full shrink object-contain object-left"
        decoding="async"
      >
    </span>
  </BaseChoiceCard>
</template>
