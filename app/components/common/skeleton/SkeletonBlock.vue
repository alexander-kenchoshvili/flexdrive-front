<script setup lang="ts">
import BaseSkeleton from "./BaseSkeleton.vue";

type SkeletonRadius = "md" | "lg" | "xl" | "2xl" | "3xl";

const props = withDefaults(
  defineProps<{
    tone?: "default" | "muted";
    radius?: SkeletonRadius;
  }>(),
  {
    tone: "default",
    radius: "lg",
  },
);

const radiusClassMap: Record<SkeletonRadius, string> = {
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
};
</script>

<template>
  <BaseSkeleton
    shape="rect"
    :tone="tone"
    :class="radiusClassMap[radius]"
  />
</template>
