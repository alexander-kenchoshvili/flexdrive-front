<script setup lang="ts">
import { AdjustmentsHorizontalIcon } from "@heroicons/vue/24/outline";

const props = withDefaults(
  defineProps<{
    resultCount?: number;
    vehicleLabel?: string;
    hasActiveFilters?: boolean;
    disabled?: boolean;
  }>(),
  {
    resultCount: 0,
    vehicleLabel: "",
    hasActiveFilters: false,
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: "open-filters"): void;
  (e: "remove-vehicle"): void;
}>();
</script>

<template>
  <div
    class="rounded-[20px] p-0 xs:border border-border-default bg-surface xs:p-3 sm:p-4"
  >
    <button
      v-if="vehicleLabel"
      type="button"
      class="mb-3 flex min-h-11 w-full min-w-0 items-center gap-3 rounded-xl border border-accent-primary/35 bg-accent-primary/10 px-3 py-2 text-left text-xs font-semibold leading-relaxed text-accent-primary transition-colors duration-200 hover:border-accent-primary hover:bg-accent-primary/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
      :disabled="disabled"
      :aria-label="`${vehicleLabel} — მანქანის ფილტრის მოხსნა`"
      @click="emit('remove-vehicle')"
    >
      <span class="min-w-0 flex-1 whitespace-normal [overflow-wrap:anywhere]">{{ vehicleLabel }}</span>
      <span class="shrink-0 text-base leading-none" aria-hidden="true">×</span>
    </button>

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
