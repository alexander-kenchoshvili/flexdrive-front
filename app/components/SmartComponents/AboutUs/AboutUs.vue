<script setup lang="ts">
import {
  ArrowRightIcon,
  ClipboardDocumentCheckIcon,
  CreditCardIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
} from "@heroicons/vue/24/outline";
import type { Component } from "vue";
import AppBreadcrumbs from "~/components/common/AppBreadcrumbs.vue";
import BaseButton from "~/components/common/BaseButton.vue";
import { sanitizeText, splitAutoMateTitleParts } from "~/composables/helpers";
import type { ContentItemData, SmartComponentRenderData } from "~/types/page";

type AboutUsItem = {
  id: number;
  title: string;
  description: string;
  slug: string;
  position: number;
};

type AboutUsAction = AboutUsItem & {
  routePath: string;
};

const props = defineProps<{
  data?: SmartComponentRenderData;
}>();

const globalStore = useGlobalStore();

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const stripAccentSyntax = (value: string) =>
  value.replace(/\[\[(.*?)\]\]/g, "$1").trim();

const routePathFromSlug = (slug: string) => {
  const normalizedSlug = slug.trim().replace(/^\/+|\/+$/g, "");
  if (!normalizedSlug || normalizedSlug === "main") return "/";
  return `/${normalizedSlug}`;
};

const rawItems = computed<ContentItemData[]>(() => {
  const list = props.data?.contentData?.list;
  return Array.isArray(list) ? list : [];
});

const sectionTitle = computed(() => sanitizeText(props.data?.title));
const sectionSubtitle = computed(() => sanitizeText(props.data?.subtitle));
const titleParts = computed(() => splitAutoMateTitleParts(sectionTitle.value));
const subtitleParts = computed(() =>
  splitAutoMateTitleParts(sectionSubtitle.value),
);

const mapItem = (item: ContentItemData, index: number): AboutUsItem => ({
  id: toNumber(item.id, index + 1),
  title: sanitizeText(item.title),
  description: sanitizeText(item.description),
  slug: sanitizeText(item.slug),
  position: toNumber(item.position, index + 1),
});

const sortedItemsByType = (contentType: string) =>
  rawItems.value
    .filter((item) => item.content_type === contentType)
    .map(mapItem)
    .filter((item) => item.title || item.description)
    .sort((a, b) =>
      a.position === b.position ? a.id - b.id : a.position - b.position,
    );

const eyebrow = computed(() => sortedItemsByType("about_eyebrow")[0] ?? null);
const panel = computed(() => sortedItemsByType("about_panel")[0] ?? null);
const panelDescriptionParts = computed(() =>
  splitAutoMateTitleParts(panel.value?.description),
);
const features = computed(() => sortedItemsByType("about_feature"));
const actions = computed<AboutUsAction[]>(() =>
  sortedItemsByType("about_action").map((item) => ({
    ...item,
    routePath: routePathFromSlug(item.slug),
  })),
);

const breadcrumbLabel = computed(
  () =>
    sanitizeText(globalStore.menuCurrent?.name) ||
    stripAccentSyntax(sectionTitle.value),
);

const breadcrumbItems = computed(() => [
  { label: "მთავარი", to: "/" },
  { label: breadcrumbLabel.value },
]);

const featureIconMap: Record<string, Component> = {
  catalog: Squares2X2Icon,
  payment: CreditCardIcon,
  status: ClipboardDocumentCheckIcon,
};

const getFeatureIcon = (slug: string) =>
  featureIconMap[slug] || MagnifyingGlassIcon;

const hasVisibleContent = computed(
  () =>
    Boolean(sectionTitle.value) ||
    Boolean(sectionSubtitle.value) ||
    Boolean(panel.value) ||
    features.value.length > 0,
);
</script>

<template>
  <section
    v-if="hasVisibleContent"
    class="border-b border-border-default bg-section-soft py-6 sm:py-8 lg:py-12"
  >
    <div class="container-fluid min-w-0">
      <AppBreadcrumbs :items="breadcrumbItems" />

      <div
        class="mt-6 grid min-w-0 gap-6 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,426px)] lg:items-center lg:gap-10 xl:gap-14"
      >
        <div class="min-w-0 py-1 lg:py-6">
          <p
            v-if="eyebrow?.title"
            class="upper inline-flex max-w-full items-center rounded-full border border-border-default bg-surface px-3 py-2 text-xs font-extrabold text-accent-primary shadow-[0_14px_34px_-30px_var(--shadow-color)]"
          >
            {{ eyebrow.title }}
          </p>

          <h1
            v-if="sectionTitle"
            class="title-under-xs mt-5 max-w-4xl text-[30px] font-extrabold leading-[1.08] text-text-primary sm:text-[42px] lg:text-[56px]"
          >
            <span v-if="titleParts.upperLeadingPart" class="upper">
              {{ titleParts.upperLeadingPart }}
            </span>
            <template
              v-for="(segment, index) in titleParts.brandSegments"
              :key="`about-title-brand-${index}`"
            >
              <span class="upper" :class="segment.accent ? 'text-accent-primary' : ''">
                {{ segment.text }}
              </span>
            </template>
            <span v-if="titleParts.upperTrailingPart" class="upper">
              {{ titleParts.upperTrailingPart }}
            </span>
          </h1>

          <p
            v-if="sectionSubtitle"
            class="mt-4 max-w-3xl text-[15px] font-medium leading-8 text-text-secondary sm:text-[17px] sm:leading-9"
          >
            <span v-if="subtitleParts.upperLeadingPart">
              {{ subtitleParts.upperLeadingPart }}
            </span>
            <template
              v-for="(segment, index) in subtitleParts.brandSegments"
              :key="`about-subtitle-brand-${index}`"
            >
              <span
                class="upper font-extrabold"
                :class="segment.accent ? 'text-accent-primary' : 'text-text-primary'"
              >
                {{ segment.text }}
              </span>
            </template>
            <span v-if="subtitleParts.upperTrailingPart">
              {{ subtitleParts.upperTrailingPart }}
            </span>
          </p>

          <div
            v-if="actions.length"
            class="mt-6 grid gap-3 sm:flex sm:flex-wrap sm:items-center"
          >
            <BaseButton
              v-for="(action, index) in actions"
              :key="action.id"
              as="nuxt-link"
              :to="action.routePath"
              :variant="index === 0 ? 'primary' : 'secondary'"
              size="lg"
              class="w-full sm:w-auto"
            >
              {{ action.title }}
              <template #right>
                <ArrowRightIcon
                  v-if="index === 0"
                  class="h-4 w-4"
                  aria-hidden="true"
                />
              </template>
            </BaseButton>
          </div>
        </div>

        <aside
          v-if="panel || features.length"
          class="min-w-0 rounded-lg border border-border-default bg-surface p-4 shadow-[0_24px_60px_-44px_var(--shadow-color)] sm:p-5 lg:p-6"
          aria-label="FLEXDRIVE მოკლე ინფორმაცია"
        >
          <div v-if="panel" class="min-w-0">
            <h2 class="text-lg font-extrabold text-text-primary sm:text-xl">
              {{ panel.title }}
            </h2>
            <p
              v-if="panel.description"
              class="mt-3 text-sm font-medium leading-7 text-text-secondary"
            >
              <span v-if="panelDescriptionParts.upperLeadingPart">
                {{ panelDescriptionParts.upperLeadingPart }}
              </span>
              <template
                v-for="(segment, index) in panelDescriptionParts.brandSegments"
                :key="`about-panel-brand-${index}`"
              >
                <span
                  class="upper font-extrabold"
                  :class="segment.accent ? 'text-accent-primary' : 'text-text-primary'"
                >
                  {{ segment.text }}
                </span>
              </template>
              <span v-if="panelDescriptionParts.upperTrailingPart">
                {{ panelDescriptionParts.upperTrailingPart }}
              </span>
            </p>
          </div>

          <div
            v-if="features.length"
            class="mt-5 divide-y divide-border-default border-t border-border-default"
          >
            <article
              v-for="feature in features"
              :key="feature.id"
              class="flex min-w-0 gap-3 py-4 first:pt-5 last:pb-0"
            >
              <span
                class="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border-default bg-surface-2 text-accent-primary"
                aria-hidden="true"
              >
                <component :is="getFeatureIcon(feature.slug)" class="h-5 w-5" />
              </span>

              <div class="min-w-0">
                <h3 class="text-sm font-extrabold text-text-primary">
                  {{ feature.title }}
                </h3>
                <p
                  v-if="feature.description"
                  class="mt-1.5 text-sm font-medium leading-6 text-text-secondary"
                >
                  {{ feature.description }}
                </p>
              </div>
            </article>
          </div>
        </aside>
      </div>
    </div>
  </section>
</template>
