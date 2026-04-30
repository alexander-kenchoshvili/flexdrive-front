<script setup lang="ts">
import { sanitizeText, splitAutoMateTitleParts } from "~/composables/helpers";
import type { ContentItemData, SmartComponentData } from "~/types/page";
import OrderConfidenceCard, {
  type OrderConfidenceIcon,
} from "./parts/OrderConfidenceCard.vue";

type OrderConfidenceCardData = {
  id: number;
  title: string;
  description: string;
  position: number;
  step: string;
  icon: OrderConfidenceIcon;
};

const props = defineProps<{
  data?: SmartComponentData;
}>();

const iconOrder: OrderConfidenceIcon[] = ["order", "account", "payment", "delivery"];

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const rawItems = computed<ContentItemData[]>(() => {
  const list = props.data?.contentData?.list;
  return Array.isArray(list) ? list : [];
});

const sectionTitle = computed(() => sanitizeText(props.data?.title));
const sectionSubtitle = computed(() => sanitizeText(props.data?.subtitle));

const titleParts = computed(() => splitAutoMateTitleParts(sectionTitle.value));

const cards = computed<OrderConfidenceCardData[]>(() =>
  rawItems.value
    .map((item, index) => ({
      id: toNumber(item.id, index + 1),
      title: sanitizeText(item.title),
      description: sanitizeText(item.description),
      position: toNumber(item.position, index + 1),
    }))
    .filter((item) => item.title || item.description)
    .sort((a, b) =>
      a.position === b.position ? a.id - b.id : a.position - b.position,
    )
    .map((item, index) => ({
      ...item,
      step: String(index + 1).padStart(2, "0"),
      icon: iconOrder[index] || "order",
    })),
);
</script>

<template>
  <section
    v-if="cards.length"
    class="border-b border-border-default bg-section-warm py-10 md:py-12 xl:py-16"
  >
    <div class="container-fluid">
      <div class="mx-auto text-center xl:max-w-[720px]">
        <h2
          v-if="sectionTitle"
          class="title-under-xs text-[28px] font-extrabold leading-[1.15] text-text-primary sm:text-[32px] md:text-[36px]"
        >
          <span v-if="titleParts.upperLeadingPart" class="upper">
            {{ titleParts.upperLeadingPart }}
          </span>
          <template
            v-for="(segment, segmentIndex) in titleParts.brandSegments"
            :key="`order-confidence-title-${segmentIndex}`"
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
          class="subtitle-under-xs mx-auto mt-3 text-sm leading-6 text-text-secondary md:text-[15px] md:leading-[1.6] xl:max-w-[560px]"
        >
          {{ sectionSubtitle }}
        </p>
      </div>

      <div
        class="mt-8 rounded-lg border border-border-default bg-surface p-2 shadow-[0_24px_60px_-46px_var(--shadow-color)] md:mt-10"
      >
        <div class="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
          <OrderConfidenceCard
            v-for="card in cards"
            :key="card.id"
            :item="card"
          />
        </div>
      </div>
    </div>
  </section>
</template>
