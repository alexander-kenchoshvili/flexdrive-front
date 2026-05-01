<script setup lang="ts">
import {
  ClockIcon,
  HeartIcon,
  MapPinIcon,
  UserPlusIcon,
} from "@heroicons/vue/24/outline";
import type { Component } from "vue";
import { sanitizeText, splitBracketAccentSegments } from "~/composables/helpers";

type HowItWorksCardIcon = "guest" | "wishlist" | "address" | "history";

type HowItWorksItem = {
  id: number;
  title: string;
  description: string;
  icon: HowItWorksCardIcon;
};

type AccentSegment = {
  text: string;
  accent: boolean;
};

const props = defineProps<{
  item: HowItWorksItem;
}>();

const REGISTER_CTA_TEXT = "დარეგისტრირდი";
const normalizeText = (value: string) => sanitizeText(value).toLowerCase();

const isRegisterSegment = (segment: AccentSegment) =>
  segment.accent &&
  normalizeText(segment.text) === normalizeText(REGISTER_CTA_TEXT);

const iconMap: Record<HowItWorksCardIcon, Component> = {
  guest: UserPlusIcon,
  wishlist: HeartIcon,
  address: MapPinIcon,
  history: ClockIcon,
};

const title = computed(() => sanitizeText(props.item.title));
const descriptionSegments = computed(() =>
  splitBracketAccentSegments(props.item.description),
);
const iconComponent = computed(() => iconMap[props.item.icon] || UserPlusIcon);
</script>

<template>
  <article
    class="group flex h-full min-h-[130px] items-start gap-3 rounded-md border border-border-default bg-surface p-4 shadow-[0_18px_48px_-42px_var(--shadow-color)] transition-colors duration-200 hover:border-accent-primary/45 hover:bg-surface-2"
  >
    <span
      class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-accent-primary/20 bg-accent-primary/10 text-accent-primary transition-colors duration-200 group-hover:border-accent-primary/45 group-hover:bg-accent-primary/15"
    >
      <component :is="iconComponent" class="h-5 w-5" aria-hidden="true" />
    </span>

    <div class="min-w-0">
      <h4 class="break-words text-[15px] font-extrabold leading-6 text-text-primary">
        {{ title }}
      </h4>
      <p
        v-if="descriptionSegments.length"
        class="mt-2 break-words text-[14px] font-medium leading-[23px] text-text-secondary"
      >
        <template
          v-for="(segment, segmentIndex) in descriptionSegments"
          :key="`${item.id}-card-segment-${segmentIndex}`"
        >
          <NuxtLink
            v-if="isRegisterSegment(segment)"
            to="/register"
            class="font-bold text-accent-primary transition-colors duration-200 hover:text-accent-hover"
          >
            {{ segment.text }}
          </NuxtLink>
          <span
            v-else
            :class="segment.accent ? 'font-semibold text-accent-primary' : ''"
          >
            {{ segment.text }}
          </span>
        </template>
      </p>
    </div>
  </article>
</template>
