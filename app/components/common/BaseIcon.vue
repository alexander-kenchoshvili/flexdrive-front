<script setup lang="ts">
import type { Component } from "vue";

defineOptions({ inheritAttrs: false });

type BaseIconProps = {
  name: string;
  size?: number | string;
  decorative?: boolean;
  title?: string;
};

const props = withDefaults(defineProps<BaseIconProps>(), {
  size: 20,
  decorative: true,
  title: "",
});

const rawIcons = import.meta.glob("../icons/**/*.vue", {
  eager: true,
}) as Record<string, { default: Component }>;

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const iconMap = new Map<string, Component>();

for (const [path, module] of Object.entries(rawIcons)) {
  const relativePath = path.split("../icons/")[1]?.replace(/\.vue$/i, "") || "";
  const fileName = relativePath.split("/").pop() || "";

  const byFileName = normalize(fileName);
  const byRelativePath = normalize(relativePath);

  if (byFileName) iconMap.set(byFileName, module.default);
  if (byRelativePath) iconMap.set(byRelativePath, module.default);
}

const resolvedIcon = computed(() => iconMap.get(normalize(props.name)) || null);

const iconSize = computed(() =>
  typeof props.size === "number" ? `${props.size}px` : props.size,
);

type IconAriaAttrs = {
  "aria-hidden"?: boolean;
  role?: "img";
  "aria-label"?: string;
};

const iconAriaAttrs = computed<IconAriaAttrs>(() => {
  if (props.decorative) {
    return {
      "aria-hidden": true,
    };
  }

  return {
    role: "img",
    "aria-label": props.title || props.name,
  };
});
</script>

<template>
  <span
    class="flex shrink-0 items-center justify-center leading-none"
    :style="{ width: iconSize, height: iconSize }"
    v-bind="$attrs"
  >
    <component
      :is="resolvedIcon"
      v-if="resolvedIcon"
      class="h-full w-full"
      v-bind="iconAriaAttrs"
    />

    <svg
      v-else
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="h-full w-full text-text-muted"
      v-bind="iconAriaAttrs"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  </span>
</template>
