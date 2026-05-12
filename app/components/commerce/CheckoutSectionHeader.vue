<script setup lang="ts">
defineProps<{
  step: number | string;
  title: string;
}>();
</script>

<template>
  <div
    class="-mx-4 -mt-4 border-b border-border-default px-4 py-4 sm:-mx-6 sm:-mt-6 sm:px-6 sm:py-5 md:-mx-7 md:-mt-7 md:px-7"
  >
    <div class="flex items-center gap-2.5 sm:gap-3">
      <span
        class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-primary text-xs font-extrabold leading-none text-text-invert sm:h-7 sm:w-7 sm:text-sm"
      >
        {{ step }}
      </span>

      <h2
        class="text-[20px] font-extrabold leading-tight text-text-primary sm:text-[22px] md:text-[24px]"
      >
        {{ title }}
      </h2>
    </div>
  </div>
</template>
