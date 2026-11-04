<script setup lang="ts">
import { ChevronDownIcon } from "@heroicons/vue/24/outline";

defineProps<{
  item: { id: number; question: string; answer: string };
  idPrefix: string;
  open: boolean;
}>();
const emit = defineEmits<{ toggle: [trigger: HTMLElement] }>();
</script>

<template>
  <article
    class="min-w-0 rounded-xl border bg-surface transition-colors duration-200"
    :class="open ? 'border-accent-primary/60' : 'border-border-default hover:border-accent-primary/40'"
  >
    <h3>
      <button
        :id="`${idPrefix}-question-${item.id}`"
        type="button"
        :aria-expanded="open"
        :aria-controls="`${idPrefix}-answer-${item.id}`"
        class="group flex min-h-16 w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-bold leading-6 text-text-primary transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary sm:gap-6 sm:px-6 sm:py-5 sm:text-base"
        :class="open ? 'rounded-t-xl' : 'rounded-xl hover:bg-surface-2'"
        @click="emit('toggle', $event.currentTarget as HTMLElement)"
      >
        <span class="upper min-w-0 break-words">{{ item.question }}</span>
        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-default bg-surface-2 text-text-secondary transition-colors duration-200 group-hover:border-accent-primary/40 group-hover:bg-accent-soft group-hover:text-accent-primary">
          <ChevronDownIcon class="faq-arrow h-5 w-5" :class="{ 'faq-arrow-open': open }" aria-hidden="true" />
        </span>
      </button>
    </h3>
    <div
      :id="`${idPrefix}-answer-${item.id}`"
      class="faq-answer"
      :class="{ 'faq-answer-open': open }"
      role="region"
      :aria-labelledby="`${idPrefix}-question-${item.id}`"
      :aria-hidden="!open"
      :inert="!open"
    >
      <div class="min-h-0 overflow-hidden">
        <div class="px-4 pb-5 sm:px-6 sm:pb-6">
          <div class="border-t border-border-default pt-4">
            <p class="whitespace-pre-line break-words text-sm leading-7 text-text-secondary sm:text-[15px]">
              {{ item.answer }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.faq-answer {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 240ms cubic-bezier(0.22, 1, 0.36, 1);
}

.faq-answer-open {
  grid-template-rows: 1fr;
}

.faq-arrow {
  transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
}

.faq-arrow-open {
  transform: rotate(180deg);
}

@media (prefers-reduced-motion: reduce) {
  .faq-answer,
  .faq-arrow {
    transition: none;
  }
}
</style>
