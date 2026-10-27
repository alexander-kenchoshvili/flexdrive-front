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
const normalizeLabel = (value: string) =>
  value.normalize("NFKC").toLowerCase().replace(/[-\s–—−‑]/gu, "");
const additionalNotes = (fitment: CatalogProductFitment) => {
  const notes = sanitizeText(fitment.notes);
  if (!notes) return "";
  const models = [fitment.model.name, `${fitment.make.name} ${fitment.model.name}`];
  const shortYear = (year: number) => String(year).slice(-2);
  const shortYears = fitment.year_from === fitment.year_to
    ? shortYear(fitment.year_from)
    : `${shortYear(fitment.year_from)}-${shortYear(fitment.year_to)}`;
  const years = [yearLabel(fitment), shortYears];
  const repeatedLabels = [...models, ...years, ...models.flatMap((model) => years.map((year) => `${model} ${year}`))];
  return repeatedLabels.some((label) => normalizeLabel(label) === normalizeLabel(notes)) ? "" : notes;
};
</script>

<template>
  <section v-if="universal || entries.length" aria-labelledby="product-fitments-title" class="min-w-0">
    <h2 id="product-fitments-title" class="text-sm font-bold text-text-primary">
      თავსებადობა
    </h2>

    <p v-if="universal" class="mt-2 text-sm text-text-secondary">უნივერსალური ნაწილი</p>

    <div v-else class="mt-2 overflow-hidden rounded-[14px] border border-border-default">
      <table class="w-full table-fixed text-left text-sm">
        <thead class="bg-surface-2 text-xs text-text-muted">
          <tr>
            <th scope="col" class="w-[132px] px-2 py-2 font-medium sm:w-[160px] sm:px-3">მანქანა</th>
            <th scope="col" class="px-2 py-2 font-medium sm:px-3">წლები</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border-default">
          <tr v-for="fitment in entries" :key="fitment.id">
            <td class="px-2 py-2.5 align-top [overflow-wrap:anywhere] sm:px-3">
              <span class="font-semibold text-text-primary">
                {{ sanitizeText(fitment.make.name) }} {{ sanitizeText(fitment.model.name) }}
              </span>
              <span v-if="fitment.engine" class="mt-1 block text-xs leading-5 text-text-secondary">
                ძრავი: {{ sanitizeText(fitment.engine.name) }}
              </span>
              <span v-if="additionalNotes(fitment)" class="mt-1 block text-xs leading-5 text-text-secondary">
                {{ additionalNotes(fitment) }}
              </span>
            </td>
            <td class="px-2 py-2.5 align-top font-semibold tabular-nums text-text-primary [overflow-wrap:anywhere] sm:px-3">
              {{ yearLabel(fitment) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
