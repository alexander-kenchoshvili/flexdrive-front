<script setup lang="ts">
import BaseSkeleton from "./BaseSkeleton.vue";

type SkeletonCircleSize = "sm" | "md" | "lg" | "xl";

const props = withDefaults(
  defineProps<{
    size?: SkeletonCircleSize;
    tone?: "default" | "muted";
  }>(),
  {
    size: "md",
    tone: "default",
  },
);

const sizeClassMap: Record<SkeletonCircleSize, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-10 w-10",
  xl: "h-16 w-16",
};
</script>

<template>
  <BaseSkeleton
    shape="circle"
    :tone="tone"
    :class="sizeClassMap[size]"
  />
</template>
