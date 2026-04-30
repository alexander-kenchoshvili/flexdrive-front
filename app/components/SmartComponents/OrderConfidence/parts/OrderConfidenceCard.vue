<script setup lang="ts">
import {
  ClipboardDocumentCheckIcon,
  CreditCardIcon,
  TruckIcon,
  UserCircleIcon,
} from "@heroicons/vue/24/outline";
import type { Component } from "vue";
import { sanitizeText } from "~/composables/helpers";

export type OrderConfidenceIcon = "order" | "account" | "payment" | "delivery";

type OrderConfidenceCardData = {
  id: number;
  title: string;
  description: string;
  position: number;
  step: string;
  icon: OrderConfidenceIcon;
};

const props = defineProps<{
  item: OrderConfidenceCardData;
}>();

const iconMap: Record<OrderConfidenceIcon, Component> = {
  order: ClipboardDocumentCheckIcon,
  account: UserCircleIcon,
  payment: CreditCardIcon,
  delivery: TruckIcon,
};

const title = computed(() => sanitizeText(props.item.title));
const description = computed(() => sanitizeText(props.item.description));
const iconComponent = computed(() => iconMap[props.item.icon]);
</script>

<template>
  <article
    class="group relative flex h-full min-h-[190px] flex-col rounded-md bg-surface px-5 py-5 text-left transition-colors duration-200 hover:bg-surface-2 sm:px-6 sm:py-6 xl:min-h-[270px]"
  >
    <div class="flex items-center justify-between gap-4">
      <span
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-accent-primary/20 bg-accent-primary/10 text-accent-primary transition-colors duration-200 group-hover:border-accent-primary/45 group-hover:bg-accent-primary/15"
      >
        <component :is="iconComponent" class="h-5 w-5" aria-hidden="true" />
      </span>

      <span class="text-[12px] font-extrabold leading-5 text-accent-primary/70">
        {{ item.step }}
      </span>
    </div>

    <div class="mt-4 min-w-0 flex-1">
      <h3 class="text-[16px] font-extrabold leading-[24px] text-text-primary">
        {{ title }}
      </h3>

      <p
        v-if="description"
        class="mt-3 text-[14px] font-medium leading-[23px] text-text-secondary"
      >
        {{ description }}
      </p>
    </div>

    <span
      class="mt-6 block h-1 w-9 rounded-full bg-accent-primary/80 transition-[width,background-color] duration-200 group-hover:w-12 group-hover:bg-accent-primary"
    />
  </article>
</template>
