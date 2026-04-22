<script setup lang="ts">
import { sanitizeText } from "~/composables/helpers";

const props = defineProps<{
  name?: string | null;
  role?: string | null;
}>();

const authorName = computed(() => sanitizeText(props.name) || "AutoMate");
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

const description = computed(
  () =>
    `${authorName.value} არის AutoMate-ის ${authorRole.value.toLowerCase()} და აქვეყნებს პრაქტიკულ სტატიებს ავტომობილის მოვლის, აქსესუარებისა და ყოველდღიური გამოყენების შესახებ.`,
);
</script>

<template>
  <section
    class="rounded-[20px] border border-border-default bg-surface-2 p-5 md:p-6"
  >
    <div class="flex flex-col gap-5 sm:flex-row sm:items-start">
      <div
        class="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff6b35_0%,#ff9b66_100%)] text-[28px] font-extrabold text-text-invert"
      >
        {{ initials }}
      </div>

      <div class="min-w-0">
        <p class="text-xl font-bold text-text-primary">
          {{ authorName }}
        </p>
        <p class="mt-1 text-sm font-medium text-accent-primary">
          {{ authorRole }}
        </p>
        <p class="mt-4 max-w-3xl text-sm leading-7 text-text-secondary md:text-[15px]">
          {{ description }}
        </p>
      </div>
    </div>
  </section>
</template>
