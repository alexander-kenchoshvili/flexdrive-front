<script setup lang="ts">
import { ChevronRightIcon } from "@heroicons/vue/24/outline";
import LegalSectionIcon from "~/components/common/LegalSectionIcon.vue";
import type { LegalSectionIconName } from "~/composables/useLegalPageSections";

const props = defineProps<{
  href: string;
  index: number;
  title: string;
  summary?: string;
  iconName: LegalSectionIconName;
}>();

const emit = defineEmits<{
  navigate: [event: MouseEvent];
}>();
</script>

<template>
  <a
    :href="href"
    class="group flex h-full min-h-[76px] items-start gap-3 rounded-lg border border-border-default bg-surface-2 px-3 py-3 text-left transition-colors duration-200 hover:border-accent-primary/60 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary sm:px-4 sm:py-4"
    @click="emit('navigate', $event)"
  >
    <span
      class="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-default bg-surface text-xs font-extrabold text-text-primary"
    >
      {{ String(props.index).padStart(2, "0") }}
    </span>

    <span class="min-w-0 flex-1">
      <span
        class="block break-words text-sm font-bold leading-5 text-text-primary transition-colors duration-200 group-hover:text-accent-primary"
      >
        {{ title }}
      </span>

      <span
        v-if="summary"
        class="mt-1 block break-words text-xs leading-5 text-text-secondary sm:text-[13px]"
      >
        {{ summary }}
      </span>
    </span>

    <span
      class="hidden h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border-default bg-surface text-accent-primary transition-colors duration-200 group-hover:border-accent-primary/35 group-hover:bg-accent-soft sm:inline-flex"
    >
      <LegalSectionIcon :name="iconName" class="h-5 w-5" />
    </span>

    <span class="mt-1 inline-flex shrink-0 text-text-muted">
      <ChevronRightIcon
        class="h-4 w-4 transition-colors duration-200 group-hover:text-accent-primary"
        aria-hidden="true"
      />
    </span>
  </a>
</template>
