<script setup lang="ts">
import { sanitizeText, splitAutoMateTitleParts } from "~/composables/helpers";
import type { ContentItemData, SmartComponentData } from "~/types/page";
import ProblemSolvingCard from "./parts/ProblemSolvingCard.vue";

type ProblemSolvingCardData = {
  id: number;
  title: string;
  description: string;
  iconSvg: string;
  position: number;
  category: ContentItemData["catalog_category"];
};

const props = defineProps<{
  data?: SmartComponentData;
}>();

const sectionTitle = computed(
  () => sanitizeText(props.data?.title) || "რა პრობლემას გიგვარებს Auto[[Mate]]?",
);
const sectionSubtitle = computed(
  () =>
    sanitizeText(props.data?.subtitle) ||
    "ავტომობილის ყოველდღიური გამოყენება ბევრ პატარა შეუსაბამობას ქმნის.",
);
const titleParts = computed(() => splitAutoMateTitleParts(sectionTitle.value));

const cards = computed<ProblemSolvingCardData[]>(() => {
  const list = Array.isArray(props.data?.contentData?.list)
    ? props.data?.contentData?.list
    : [];

  return list
    .map((item, index) => ({
      id: Number(item.id ?? index + 1),
      title: sanitizeText(item.title),
      description: sanitizeText(item.description),
      iconSvg: sanitizeText(item.icon_svg),
      position: Number(item.position ?? index + 1),
      category: item.catalog_category ?? null,
    }))
    .filter((item) => item.title || item.description || item.iconSvg)
    .sort((a, b) =>
      a.position === b.position ? a.id - b.id : a.position - b.position,
    );
});
</script>

<template>
  <section class="py-10 md:py-12">
    <div class="container-fluid">
      <div class="mx-auto max-w-[760px] text-center">
        <h2
          class="title-under-xs text-[28px] font-extrabold leading-[1.15] text-text-primary sm:text-[32px] md:text-[36px]"
        >
          <span v-if="titleParts.upperLeadingPart" class="upper">
            {{ titleParts.upperLeadingPart }}
          </span>
          <template
            v-for="(segment, segmentIndex) in titleParts.brandSegments"
            :key="`problem-solving-title-${segmentIndex}`"
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
          class="subtitle-under-xs mx-auto mt-4 max-w-[620px] text-sm leading-6 text-text-secondary md:text-base md:leading-7"
        >
          {{ sectionSubtitle }}
        </p>
      </div>

      <div
        v-if="cards.length"
        class="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        <ProblemSolvingCard
          v-for="(card, index) in cards"
          :key="card.id"
          :item="card"
          :index="index"
        />
      </div>

      <div
        v-else
        class="mt-10 rounded-[20px] border border-dashed border-border-default bg-surface p-6 text-center text-sm text-text-secondary"
      >
        პრობლემების ბარათები ჯერ არ არის დამატებული.
      </div>
    </div>
  </section>
</template>
