<script setup lang="ts">
import { ChevronRightIcon } from "@heroicons/vue/24/outline";

type BreadcrumbItem = {
  label: string;
  to?: string;
};

const props = defineProps<{
  items: BreadcrumbItem[];
}>();
</script>

<template>
  <nav
    v-if="items.length"
    aria-label="Breadcrumb"
    class="flex flex-wrap items-center gap-2 text-sm text-text-secondary"
  >
    <template v-for="(item, index) in items" :key="`${item.label}-${index}`">
      <NuxtLink
        v-if="item.to && index < items.length - 1"
        :to="item.to"
        class="transition-colors duration-200 hover:text-accent-primary"
      >
        {{ item.label }}
      </NuxtLink>

      <span
        v-else
        :class="index === items.length - 1 ? 'text-text-primary' : ''"
      >
        {{ item.label }}
      </span>

      <ChevronRightIcon
        v-if="index < items.length - 1"
        class="h-4 w-4 shrink-0 text-text-muted"
        aria-hidden="true"
      />
    </template>
  </nav>
</template>
