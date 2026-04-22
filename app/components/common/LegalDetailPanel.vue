<script setup lang="ts">
import BaseRichText from "~/components/common/BaseRichText.vue";

const props = withDefaults(
  defineProps<{
    sectionId: string;
    index: number;
    title: string;
    summary?: string;
    iconSvg?: string;
    html?: string;
    variant?: "base" | "subtle";
  }>(),
  {
    summary: "",
    iconSvg: "",
    html: "",
    variant: "base",
  },
);

const surfaceClass = computed(() =>
  props.variant === "subtle" ? "bg-surface-2" : "bg-surface",
);
</script>

<template>
  <article
    :id="sectionId"
    class="scroll-mt-40 rounded-[28px] border border-border-default px-5 py-6 shadow-[0_20px_50px_-40px_var(--shadow-color)] md:px-8 md:py-8 lg:px-10 lg:py-10"
    :class="surfaceClass"
  >
    <div class="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
      <div class="lg:sticky lg:top-36 lg:self-start">
        <div class="flex items-center gap-3">
          <span
            class="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full bg-accent-primary text-sm font-bold text-text-invert"
          >
            {{ String(index).padStart(2, "0") }}
          </span>

          <span
            v-if="iconSvg"
            class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border-default bg-surface text-accent-primary"
          >
            <span
              class="block [&>svg]:block [&>svg]:h-5 [&>svg]:w-5"
              v-html="iconSvg"
            />
          </span>
        </div>

        <h2
          class="mt-5 text-[24px] font-extrabold leading-[1.2] text-text-primary"
        >
          {{ title }}
        </h2>

        <p v-if="summary" class="mt-3 text-sm leading-6 text-text-secondary">
          {{ summary }}
        </p>
      </div>

      <div
        class="rounded-[24px] border border-border-default bg-surface px-5 py-5 md:px-7 md:py-7"
      >
        <BaseRichText :html="html" />
      </div>
    </div>
  </article>
</template>
