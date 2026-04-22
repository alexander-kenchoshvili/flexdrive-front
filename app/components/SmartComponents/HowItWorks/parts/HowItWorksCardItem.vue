<script setup lang="ts">
import { MagnifyingGlassIcon } from "@heroicons/vue/24/outline";
import { sanitizeText, splitBracketAccentSegments } from "~/composables/helpers";

type HowItWorksItem = {
  id: number;
  title: string;
  description: string;
  iconSvg: string;
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

const title = computed(() => sanitizeText(props.item.title));
const descriptionSegments = computed(() =>
  splitBracketAccentSegments(props.item.description),
);
const usesHeroSearchIcon = computed(() => {
  const svg = props.item.iconSvg;
  return (
    svg.includes('circle cx="20" cy="20" r="11"') &&
    svg.includes('line x1="28.5" y1="28.5" x2="38" y2="38"')
  );
});
</script>

<template>
  <article
    class="flex items-start gap-3 rounded-xl border border-border-default bg-surface p-4"
  >
    <span
      class="flex h-12 w-12 shrink-0 items-center justify-center text-accent-primary"
    >
      <MagnifyingGlassIcon
        v-if="usesHeroSearchIcon"
        class="block h-12 w-12 stroke-[1.9]"
      />
      <span
        v-else-if="item.iconSvg"
        class="how-it-works-icon-svg block h-12 w-12"
        v-html="item.iconSvg"
      />
    </span>

    <div class="min-w-0">
      <h4 class="text-base font-bold leading-6 text-text-primary">
        {{ title }}
      </h4>
      <p
        v-if="descriptionSegments.length"
        class="mt-1 text-sm leading-6 text-text-secondary"
      >
        <template
          v-for="(segment, segmentIndex) in descriptionSegments"
          :key="`${item.id}-card-segment-${segmentIndex}`"
        >
          <NuxtLink
            v-if="isRegisterSegment(segment)"
            to="/register"
            class="font-semibold text-accent-primary"
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

<style scoped>
.how-it-works-icon-svg :deep(svg) {
  width: 48px !important;
  height: 48px !important;
  display: block;
}
</style>
