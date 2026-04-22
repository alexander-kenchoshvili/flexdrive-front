<script setup lang="ts">
import BaseSkeleton from "./BaseSkeleton.vue";

type SkeletonTextSize = "sm" | "md" | "lg";

const props = withDefaults(
  defineProps<{
    size?: SkeletonTextSize;
    width?: string;
    tone?: "default" | "muted";
  }>(),
  {
    size: "md",
    width: "w-full",
    tone: "default",
  },
);

const sizeClassMap: Record<SkeletonTextSize, string> = {
  sm: "h-4",
  md: "h-5",
  lg: "h-8",
};
</script>

<template>
  <BaseSkeleton
    shape="pill"
    :tone="tone"
    :class="[sizeClassMap[size], width]"
  />
</template>
