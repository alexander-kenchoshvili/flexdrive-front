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
    radius: "xl",
  },
);

const radiusClassMap: Record<SkeletonRadius, string> = {
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-[14px]",
  "2xl": "rounded-[20px]",
  "3xl": "rounded-[24px]",
};
</script>

<template>
  <BaseSkeleton
    shape="rect"
    :tone="tone"
    :class="radiusClassMap[radius]"
  />
</template>
