<script setup lang="ts">
import type { ContentItemData, SmartComponentData } from "~/types/page";
import HowItWorksCardItem from "./parts/HowItWorksCardItem.vue";
import HowItWorksStepItem from "./parts/HowItWorksStepItem.vue";
import { sanitizeText, splitAutoMateTitleParts } from "~/composables/helpers";

type FlowKey = "guest" | "registered";
type HowItWorksStepIcon =
  | "search"
  | "cart"
  | "details"
  | "confirm"
  | "account"
  | "wishlist"
  | "checkout"
  | "tracking";
type HowItWorksCardIcon = "guest" | "wishlist" | "address" | "history";

type FlowItem = {
  id: number;
  contentType: string;
  title: string;
  description: string;
  position: number;
};

const props = defineProps<{
  data?: SmartComponentData;
}>();

const stepIconOrder: Record<FlowKey, HowItWorksStepIcon[]> = {
  guest: ["search", "cart", "details", "confirm"],
  registered: ["account", "wishlist", "checkout", "tracking"],
};

const cardIconOrder: Record<FlowKey, HowItWorksCardIcon[]> = {
  guest: ["guest"],
  registered: ["wishlist", "address", "history"],
};

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
    }))
    .filter((item) => item.contentType.length > 0),
);

const byOrder = (a: FlowItem, b: FlowItem) =>
  a.position === b.position ? a.id - b.id : a.position - b.position;

const sectionTitle = computed(
  () =>
    sanitizeText(props.data?.title) ||
    "აირჩიე გზა შეკვეთამდე Flex[[Drive]]-ზე",
);
const sectionSubtitle = computed(() => sanitizeText(props.data?.subtitle));

const titleParts = computed(() => splitAutoMateTitleParts(sectionTitle.value));

const guestTabLabel = computed(() => {
  const tab = items.value
    .filter((item) => item.contentType === "guest_tab")
    .sort(byOrder)[0];
  return tab?.title || "სტუმრად ყიდვა";
});

const registeredTabLabel = computed(() => {
  const tab = items.value
    .filter((item) => item.contentType === "registered_tab")
    .sort(byOrder)[0];
  return tab?.title || "ანგარიშით ყიდვა";
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

const mappedSteps = computed(() =>
  steps.value.map((step, index) => ({
    ...step,
    icon: stepIconOrder[activeFlow.value][index] || "confirm",
    stepLabel: String(index + 1).padStart(2, "0"),
  })),
);

const cards = computed(() =>
  items.value
    .filter((item) => item.contentType === `${activeFlow.value}_card`)
    .sort(byOrder),
);

const mappedCards = computed(() =>
  cards.value.map((card, index) => ({
    ...card,
    icon: cardIconOrder[activeFlow.value][index] || "history",
  })),
);

const activeTabLabel = computed(
  () => tabs.value.find((tab) => tab.key === activeFlow.value)?.label || "",
);
</script>

<template>
  <section class="border-b border-border-default bg-bg-primary py-10 md:py-14 xl:py-16">
    <div class="container-fluid">
      <div>
        <header class="text-center lg:text-left">
          <h2
            class="title-under-xs text-[26px] font-extrabold leading-[1.16] text-text-primary sm:text-[28px] md:text-[30px] lg:text-[40px] lg:leading-[1.12]"
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
            class="subtitle-under-xs mt-3 w-full text-sm leading-7 text-text-secondary md:text-base lg:max-w-2xl"
          >
            {{ sectionSubtitle }}
          </p>
        </header>

        <div class="mt-6 flex justify-end">
          <div
            class="grid w-full gap-2 rounded-md border border-border-default bg-surface p-1.5 shadow-[0_18px_48px_-40px_var(--shadow-color)] sm:grid-cols-2 lg:max-w-[520px]"
            role="tablist"
            aria-label="შეკვეთის გზა"
          >
            <button
              v-for="(tab, tabIndex) in tabs"
              :key="tab.key"
              type="button"
              role="tab"
              :aria-selected="activeFlow === tab.key"
              :class="[
                'btn-min-h-44 flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-extrabold transition-colors duration-200',
                activeFlow === tab.key
                  ? 'border-accent-primary bg-accent-primary text-text-invert shadow-[0_10px_24px_-20px_var(--shadow-color)]'
                  : 'border-transparent bg-transparent text-text-secondary hover:border-border-default hover:bg-surface-2 hover:text-text-primary',
              ]"
              @click="activeFlow = tab.key"
            >
              <span
                class="grid w-full max-w-[190px] grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-2 text-left"
              >
                <span
                  :class="[
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-black',
                    activeFlow === tab.key
                      ? 'bg-transparent text-text-invert ring-1 ring-inset ring-white/25 dark:ring-black/20'
                      : 'bg-surface-2 text-accent-primary',
                  ]"
                  aria-hidden="true"
                >
                  {{ tabIndex + 1 }}
                </span>
                <span class="min-w-0">
                  {{ tab.label }}
                </span>
              </span>
            </button>
          </div>
        </div>

        <div
          class="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start"
        >
          <div class="min-w-0">
            <div
              class="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border-default pb-3"
            >
              <p class="text-sm font-extrabold text-text-primary">
                {{ activeTabLabel }}
              </p>
              <span
                v-if="mappedSteps.length"
                class="rounded-full border border-border-default bg-surface px-3 py-1 text-xs font-bold text-text-secondary"
              >
                {{ mappedSteps.length }} ნაბიჯი
              </span>
            </div>

            <ol
              v-if="mappedSteps.length"
              class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
            >
              <HowItWorksStepItem
                v-for="(step, index) in mappedSteps"
                :key="`${activeFlow}-step-${step.id}`"
                :item="step"
                :index="index"
              />
            </ol>

            <div
              v-else
              class="rounded-md border border-dashed border-border-default bg-surface p-6 text-center text-sm text-text-muted"
            >
              ნაბიჯები დროებით არ არის დამატებული.
            </div>
          </div>

          <aside
            v-if="mappedCards.length"
            :class="[
              'grid gap-3',
              mappedCards.length > 1 ? 'md:grid-cols-3 xl:grid-cols-1' : '',
            ]"
          >
            <HowItWorksCardItem
              v-for="card in mappedCards"
              :key="`${activeFlow}-card-${card.id}`"
              :item="card"
            />
          </aside>
        </div>
      </div>
    </div>
  </section>
</template>
