<script setup lang="ts">
const props = defineProps<{ tabs: readonly { key: string; label: string }[]; selected: string; path?: string }>();
const route = useRoute();
</script>
<template>
  <nav class="my-5 flex flex-wrap gap-2" aria-label="ანგარიშის განყოფილებები">
    <NuxtLink v-for="tab in props.tabs" :key="tab.key" :to="{ path: props.path || route.path, query: { ...route.query, tab: tab.key } }" class="inline-flex min-h-[44px] items-center rounded-lg border px-4 py-2 text-xs font-semibold" :class="selected === tab.key ? 'border-accent-primary bg-accent-soft text-accent-primary' : 'border-border-default text-text-secondary hover:bg-surface-2'" :aria-current="selected === tab.key ? 'page' : undefined">{{ tab.label }}</NuxtLink>
  </nav>
</template>
