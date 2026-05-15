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

const description = computed(
  () =>
    `${authorName.value} აქვეყნებს პრაქტიკულ სტატიებს ავტომობილის მოვლის, ავტონაწილების შერჩევისა და ონლაინ შეძენის შესახებ.`,
);
</script>

<template>
  <section
    class="rounded-lg border border-border-default bg-surface-2 p-4 sm:p-5"
  >
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
      <div
        class="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-accent-primary/25 bg-accent-primary/10 text-[22px] font-extrabold text-accent-primary md:h-16 md:w-16 md:text-[26px]"
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
        <p class="mt-2 max-w-3xl text-sm leading-6 text-text-secondary md:text-[15px] md:leading-7">
          {{ description }}
        </p>
      </div>
    </div>
  </section>
</template>
