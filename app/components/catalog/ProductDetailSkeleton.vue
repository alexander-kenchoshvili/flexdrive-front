<script setup lang="ts">
import SkeletonBlock from "~/components/common/skeleton/SkeletonBlock.vue";
import SkeletonText from "~/components/common/skeleton/SkeletonText.vue";
</script>

<template>
  <div
    class="rounded-[24px] border border-border-default bg-surface p-6 shadow-[0_24px_60px_-38px_var(--shadow-color)]"
  >
    <div class="space-y-6">
      <SkeletonText size="md" width="w-40" tone="muted" />

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_460px]">
        <SkeletonBlock class="aspect-square" radius="3xl" />

        <div class="space-y-4">
          <SkeletonText size="sm" width="w-24" tone="muted" />
          <SkeletonBlock class="h-10 w-3/4" radius="2xl" />
          <SkeletonBlock class="h-24" radius="2xl" />
          <SkeletonBlock class="h-12" radius="xl" />
          <SkeletonBlock class="h-24" radius="2xl" />
        </div>
      </div>
    </div>
  </div>
</template>
