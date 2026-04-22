<script setup lang="ts">
import { sanitizeText } from "~/composables/helpers";

type OrderConfidenceCardData = {
  id: number;
  title: string;
  description: string;
  iconSvg: string;
  position: number;
};

const props = defineProps<{
  item: OrderConfidenceCardData;
}>();

const title = computed(() => sanitizeText(props.item.title));
const description = computed(() => sanitizeText(props.item.description));
</script>

<template>
  <article
    class="group relative flex items-start gap-4 bg-surface px-5 py-[22px] text-left transition-colors duration-200 hover:bg-[#fff9f7] dark:hover:bg-surface-2 hover:after:scale-100 hover:after:opacity-100 md:flex-col md:gap-5 md:px-8 md:py-9 after:absolute after:right-5 after:top-5 after:h-1.5 after:w-1.5 after:scale-0 after:rounded-full after:bg-accent-primary after:opacity-0 after:transition-all after:duration-200 after:content-['']"
  >
    <span
      class="flex shrink-0 items-center justify-center rounded-2xl bg-surface-2 p-3 text-accent-primary transition-colors duration-200 group-hover:bg-[#ffe8df] dark:group-hover:bg-surface-3 sm:p-4"
    >
      <span
        v-if="item.iconSvg"
        class="block text-accent-primary [&>svg]:block [&>svg]:transition-transform [&>svg]:duration-200 group-hover:[&>svg]:scale-110"
        v-html="item.iconSvg"
      />
    </span>

    <div class="min-w-0 flex-1 xl:max-w-[240px]">
      <h3 class="text-base font-bold leading-6 text-text-primary">
        {{ title }}
      </h3>

      <p
        v-if="description"
        class="mt-1.5 text-[14px] leading-6 text-text-secondary sm:text-[15px] sm:leading-7"
      >
        {{ description }}
      </p>
    </div>
  </article>
</template>
