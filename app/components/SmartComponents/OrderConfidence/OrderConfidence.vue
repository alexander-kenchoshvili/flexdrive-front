<script setup lang="ts">
import { sanitizeText, splitAutoMateTitleParts } from "~/composables/helpers";
import type { ContentItemData, SmartComponentData } from "~/types/page";
import OrderConfidenceCard from "./parts/OrderConfidenceCard.vue";

type OrderConfidenceCardData = {
  id: number;
  title: string;
  description: string;
  iconSvg: string;
  position: number;
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

const sectionTitle = computed(
  () => sanitizeText(props.data?.title) || "შეკვეთა Auto[[Mate]]-ზე წინასწარ გასაგებია",
);
const sectionSubtitle = computed(
  () =>
    sanitizeText(props.data?.subtitle) ||
    "ონლაინ ყიდვისას ყველაზე ხშირად რაც აჩენს ეჭვს, აქ წინასწარ ნათელია: პროცესი, გადახდა, რეგისტრაცია და მიწოდება.",
);

const titleParts = computed(() => splitAutoMateTitleParts(sectionTitle.value));

const cards = computed<OrderConfidenceCardData[]>(() =>
  rawItems.value
    .map((item, index) => ({
      id: toNumber(item.id, index + 1),
      title: sanitizeText(item.title),
      description: sanitizeText(item.description),
      iconSvg: sanitizeText(item.icon_svg),
      position: toNumber(item.position, index + 1),
    }))
    .filter((item) => item.title || item.description || item.iconSvg)
    .sort((a, b) =>
      a.position === b.position ? a.id - b.id : a.position - b.position,
    ),
);
</script>

<template>
  <section class="border-b border-border-default bg-section-warm py-12 xl:py-16">
    <div class="container-fluid">
      <div class="mx-auto text-center xl:max-w-[720px]">
        <h2
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
        v-if="cards.length"
        class="mt-10 overflow-hidden rounded-[22px] border border-border-default bg-border-default"
      >
        <div class="grid grid-cols-1 gap-px md:grid-cols-2 xl:grid-cols-4">
          <OrderConfidenceCard
            v-for="card in cards"
            :key="card.id"
            :item="card"
          />
        </div>
      </div>

      <div
        v-else
        class="mt-10 rounded-[20px] border border-dashed border-border-default bg-surface p-6 text-center text-sm text-text-secondary"
      >
        შეკვეთის ნდობის ბარათები ჯერ არ არის დამატებული.
      </div>
    </div>
  </section>
</template>
