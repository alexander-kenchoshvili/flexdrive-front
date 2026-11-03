<script setup lang="ts">
import type { CommerceRefundSummary } from "~/types/commerce";
defineProps<{ refund?: CommerceRefundSummary | null }>();
const money = (value: string) => `${Number(value).toFixed(2)} ₾`;
</script>

<template>
  <div v-if="refund" class="mt-3 w-full rounded-lg border border-border-default bg-surface-2 p-3 text-sm text-text-secondary">
    <template v-if="refund.status === 'refunded'">
      <p class="font-semibold text-text-primary">დაბრუნებული თანხა: {{ money(refund.amount) }}</p>
      <p v-if="Number(refund.retained_return_fee) > 0" class="mt-1">უკუმიტანის შეთანხმებული საფასური: {{ money(refund.retained_return_fee!) }}</p>
    </template>
    <p v-else-if="refund.status === 'refund_pending'">დაბრუნება მოწმდება: {{ money(refund.amount) }}. ველოდებით ბანკის საბოლოო დადასტურებას.</p>
    <p v-else>ბანკმა დაბრუნების მოთხოვნა უარყო. გთხოვთ, დაგვიკავშირდეთ.</p>
  </div>
</template>
