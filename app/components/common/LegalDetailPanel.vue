<script setup lang="ts">
import BaseRichText from "~/components/common/BaseRichText.vue";
import LegalSectionIcon from "~/components/common/LegalSectionIcon.vue";
import type { LegalSectionIconName } from "~/composables/useLegalPageSections";

const props = withDefaults(
  defineProps<{
    sectionId: string;
    index: number;
    title: string;
    summary?: string;
    iconName: LegalSectionIconName;
    html?: string;
    variant?: "base" | "subtle";
  }>(),
  {
    summary: "",
    html: "",
    variant: "base",
  },
);

const surfaceClass = computed(() =>
  props.variant === "subtle" ? "bg-surface-2/70" : "bg-surface",
);
</script>

<template>
  <article
    :id="sectionId"
    class="scroll-mt-28 rounded-xl border border-border-default p-4 shadow-[0_18px_48px_-42px_var(--shadow-color)] sm:p-5 lg:p-6"
    :class="surfaceClass"
  >
    <div
      class="grid gap-4 lg:grid-cols-[minmax(280px,0.38fr)_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[320px_minmax(0,1fr)]"
    >
      <div class="min-w-0 lg:sticky lg:top-28 lg:self-start">
        <div class="flex items-center gap-2">
          <span
            class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-primary text-xs font-extrabold text-text-invert"
          >
            {{ String(index).padStart(2, "0") }}
          </span>

          <span
            class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-default bg-surface text-accent-primary"
          >
            <LegalSectionIcon :name="iconName" class="h-4 w-4" />
          </span>
        </div>

        <h2
          class="upper mt-3 break-words text-lg font-extrabold leading-6 text-text-primary sm:text-xl sm:leading-7"
        >
          {{ title }}
        </h2>

        <p
          v-if="summary"
          class="mt-2 break-words text-sm leading-6 text-text-secondary"
        >
          {{ summary }}
        </p>
      </div>

      <div class="min-w-0 border-t border-border-default pt-4 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
        <BaseRichText :html="html" />
      </div>
    </div>
  </article>
</template>
