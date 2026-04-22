<script setup lang="ts">
import { AdjustmentsHorizontalIcon } from "@heroicons/vue/24/outline";

const props = withDefaults(
  defineProps<{
    resultCount?: number;
    hasActiveFilters?: boolean;
    disabled?: boolean;
  }>(),
  {
    resultCount: 0,
    hasActiveFilters: false,
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: "open-filters"): void;
}>();
</script>

<template>
  <div
    class="rounded-[20px] p-0 xs:border border-border-default bg-surface xs:p-3 sm:p-4"
  >
    <div
      class="flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between"
    >
      <button
        type="button"
        class="relative inline-flex min-h-[46px] items-center gap-2 rounded-[16px] border px-4 py-3 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60"
        :class="
          hasActiveFilters
            ? 'border-accent-primary/45 bg-accent-primary/10 text-accent-primary'
            : 'border-border-default bg-surface-2/70 text-text-primary hover:border-accent-primary hover:text-accent-primary'
        "
        :disabled="disabled"
        @click="emit('open-filters')"
      >
        <AdjustmentsHorizontalIcon class="h-5 w-5" aria-hidden="true" />
        <span>ფილტრი და დალაგება</span>
        <span
          v-if="hasActiveFilters"
          class="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-surface bg-accent-primary"
          aria-hidden="true"
        />
      </button>

      <p class="hidden xs:block text-sm text-text-secondary">
        ნაპოვნია
        <span class="font-semibold text-text-primary">{{
          props.resultCount
        }}</span>
        პროდუქტი
      </p>
    </div>
  </div>
</template>
