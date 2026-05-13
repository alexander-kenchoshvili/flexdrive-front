<script setup lang="ts">
import SkeletonBlock from "~/components/common/skeleton/SkeletonBlock.vue";
import SkeletonText from "~/components/common/skeleton/SkeletonText.vue";
</script>

<template>
  <section
    class="rounded-[24px] border border-border-default bg-surface p-4 shadow-[0_24px_60px_-38px_var(--shadow-color)] sm:rounded-[28px] sm:p-6 md:p-7"
  >
    <div class="space-y-3 border-b border-border-default pb-4 sm:space-y-4 sm:pb-6">
      <SkeletonText size="sm" width="w-40" tone="muted" />
      <SkeletonText size="lg" width="w-48" />
      <SkeletonText size="md" width="w-full" tone="muted" />
    </div>

    <div class="mt-4 grid gap-3 sm:mt-6 md:grid-cols-3">
      <SkeletonBlock
        v-for="index in 3"
        :key="`summary-${index}`"
        class="h-[116px]"
        radius="2xl"
      />
    </div>

    <div class="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
      <SkeletonBlock
        v-for="index in 4"
        :key="index"
        class="h-[148px]"
        radius="2xl"
      />
    </div>
  </section>
</template>
