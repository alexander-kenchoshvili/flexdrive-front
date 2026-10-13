<script setup lang="ts">
import { sanitizeText } from "~/composables/helpers";
import type { CatalogProductFitment } from "~/types/catalog";

const props = defineProps<{
  fitments?: CatalogProductFitment[] | null;
  universal?: boolean;
}>();

const entries = computed(() => props.fitments ?? []);
const yearLabel = (fitment: CatalogProductFitment) =>
  fitment.year_from === fitment.year_to
    ? String(fitment.year_from)
    : `${fitment.year_from}–${fitment.year_to}`;
</script>

<template>
  <section
    v-if="universal || entries.length"
    aria-labelledby="product-fitments-title"
    class="rounded-[24px] border border-border-default bg-surface p-4 shadow-[0_24px_60px_-38px_var(--shadow-color)] md:p-7"
  >
    <h2 id="product-fitments-title" class="text-lg font-bold text-text-primary">
      მანქანასთან შესაბამისობა
    </h2>

    <p v-if="universal" class="mt-4 text-sm leading-7 text-text-secondary">
      უნივერსალური ნაწილი
    </p>

    <ul v-else class="mt-4 space-y-3">
      <li
        v-for="fitment in entries"
        :key="fitment.id"
        class="min-w-0 rounded-[18px] border border-border-default bg-surface-2 p-4"
      >
        <h3 class="break-words text-sm font-bold text-text-primary">
          {{ sanitizeText(fitment.make.name) }} {{ sanitizeText(fitment.model.name) }}
        </h3>
        <dl class="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div class="min-w-0">
            <dt class="text-text-muted">წლები</dt>
            <dd class="mt-1 font-semibold text-text-primary">{{ yearLabel(fitment) }}</dd>
          </div>
          <div v-if="fitment.engine" class="min-w-0">
            <dt class="text-text-muted">ძრავი</dt>
            <dd class="mt-1 break-words font-semibold text-text-primary">
              {{ sanitizeText(fitment.engine.name) }}
            </dd>
          </div>
        </dl>
        <p v-if="sanitizeText(fitment.notes)" class="mt-3 break-words text-sm leading-6 text-text-secondary">
          {{ sanitizeText(fitment.notes) }}
        </p>
      </li>
    </ul>
  </section>
</template>
