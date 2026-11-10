<script setup lang="ts">
import { BanknotesIcon, CreditCardIcon } from "@heroicons/vue/24/outline";
import BaseChoiceCard from "~/components/common/BaseChoiceCard.vue";
import type { CheckoutPaymentMethod } from "~/types/commerce";

const props = withDefaults(defineProps<{
  method: CheckoutPaymentMethod;
  title: string;
  description?: string;
  selected?: boolean;
  disabled?: boolean;
  badge?: string;
  brands?: string[];
  supportingText?: string;
}>(), { description: "", selected: false, disabled: false, badge: "", brands: () => [], supportingText: "" });
const emit = defineEmits<{ select: [method: CheckoutPaymentMethod] }>();
const iconComponent = computed(() => props.method === "cash_on_delivery" ? BanknotesIcon : CreditCardIcon);
</script>

<template>
  <BaseChoiceCard
name="payment_method" :value="method" :model-value="selected ? method : ''"
    :title="title" :description="description" :badge="badge" :disabled="disabled"
    @update:model-value="emit('select', method)">
    <template #icon><component :is="iconComponent" class="h-5 w-5" aria-hidden="true" /></template>
    <span v-if="brands.length" class="mt-2 flex flex-wrap gap-1.5">
      <span v-for="brand in brands" :key="brand" class="inline-flex rounded-full border border-border-default bg-surface px-2.5 py-1 text-[11px] font-bold leading-none text-text-secondary">{{ brand }}</span>
    </span>
    <span v-if="supportingText" class="mt-3 block border-t border-border-default/80 pt-3 text-xs font-medium leading-5 text-text-muted">{{ supportingText }}</span>
  </BaseChoiceCard>
</template>
