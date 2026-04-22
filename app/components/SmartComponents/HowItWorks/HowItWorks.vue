<script setup lang="ts">
import type { ContentItemData, SmartComponentData } from "~/types/page";
import HowItWorksCardItem from "./parts/HowItWorksCardItem.vue";
import HowItWorksStepItem from "./parts/HowItWorksStepItem.vue";
import { sanitizeText, splitAutoMateTitleParts } from "~/composables/helpers";

type FlowKey = "guest" | "registered";

type FlowItem = {
  id: number;
  contentType: string;
  title: string;
  description: string;
  position: number;
  iconSvg: string;
};

const props = defineProps<{
  data?: SmartComponentData;
}>();

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const rawItems = computed<ContentItemData[]>(() => {
  const list = props.data?.contentData?.list;
  return Array.isArray(list) ? list : [];
});

const items = computed<FlowItem[]>(() =>
  rawItems.value
    .map((item, index) => ({
      id: toNumber(item.id, index + 1),
      contentType: sanitizeText(item.content_type).toLowerCase(),
      title: sanitizeText(item.title),
      description: sanitizeText(item.description),
      position: toNumber(item.position, toNumber(item.id, index + 1)),
      iconSvg: sanitizeText(item.icon_svg),
    }))
    .filter((item) => item.contentType.length > 0),
);

const byOrder = (a: FlowItem, b: FlowItem) =>
  a.position === b.position ? a.id - b.id : a.position - b.position;

const sectionTitle = computed(
  () => sanitizeText(props.data?.title) || "How Auto[[Mate]] Works?",
);
const sectionSubtitle = computed(() => sanitizeText(props.data?.subtitle));

const titleParts = computed(() => splitAutoMateTitleParts(sectionTitle.value));

const guestTabLabel = computed(() => {
  const tab = items.value
    .filter((item) => item.contentType === "guest_tab")
    .sort(byOrder)[0];
  return tab?.title || "სტუმარი შეკვეთა";
});

const registeredTabLabel = computed(() => {
  const tab = items.value
    .filter((item) => item.contentType === "registered_tab")
    .sort(byOrder)[0];
  return tab?.title || "რეგისტრირებული";
});

const tabs = computed(() => [
  { key: "guest" as FlowKey, label: guestTabLabel.value },
  { key: "registered" as FlowKey, label: registeredTabLabel.value },
]);

const activeFlow = ref<FlowKey>("guest");

const steps = computed(() =>
  items.value
    .filter((item) => item.contentType === `${activeFlow.value}_step`)
    .sort(byOrder),
);

const cards = computed(() =>
  items.value
    .filter((item) => item.contentType === `${activeFlow.value}_card`)
    .sort(byOrder),
);
</script>

<template>
  <section class="py-10 md:py-12">
    <div class="container-fluid">
      <div>
        <header class="text-center">
          <h2
            class="title-under-xs text-[28px] font-extrabold leading-[1.2] text-text-primary sm:text-[32px] md:text-[36px]"
          >
            <span v-if="titleParts.upperLeadingPart" class="upper">
              {{ titleParts.upperLeadingPart }}
            </span>
            <template
              v-for="(segment, segmentIndex) in titleParts.brandSegments"
              :key="`title-segment-${segmentIndex}`"
            >
              <span :class="segment.accent ? 'text-accent-primary' : ''">
                {{ segment.text }}
              </span>
            </template>
            <span v-if="titleParts.upperTrailingPart" class="upper">
              {{ titleParts.upperTrailingPart }}
            </span>
          </h2>
          <p
            v-if="sectionSubtitle"
            class="subtitle-under-xs mt-3 text-sm leading-6 text-text-secondary md:text-base"
          >
            {{ sectionSubtitle }}
          </p>
        </header>

        <div class="flex justify-center mt-10">
          <div class="flex w-full gap-2 bg-surface">
            <BaseButton
              v-for="tab in tabs"
              :key="tab.key"
              type="button"
              size="sm"
              :variant="activeFlow === tab.key ? 'primary' : 'accent-outline'"
              class="flex-1 !px-3 !py-2 upper"
              @click="activeFlow = tab.key"
            >
              {{ tab.label }}
            </BaseButton>
          </div>
        </div>

        <div
          :class="[
            'mt-8',
            steps.length > 1
              ? `relative xl:before:content-[''] xl:before:block xl:before:absolute xl:before:left-[12.5%] xl:before:right-[12.5%] xl:before:top-[45px] xl:before:h-[2px] xl:before:bg-accent-primary xl:before:z-0`
              : '',
          ]"
        >
          <ol
            v-if="steps.length"
            class="relative z-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
          >
            <HowItWorksStepItem
              v-for="(step, index) in steps"
              :key="`${activeFlow}-step-${step.id}`"
              :item="step"
              :index="index"
            />
          </ol>

          <div
            v-else
            class="rounded-xl border border-dashed border-border-default bg-surface p-6 text-center text-sm text-text-muted"
          >
            ნაბიჯები დროებით არ არის დამატებული.
          </div>
        </div>

        <div
          v-if="cards.length"
          :class="[
            'mt-6 grid',
            activeFlow === 'registered'
              ? ' gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
              : 'grid-cols-1',
          ]"
        >
          <HowItWorksCardItem
            v-for="card in cards"
            :key="`${activeFlow}-card-${card.id}`"
            :item="card"
          />
        </div>
      </div>
    </div>
  </section>
</template>
