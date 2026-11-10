<script setup lang="ts">
import { BoltIcon, TruckIcon } from "@heroicons/vue/24/outline";
import BaseChoiceCard from "~/components/common/BaseChoiceCard.vue";
import type { CommerceDeliveryOption, DeliveryServiceSlug } from "~/types/commerce";
const props = defineProps<{
  modelValue: DeliveryServiceSlug;
  options: CommerceDeliveryOption[];
  disabled?: boolean;
  pending?: boolean;
}>();
const emit = defineEmits<{ "update:modelValue": [value: DeliveryServiceSlug] }>();
const hasFast = computed(() => props.options.some((option) => option.service_slug === "fast"));
const cutoffLabel = (option: CommerceDeliveryOption) => option.checkout_deadline_at
  ? new Intl.DateTimeFormat("ka-GE", { timeZone: "Asia/Tbilisi", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(option.checkout_deadline_at)) : "";
const serviceDescription = (option: CommerceDeliveryOption) => {
  if (!option.available) return option.unavailable_reason;
  if (!hasFast.value) return option.estimate_label;
  const cutoff = cutoffLabel(option) || "12:30";
  return option.service_slug === "fast"
    ? `${cutoff}-მდე გაფორმებულ შეკვეთას იმავე დღეს მოგაწვდით, ხოლო ${cutoff}-დან — მომდევნო სამუშაო დღეს.`
    : `${cutoff}-მდე გაფორმებულ შეკვეთას მომდევნო სამუშაო დღეს მიიღებთ, ხოლო ${cutoff}-დან — ორ სამუშაო დღეში.`;
};
</script>

<template>
  <fieldset
v-if="options.length" class="mt-5 min-w-0 border-t border-border-default pt-5 sm:mt-6 sm:pt-6"
    :disabled="disabled" :aria-busy="pending" aria-describedby="delivery-service-note" data-checkout-field="delivery_service_slug">
    <legend class="float-left mb-3 w-full text-base font-bold text-text-primary">მიწოდების ტიპი</legend>
    <div class="clear-both grid min-w-0 gap-3 lg:grid-cols-2">
      <BaseChoiceCard
v-for="option in options" :key="option.service_slug" name="delivery_service_slug"
        :model-value="modelValue" :value="option.service_slug" :title="option.label"
        :disabled="disabled || !option.available"
        :price="pending ? 'ითვლება…' : option.price ? `${Number(option.price).toFixed(2)} ₾` : '—'"
        :description="serviceDescription(option)"
        @update:model-value="emit('update:modelValue', option.service_slug)">
        <template #icon><component :is="option.service_slug === 'fast' ? BoltIcon : TruckIcon" class="h-5 w-5" aria-hidden="true" /></template>
      </BaseChoiceCard>
    </div>
    <p id="delivery-service-note" class="mt-3 text-xs leading-5 text-text-muted">
      ვადები ითვლება სამუშაო დღეებით. შაბათსა და კვირას მიწოდება არ ხორციელდება.
    </p>
  </fieldset>
</template>
