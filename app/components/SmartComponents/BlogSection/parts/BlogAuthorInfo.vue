<script setup lang="ts">
import { sanitizeText } from "~/composables/helpers";

const props = defineProps<{
  name?: string | null;
  role?: string | null;
}>();

const authorName = computed(() => sanitizeText(props.name) || "FlexDrive");
const authorRole = computed(() => sanitizeText(props.role) || "რედაქცია");

const initials = computed(() => {
  const letters = authorName.value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("");

  return letters || "A";
});
</script>

<template>
  <div class="flex min-w-0 items-center gap-3">
    <div
      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff6b35_0%,#ff9b66_100%)] text-sm font-bold text-text-invert"
    >
      {{ initials }}
    </div>

    <div class="min-w-0">
      <p class="truncate text-sm font-semibold text-text-primary">
        {{ authorName }}
      </p>
      <p class="truncate text-xs text-text-muted">
        {{ authorRole }}
      </p>
    </div>
  </div>
</template>
