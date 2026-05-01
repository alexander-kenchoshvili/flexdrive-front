<script setup lang="ts">
import {
  ArchiveBoxIcon,
  BoltIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  UserCircleIcon,
} from "@heroicons/vue/24/outline";
import type { Component } from "vue";
import { sanitizeText, splitBracketAccentSegments } from "~/composables/helpers";

type HowItWorksStepIcon =
  | "search"
  | "cart"
  | "details"
  | "confirm"
  | "account"
  | "wishlist"
  | "checkout"
  | "tracking";

type HowItWorksItem = {
  id: number;
  title: string;
  description: string;
  icon: HowItWorksStepIcon;
  stepLabel: string;
};

const props = defineProps<{
  item: HowItWorksItem;
  index: number;
}>();

const iconMap: Record<HowItWorksStepIcon, Component> = {
  search: MagnifyingGlassIcon,
  cart: ShoppingCartIcon,
  details: ClipboardDocumentListIcon,
  confirm: CheckCircleIcon,
  account: UserCircleIcon,
  wishlist: HeartIcon,
  checkout: BoltIcon,
  tracking: ArchiveBoxIcon,
};

const title = computed(
  () => sanitizeText(props.item.title) || `ნაბიჯი ${props.index + 1}`,
);
const descriptionSegments = computed(() =>
  splitBracketAccentSegments(props.item.description),
);
const enterDelay = computed(() => `${props.index * 130}ms`);
const iconComponent = computed(() => iconMap[props.item.icon] || CheckCircleIcon);
</script>

<template>
  <li
    class="how-it-works-step-enter group flex h-full min-h-[206px] flex-col rounded-md border border-border-default bg-surface p-4 text-left shadow-[0_18px_48px_-42px_var(--shadow-color)] transition-colors duration-200 hover:border-accent-primary/45 hover:bg-surface-2 md:p-5"
    :style="{ '--how-step-delay': enterDelay }"
  >
    <div class="flex items-center justify-between gap-3">
      <span
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-accent-primary/20 bg-accent-primary/10 text-accent-primary transition-colors duration-200 group-hover:border-accent-primary/45 group-hover:bg-accent-primary/15"
      >
        <component :is="iconComponent" class="h-6 w-6" aria-hidden="true" />
      </span>

      <span
        class="shrink-0 rounded-full border border-border-default bg-surface-2 px-2.5 py-1 text-[11px] font-black leading-none text-accent-primary"
      >
        {{ item.stepLabel }}
      </span>
    </div>

    <h3
      class="mt-4 break-words text-[16px] font-extrabold leading-[24px] text-text-primary"
    >
      {{ title }}
    </h3>

    <p
      v-if="descriptionSegments.length"
      class="mt-3 break-words text-[14px] font-medium leading-[23px] text-text-secondary"
    >
      <template
        v-for="(segment, segmentIndex) in descriptionSegments"
        :key="`${item.id}-step-segment-${segmentIndex}`"
      >
        <span
          :class="segment.accent ? 'font-semibold text-accent-primary' : ''"
        >
          {{ segment.text }}
        </span>
      </template>
    </p>

    <span class="mt-auto block pt-5" aria-hidden="true">
      <span
        class="block h-1 w-10 rounded-full bg-accent-primary/70 transition-[width,background-color] duration-200 group-hover:w-12 group-hover:bg-accent-primary"
      />
    </span>
  </li>
</template>

<style scoped>
.how-it-works-step-enter {
  animation-name: how-step-enter;
  animation-duration: 550ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  animation-delay: var(--how-step-delay, 0ms);
  animation-fill-mode: both;
  will-change: transform, opacity;
}

@keyframes how-step-enter {
  from {
    opacity: 0;
    transform: translateY(14px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .how-it-works-step-enter {
    animation: none;
  }
}
</style>
