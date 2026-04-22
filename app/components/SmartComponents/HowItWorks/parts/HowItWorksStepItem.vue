<script setup lang="ts">
import { MagnifyingGlassIcon } from "@heroicons/vue/24/outline";
import { sanitizeText, splitBracketAccentSegments } from "~/composables/helpers";

type HowItWorksItem = {
  id: number;
  title: string;
  description: string;
  iconSvg: string;
};

const props = defineProps<{
  item: HowItWorksItem;
  index: number;
}>();

const title = computed(
  () => sanitizeText(props.item.title) || `ნაბიჯი ${props.index + 1}`,
);
const descriptionSegments = computed(() =>
  splitBracketAccentSegments(props.item.description),
);
const enterDelay = computed(() => `${props.index * 130}ms`);
const usesHeroSearchIcon = computed(() => {
  const svg = props.item.iconSvg;
  return (
    svg.includes('circle cx="20" cy="20" r="11"') &&
    svg.includes('line x1="28.5" y1="28.5" x2="38" y2="38"')
  );
});
</script>

<template>
  <li
    class="how-it-works-step-enter rounded-xl border border-border-default bg-surface p-4 flex flex-col items-center text-center xl:border-none xl:bg-transparent xl:p-0"
    :style="{ '--how-step-delay': enterDelay }"
  >
    <div
      class="gap-3 rounded-full border border-border-default bg-bg-secondary p-5 relative hover:border-accent-primary transition-all duration-300 hover:-translate-y-[5px]"
    >
      <span class="h-12 w-12 items-center text-accent-primary">
        <MagnifyingGlassIcon
          v-if="usesHeroSearchIcon"
          class="block h-12 w-12 stroke-[1.9]"
        />
        <span
          v-else-if="item.iconSvg"
          class="how-it-works-icon-svg block h-12 w-12"
          v-html="item.iconSvg"
        />
        <span v-else class="text-xs font-bold">{{ index + 1 }}</span>
      </span>

      <span
        class="inline-flex absolute h-6 min-w-6 items-center justify-center rounded-full bg-accent-primary px-2 text-xs font-bold text-text-invert top-0 right-0"
      >
        {{ index + 1 }}
      </span>
    </div>

    <h3 class="text-lg font-bold leading-6 text-text-primary mt-3">
      {{ title }}
    </h3>

    <p
      v-if="descriptionSegments.length"
      class="mt-3 text-sm leading-6 text-text-secondary"
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

.how-it-works-icon-svg :deep(svg) {
  width: 48px !important;
  height: 48px !important;
  display: block;
}

@media (prefers-reduced-motion: reduce) {
  .how-it-works-step-enter {
    animation: none;
  }
}
</style>
