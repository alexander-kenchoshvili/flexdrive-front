<script setup lang="ts">
import type { ImageAsset } from "~/types/page";
import {
  buildOptimizedCloudinaryUrl,
  getCloudinaryPresetWidths,
} from "~/composables/media/useCloudinaryImage";
import type {
  CloudinaryImagePreset,
  CloudinaryImageWidths,
} from "~/composables/media/useCloudinaryImage";

type ObjectFitMode = "cover" | "contain";
type DecodingMode = "sync" | "async" | "auto";
type FetchPriority = "high" | "low" | "auto";

type BasePictureData = ImageAsset & {
    tablet?: string | null;
};

type BasePictureWidthOverrides = Partial<CloudinaryImageWidths>;

const props = withDefaults(
  defineProps<{
    data?: BasePictureData | null;
    alt?: string;
    lazy?: boolean;
    fit?: ObjectFitMode;
    position?: string;
    mobileBreakpoint?: number;
    tabletBreakpoint?: number;
    decoding?: DecodingMode;
    fetchpriority?: FetchPriority;
    preset?: CloudinaryImagePreset;
    optimize?: boolean;
    widths?: BasePictureWidthOverrides;
  }>(),
  {
    data: null,
    alt: "",
    lazy: false,
    fit: "cover",
    position: "center",
    mobileBreakpoint: 767,
    tabletBreakpoint: 1023,
    decoding: "async",
    fetchpriority: "auto",
    preset: "default",
    optimize: true,
    widths: () => ({}),
  },
);

const loading = computed(() => (props.lazy ? "lazy" : "eager"));

const rawDesktopSrc = computed(
  () => props.data?.desktop || props.data?.tablet || props.data?.mobile || "",
);
const rawTabletSrc = computed(
  () => props.data?.tablet || props.data?.desktop || props.data?.mobile || "",
);
const rawMobileSrc = computed(
  () => props.data?.mobile || props.data?.tablet || props.data?.desktop || "",
);

const presetWidths = computed(() =>
  getCloudinaryPresetWidths(props.preset, props.widths),
);

const resolveSource = (source: string, width: number) => {
  if (!source) return "";
  if (!props.optimize) return source;
  return buildOptimizedCloudinaryUrl(source, width);
};

const desktopSrc = computed(() =>
  resolveSource(rawDesktopSrc.value, presetWidths.value.desktop),
);
const tabletSrc = computed(() =>
  resolveSource(rawTabletSrc.value, presetWidths.value.tablet),
);
const mobileSrc = computed(() =>
  resolveSource(rawMobileSrc.value, presetWidths.value.mobile),
);

const hasSource = computed(() => Boolean(desktopSrc.value));
const altValue = computed(() => props.alt?.trim() || "Image");

const imageClass = computed(() => {
  const fitClassMap: Record<ObjectFitMode, string> = {
    cover: "object-cover",
    contain: "object-contain",
  };

  return `block h-full w-full ${fitClassMap[props.fit]}`;
});

const imageStyle = computed(() => ({
  objectPosition: props.position,
}));

const mobileMedia = computed(() => `(max-width: ${props.mobileBreakpoint}px)`);
const tabletMedia = computed(() => `(max-width: ${props.tabletBreakpoint}px)`);
</script>

<template>
  <picture v-if="hasSource" class="block h-full w-full">
    <source v-if="mobileSrc" :srcset="mobileSrc" :media="mobileMedia" />
    <source v-if="tabletSrc" :srcset="tabletSrc" :media="tabletMedia" />
    <img
      :src="desktopSrc"
      :alt="altValue"
      :loading="loading"
      :decoding="decoding"
      :fetchpriority="fetchpriority"
      :class="imageClass"
      :style="imageStyle"
    />
  </picture>
</template>
