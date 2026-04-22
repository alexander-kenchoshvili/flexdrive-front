<script setup lang="ts">
import SkeletonBlock from "~/components/common/skeleton/SkeletonBlock.vue";
import SkeletonText from "~/components/common/skeleton/SkeletonText.vue";
</script>

<template>
  <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
    <div class="space-y-4">
      <div
        v-for="index in 3"
        :key="index"
        class="rounded-[24px] border border-border-default bg-surface p-6 shadow-[0_24px_60px_-38px_var(--shadow-color)]"
      >
        <div class="space-y-4">
          <SkeletonText size="sm" width="w-32" tone="muted" />
          <div class="grid gap-4 md:grid-cols-2">
            <SkeletonBlock class="h-12" radius="xl" />
            <SkeletonBlock class="h-12" radius="xl" />
          </div>
          <SkeletonBlock class="h-12" radius="xl" />
        </div>
      </div>
    </div>

    <div
      class="rounded-[24px] border border-border-default bg-surface p-6 shadow-[0_24px_60px_-38px_var(--shadow-color)]"
    >
      <div class="space-y-4">
        <SkeletonText size="md" width="w-40" tone="muted" />
        <SkeletonBlock class="h-24" radius="2xl" />
        <SkeletonBlock class="h-24" radius="2xl" />
        <SkeletonBlock class="h-12" radius="xl" />
        <SkeletonBlock class="h-12" radius="xl" />
      </div>
    </div>
  </section>
</template>
