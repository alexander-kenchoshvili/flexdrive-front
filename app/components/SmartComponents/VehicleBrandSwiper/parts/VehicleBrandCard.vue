<script setup lang="ts">
import { ArrowRightIcon } from "@heroicons/vue/20/solid";
import { sanitizeText } from "~/composables/helpers";
import { sanitizeSvg } from "~/utils/contentSanitizer";

export type VehicleBrandItem = {
  id: number;
  title: string;
  slug: string;
  description: string;
  position: number;
  iconSvg: string;
};

const props = defineProps<{
  brand: VehicleBrandItem;
}>();

const title = computed(() => sanitizeText(props.brand.title));
const description = computed(() => sanitizeText(props.brand.description));
const safeIconSvg = computed(() => sanitizeSvg(props.brand.iconSvg));
const hasIcon = computed(() => Boolean(safeIconSvg.value));

const brandPath = computed(() => ({
  path: "/catalog",
  query: { make: props.brand.slug },
}));

const fallbackLabel = computed(() => {
  const normalized = title.value.replace(/[^A-Za-z0-9]+/g, " ").trim();
  const words = normalized.split(/\s+/).filter(Boolean);

  if (!words.length) {
    return "FD";
  }

  if (words.length > 1) {
    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }

  return (words[0] || "FD").slice(0, 3).toUpperCase();
});
</script>

<template>
  <NuxtLink
    :to="brandPath"
    :aria-label="`${title} მარკის ნაწილების ნახვა`"
    class="group flex h-full min-h-[208px] flex-col overflow-hidden rounded-lg border border-border-default bg-surface shadow-[0_18px_44px_-38px_var(--shadow-color)] transition-[border-color,box-shadow,background-color] duration-200 hover:border-accent-primary/70 hover:bg-surface-2 hover:shadow-[0_22px_54px_-36px_var(--shadow-color)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary sm:min-h-[218px]"
  >
    <span
      class="relative flex h-[112px] shrink-0 items-center justify-center overflow-hidden border-b border-border-default bg-[linear-gradient(135deg,var(--surface-2)_0%,var(--surface)_100%)] px-4 py-4 sm:h-[120px]"
    >
      <span
        class="absolute left-3 top-3 h-2 w-2 rounded-full bg-accent-primary/75"
        aria-hidden="true"
      />
      <span
        class="flex h-[78px] w-[78px] items-center justify-center rounded-full border border-border-default bg-[linear-gradient(145deg,var(--surface)_0%,var(--surface-2)_60%,var(--surface)_100%)] text-text-primary shadow-[0_18px_44px_-36px_var(--shadow-color)] transition-[border-color,color,transform] duration-200 group-hover:scale-[1.03] group-hover:border-accent-primary/55 group-hover:text-accent-primary sm:h-[84px] sm:w-[84px]"
      >
        <span
          v-if="hasIcon"
          class="vehicle-brand-logo"
          aria-hidden="true"
          v-html="safeIconSvg"
        />
        <span
          v-else
          class="text-[15px] font-extrabold leading-none tracking-[0.06em] text-accent-primary"
        >
          {{ fallbackLabel }}
        </span>
      </span>
    </span>

    <span class="flex min-h-0 flex-1 flex-col justify-between px-3 py-3 sm:px-4">
      <span class="min-w-0">
        <span
          class="vehicle-brand-title upper block min-h-[38px] text-center text-[13px] font-extrabold leading-[19px] text-text-primary transition-colors duration-200 group-hover:text-accent-primary sm:text-[14px] sm:leading-5"
        >
          {{ title }}
        </span>

        <span
          v-if="description"
          class="vehicle-brand-description mt-1.5 block min-h-[34px] text-center text-[11px] font-semibold leading-[17px] text-text-secondary sm:text-[12px] sm:leading-[18px]"
        >
          {{ description }}
        </span>
      </span>

      <span
        class="mt-3 flex items-center justify-center gap-1.5 text-[12px] font-extrabold leading-5 text-accent-primary"
      >
        <span>ნაწილების ნახვა</span>
        <ArrowRightIcon
          class="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </span>
  </NuxtLink>
</template>

<style scoped>
.vehicle-brand-logo {
  display: flex;
  width: 62px;
  height: 44px;
  align-items: center;
  justify-content: center;
  color: currentColor;
}

.vehicle-brand-logo :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
  max-width: 62px;
  max-height: 44px;
  color: currentColor;
  fill: currentColor;
}

.vehicle-brand-logo :deep(svg [fill]:not([fill="none"])) {
  fill: currentColor;
}

.vehicle-brand-logo :deep(svg [stroke]:not([stroke="none"])) {
  stroke: currentColor;
}

.vehicle-brand-title,
.vehicle-brand-description {
  display: -webkit-box;
  overflow: hidden;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
}

.vehicle-brand-title {
  -webkit-line-clamp: 2;
}

.vehicle-brand-description {
  -webkit-line-clamp: 2;
}

@media (min-width: 640px) {
  .vehicle-brand-logo {
    width: 66px;
    height: 46px;
  }

  .vehicle-brand-logo :deep(svg) {
    max-width: 66px;
    max-height: 46px;
  }
}
</style>
