<script setup lang="ts">
import SkeletonBlock from "~/components/common/skeleton/SkeletonBlock.vue";
import SkeletonText from "~/components/common/skeleton/SkeletonText.vue";
</script>

<template>
  <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
    <div class="space-y-4">
      <div
        v-for="index in 2"
        :key="index"
        class="rounded-[24px] border border-border-default bg-surface p-4 shadow-[0_24px_60px_-38px_var(--shadow-color)] md:p-5"
      >
        <div class="gap-5 md:grid md:grid-cols-[140px_minmax(0,1fr)]">
          <SkeletonBlock class="aspect-square" radius="2xl" />
          <div class="mt-4 space-y-4 md:mt-0">
            <SkeletonText size="sm" width="w-24" tone="muted" />
            <SkeletonBlock class="h-9 w-2/3" radius="2xl" />
            <SkeletonText size="sm" width="w-40" />
            <div class="grid gap-3 lg:grid-cols-3">
              <SkeletonBlock class="h-16" radius="xl" />
              <SkeletonBlock class="h-16" radius="xl" />
              <SkeletonBlock class="h-16" radius="xl" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="rounded-[24px] border border-border-default bg-surface p-6 shadow-[0_24px_60px_-38px_var(--shadow-color)]"
    >
      <div class="space-y-4">
        <SkeletonText size="md" width="w-40" tone="muted" />
        <SkeletonBlock class="h-24" radius="2xl" />
        <SkeletonBlock class="h-32" radius="2xl" />
        <SkeletonBlock class="h-12" radius="xl" />
        <SkeletonBlock class="h-12" radius="xl" />
      </div>
    </div>
  </section>
</template>
