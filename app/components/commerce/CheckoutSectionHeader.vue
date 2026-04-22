<script setup lang="ts">
defineProps<{
  step: number | string;
  title: string;
}>();
</script>

<template>
  <div class="-mx-6 -mt-6 border-b border-border-default px-6 py-5 md:-mx-7 md:-mt-7 md:px-7">
    <div class="flex items-center gap-3">
      <span
        class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-primary text-sm font-extrabold leading-none text-text-invert"
      >
        {{ step }}
      </span>

      <h2 class="title-under-xs text-[22px] font-extrabold leading-tight text-text-primary md:text-[24px]">
        {{ title }}
      </h2>
    </div>
  </div>
</template>
