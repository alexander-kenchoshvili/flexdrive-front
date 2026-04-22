<script setup lang="ts">
import SkeletonBlock from "~/components/common/skeleton/SkeletonBlock.vue";
import SkeletonText from "~/components/common/skeleton/SkeletonText.vue";
</script>

<template>
  <section class="space-y-4">
    <SkeletonBlock class="h-[168px]" radius="3xl" />

    <div class="grid gap-4 lg:grid-cols-3">
      <SkeletonBlock class="h-[104px]" radius="2xl" />
      <SkeletonBlock class="h-[104px]" radius="2xl" />
      <SkeletonBlock class="h-[104px]" radius="2xl" />
    </div>

    <section
      class="rounded-[28px] border border-border-default bg-surface p-6 shadow-[0_24px_60px_-38px_var(--shadow-color)] md:p-7"
    >
      <SkeletonText size="md" width="w-44" tone="muted" />
      <div class="mt-6 grid gap-3 lg:grid-cols-5">
        <SkeletonBlock
          v-for="index in 5"
          :key="index"
          class="h-[120px]"
          radius="2xl"
        />
      </div>
    </section>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <SkeletonBlock class="h-[420px]" radius="3xl" />
      <div class="space-y-4">
        <SkeletonBlock class="h-[340px]" radius="3xl" />
        <SkeletonBlock class="h-[180px]" radius="3xl" />
      </div>
    </div>
  </section>
</template>
