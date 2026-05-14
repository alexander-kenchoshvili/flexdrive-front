<script setup lang="ts">
import LegalPageLayout from "~/components/common/LegalPageLayout.vue";
import { sanitizeText } from "~/composables/helpers";
import {
  getLegalPageSections,
  type LegalPageData,
  type LegalSectionIconName,
} from "~/composables/useLegalPageSections";

type LegalPageIconSet = "delivery" | "payment" | "privacy" | "returns" | "terms";

const legalPageIconSets: Record<LegalPageIconSet, LegalSectionIconName[]> = {
  delivery: ["clipboard", "truck", "map", "document", "exclamation", "chat"],
  payment: ["banknotes", "banknotes", "card", "check", "exclamation", "refund"],
  privacy: ["lock", "eye", "share", "clock", "shield", "chat"],
  returns: ["document", "clock", "exclamation", "archive", "refund", "chat"],
  terms: ["user", "tag", "clipboard", "banknotes", "truck", "refund", "shield"],
};

const props = defineProps<{
  data?: LegalPageData;
  defaultTitle: string;
  anchorPrefix: string;
  iconSet: LegalPageIconSet;
  navLabel: string;
  emptyText: string;
}>();

const title = computed(
  () => sanitizeText(props.data?.title) || props.defaultTitle,
);
const subtitle = computed(() => sanitizeText(props.data?.subtitle));
const sections = computed(() =>
  getLegalPageSections(
    props.data?.contentData?.list,
    props.anchorPrefix,
    legalPageIconSets[props.iconSet],
  ),
);
const updatedAt = computed(() => props.data?.updated_at);
const breadcrumbItems = computed(() => [
  { label: "მთავარი", to: "/" },
  { label: title.value },
]);
</script>

<template>
  <LegalPageLayout
    :title="title"
    :subtitle="subtitle"
    :updated-at="updatedAt"
    :sections="sections"
    :breadcrumb-items="breadcrumbItems"
    :nav-label="navLabel"
    :empty-text="emptyText"
  />
</template>
