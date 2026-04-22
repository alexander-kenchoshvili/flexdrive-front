<script setup lang="ts">
import { useCommercePresentation } from "~/composables/commerce/useCommercePresentation";
import type { CommerceOrderStatus } from "~/types/commerce";

const props = defineProps<{
  status: CommerceOrderStatus;
}>();

const { getOrderStatusBadgeClasses, getOrderStatusLabel } =
  useCommercePresentation();
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold',
      getOrderStatusBadgeClasses(props.status),
    ]"
  >
    <span class="h-2 w-2 rounded-full bg-current" />
    {{ getOrderStatusLabel(props.status) }}
  </span>
</template>
