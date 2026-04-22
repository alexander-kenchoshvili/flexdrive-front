<script setup lang="ts">
defineOptions({ inheritAttrs: false });

type SkeletonTone = "default" | "muted";
type SkeletonShape = "rect" | "pill" | "circle";

const props = withDefaults(
  defineProps<{
    as?: string;
    tone?: SkeletonTone;
    shape?: SkeletonShape;
    animated?: boolean;
  }>(),
  {
    as: "div",
    tone: "default",
    shape: "rect",
    animated: true,
  },
);

const attrs = useAttrs();

const toneClassMap: Record<SkeletonTone, string> = {
  default: "bg-surface-2",
  muted: "bg-surface-3",
};

const shapeClassMap: Record<SkeletonShape, string> = {
  rect: "rounded-md",
  pill: "rounded-full",
  circle: "rounded-full",
};

const rootClass = computed(() => (attrs.class as any) ?? undefined);
const rootStyle = computed(() => (attrs.style as any) ?? undefined);

const forwardedAttrs = computed(() => {
  const cloned = { ...(attrs as Record<string, unknown>) };
  delete cloned.class;
  delete cloned.style;
  return cloned;
});

const componentClass = computed(() => {
  const classes = [
    "block",
    toneClassMap[props.tone],
    shapeClassMap[props.shape],
  ];

  if (props.animated) {
    classes.push("animate-pulse");
  }

  return classes.join(" ");
});
</script>

<template>
  <component
    :is="as"
    :class="[componentClass, rootClass]"
    :style="rootStyle"
    v-bind="forwardedAttrs"
  />
</template>
