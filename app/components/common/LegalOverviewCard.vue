<script setup lang="ts">
import { ArrowDownRightIcon } from "@heroicons/vue/24/outline";

const props = defineProps<{
  href: string;
  index: number;
  title: string;
  summary?: string;
  iconSvg?: string;
}>();

const emit = defineEmits<{
  navigate: [event: MouseEvent];
}>();

const handleClick = (event: MouseEvent) => {
  emit("navigate", event);
};
</script>

<template>
  <a
    :href="href"
    class="group relative flex h-full flex-col rounded-[24px] border border-border-default bg-surface-2 px-5 py-5 transition-colors duration-200 hover:border-accent-primary hover:bg-[#fff8f4] dark:hover:bg-surface-3 md:px-6 md:py-6"
    @click="handleClick"
  >
    <div class="flex items-start justify-between gap-4">
      <span
        class="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-border-default bg-surface text-sm font-bold text-text-primary"
      >
        {{ String(props.index).padStart(2, "0") }}
      </span>

      <span
        v-if="iconSvg"
        class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface text-accent-primary transition-colors duration-200 group-hover:bg-[#ffe8df] dark:group-hover:bg-surface"
      >
        <span
          class="block [&>svg]:block [&>svg]:h-6 [&>svg]:w-6 [&>svg]:transition-transform [&>svg]:duration-200 group-hover:[&>svg]:scale-110"
          v-html="iconSvg"
        />
      </span>
    </div>

    <h2 class="mt-5 text-lg font-bold leading-7 text-text-primary">
      {{ title }}
    </h2>

    <p v-if="summary" class="mt-2 text-sm leading-6 text-text-secondary">
      {{ summary }}
    </p>

    <span class="mt-5 inline-flex items-center justify-end text-accent-primary">
      <ArrowDownRightIcon
        class="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1 group-hover:translate-y-1"
        aria-hidden="true"
      />
    </span>
  </a>
</template>
