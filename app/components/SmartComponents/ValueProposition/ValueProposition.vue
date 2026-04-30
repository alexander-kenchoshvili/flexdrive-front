<script setup lang="ts">
import { sanitizeText, splitBracketAccentSegments } from "~/composables/helpers";
import type { ContentItemData, ImageAsset, SmartComponentData } from "~/types/page";
import ValuePropositionCard, {
  type ValuePropositionIcon,
} from "./parts/ValuePropositionCard.vue";

type ValuePropositionCardItem = {
  id: number;
  title: string;
  description: string;
  position: number;
  icon: ValuePropositionIcon;
  image: ImageAsset | null;
};

type ValuePropositionTitleParts = {
  upperLeadingPart: string;
  brandSegments: ReturnType<typeof splitBracketAccentSegments>;
  upperTrailingPart: string;
};

const props = defineProps<{
  data?: SmartComponentData;
}>();

const iconOrder: ValuePropositionIcon[] = ["time", "payment", "delivery"];
const FLEX_DRIVE_TEXT = "FlexDrive";
const FLEX_DRIVE_ACCENT_SYNTAX = "Flex[[Drive]]";

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

const titleParts = computed<ValuePropositionTitleParts>(() => {
  const text = sectionTitle.value;
  const normalizedText = text.includes("[[")
    ? text
    : text.replace(/FlexDrive/g, FLEX_DRIVE_ACCENT_SYNTAX);
  const brandStartIndex = normalizedText.toLowerCase().indexOf("flex");
  const bracketEndIndex =
    brandStartIndex < 0 ? -1 : normalizedText.indexOf("]]", brandStartIndex);
  const brandEndIndex =
    bracketEndIndex >= 0
      ? bracketEndIndex + 2
      : brandStartIndex + FLEX_DRIVE_TEXT.length;

  return {
    upperLeadingPart:
      brandStartIndex < 0
        ? normalizedText
        : normalizedText.slice(0, brandStartIndex),
    brandSegments:
      brandStartIndex < 0
        ? []
        : splitBracketAccentSegments(
            normalizedText.slice(brandStartIndex, brandEndIndex),
          ),
    upperTrailingPart:
      brandStartIndex < 0 ? "" : normalizedText.slice(brandEndIndex),
  };
});

const cards = computed<ValuePropositionCardItem[]>(() =>
  rawItems.value
    .map((item, index) => ({
      id: toNumber(item.id, index + 1),
      title: sanitizeText(item.title),
      description: sanitizeText(item.description),
      position: toNumber(item.position, index + 1),
      image: item.image,
    }))
    .filter((item) => item.title || item.description)
    .sort((a, b) =>
      a.position === b.position ? a.id - b.id : a.position - b.position,
    )
    .map((item, index) => ({
      ...item,
      icon: iconOrder[index] || "time",
    })),
);
</script>

<template>
  <section
    v-if="cards.length"
    class="border-b border-border-default bg-section-soft py-8 md:py-10 lg:py-12"
  >
    <div class="container-fluid">
      <div class="mx-auto max-w-3xl text-center">
        <h2
          v-if="sectionTitle"
          class="title-under-xs text-[22px] font-extrabold leading-[30px] text-text-primary sm:text-[26px] sm:leading-[34px] md:text-[30px] md:leading-[38px]"
        >
          <span v-if="titleParts.upperLeadingPart" class="upper">
            {{ titleParts.upperLeadingPart }}
          </span>
          <template
            v-for="(segment, index) in titleParts.brandSegments"
            :key="`value-proposition-title-${index}`"
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
          class="subtitle-under-xs mx-auto mt-2 max-w-2xl text-[14px] font-medium leading-[22px] text-text-secondary md:text-[15px] md:leading-6"
        >
          {{ sectionSubtitle }}
        </p>
      </div>

      <div class="mt-5 grid gap-3 md:mt-6 lg:gap-4 xl:grid-cols-3">
        <ValuePropositionCard
          v-for="card in cards"
          :key="card.id"
          :title="card.title"
          :description="card.description"
          :icon="card.icon"
          :image="card.image"
        />
      </div>
    </div>
  </section>
</template>
