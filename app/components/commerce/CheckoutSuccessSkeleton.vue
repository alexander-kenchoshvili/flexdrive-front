<script setup lang="ts">
import SkeletonBlock from "~/components/common/skeleton/SkeletonBlock.vue";
import SkeletonText from "~/components/common/skeleton/SkeletonText.vue";
</script>

<template>
  <section
    class="rounded-[24px] border border-border-default bg-surface p-6 shadow-[0_24px_60px_-38px_var(--shadow-color)]"
  >
    <div class="space-y-6">
      <SkeletonText size="md" width="w-48" tone="muted" />
      <SkeletonBlock class="h-12 w-2/3" radius="2xl" />
      <SkeletonText size="md" width="w-1/2" />

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div class="space-y-4">
          <SkeletonBlock class="h-32" radius="3xl" />
          <SkeletonBlock class="h-52" radius="3xl" />
          <SkeletonBlock class="h-52" radius="3xl" />
        </div>
        <SkeletonBlock class="h-[420px]" radius="3xl" />
      </div>
    </div>
  </section>
</template>
