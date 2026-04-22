<script setup lang="ts">
import { CalendarDaysIcon } from "@heroicons/vue/24/outline";
import { formatGeorgianDate } from "~/composables/formatGeorgianDate";

const props = defineProps<{
  publishedAt?: string | null;
}>();

const formattedDate = computed(() => formatGeorgianDate(props.publishedAt));
</script>

<template>
  <div
    v-if="formattedDate"
    class="flex items-center gap-2 text-sm text-text-muted"
  >
    <CalendarDaysIcon
      class="h-4 w-4 shrink-0 text-accent-primary"
      aria-hidden="true"
    />
    <span>{{ formattedDate }}</span>
  </div>
</template>
