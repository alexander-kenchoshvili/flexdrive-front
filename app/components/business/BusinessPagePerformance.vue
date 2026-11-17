<script setup lang="ts">
import type { BusinessPeriod } from "~/utils/businessReport";
import { reportNumber } from "~/utils/businessReport";
import { activeTime, publicPageName } from "~/utils/businessPages";
import { metaUpdated } from "~/utils/businessMarketing";
const props = defineProps<{ period: BusinessPeriod }>();
const { report, loading, errorMessage, load } = useBusinessPages();
onMounted(() => load(props.period));
watch(() => [props.period.start, props.period.end], () => load(props.period));
const ready = computed(() => report.value && ["ready", "stale"].includes(report.value.status));
</script>

<template>
  <section class="my-6 min-w-0 overflow-hidden rounded-xl border border-border-default bg-surface p-4 md:p-6" aria-labelledby="page-performance-title" :aria-busy="loading">
    <div class="flex flex-wrap items-center justify-between gap-3"><h2 id="page-performance-title" class="text-lg font-bold">რომელ გვერდებს ნახულობენ</h2><button type="button" :disabled="loading" class="min-h-[44px] rounded-lg border border-border-default px-4 py-2 text-xs disabled:opacity-50" @click="load(period)">განახლება</button></div>
    <p class="mt-2 text-xs leading-6 text-text-muted">Google-ის პირველი 20 საჯარო გვერდი ნახვების რაოდენობით. მხოლოდ მთავარი, კატალოგის, პროდუქტებისა და შერჩეული საინფორმაციო გვერდები; პირადი შეკვეთების მისამართები არ ჩანს. განმეორებითი ნახვებიც ითვლება.</p>
    <p v-if="loading" role="status" class="py-6 text-sm text-text-muted">გვერდების ანგარიში იტვირთება…</p>
    <p v-else-if="errorMessage" role="alert" class="mt-4 text-sm text-error">{{ errorMessage }}</p>
    <template v-else-if="ready && report">
      <p class="mt-3 text-xs leading-6 text-text-muted">მიღებულია: {{ metaUpdated(report.fetched_at) }} · {{ report.timezone || 'წყაროს დროის სარტყელი უცნობია' }} · სულ {{ reportNumber(report.row_count) }} გვერდი <strong v-if="report.status === 'stale'" class="text-error">· ძველი პასუხი</strong></p>
      <p v-if="report.message" class="mt-2 text-xs leading-6 text-text-muted">{{ report.message }}</p>
      <div v-if="report.rows?.length" class="mt-4 max-h-[480px] overflow-auto [scrollbar-width:thin]">
        <table class="w-full text-left text-xs"><thead class="sticky top-0 bg-surface-2"><tr><th class="p-3">გვერდი</th><th class="p-3 text-right">ნახვები</th><th class="p-3 text-right">მომხმარებლები</th><th class="p-3 text-right">საშ. აქტიური დრო</th></tr></thead>
          <tbody><tr v-for="row in report.rows" :key="row.path" class="border-t border-border-default"><td class="min-w-[180px] max-w-[380px] break-all p-3"><p class="font-semibold">{{ publicPageName(row.path) }}</p><p class="mt-1 text-text-muted">{{ row.path }}</p></td><td class="p-3 text-right tabular-nums">{{ reportNumber(row.views) }}</td><td class="p-3 text-right tabular-nums">{{ reportNumber(row.users) }}</td><td class="whitespace-nowrap p-3 text-right tabular-nums">{{ activeTime(row.average_active_seconds) }}</td></tr></tbody>
        </table>
      </div>
      <p v-else class="py-6 text-sm text-text-muted">ამ პერიოდში საჯარო გვერდების ჩანაწერები არ არის.</p>
      <p v-for="warning in report.warnings" :key="warning" class="mt-3 text-xs leading-6 text-text-muted">{{ warning }}</p>
    </template>
    <p v-else class="mt-4 text-sm leading-6 text-text-muted">{{ report?.message || 'ამ გარემოში გვერდების ანგარიში ჯერ მიუწვდომელია. ეს ნულოვან ნახვებს არ ნიშნავს.' }}</p>
    <p class="mt-4 border-t border-border-default pt-4 text-xs leading-6 text-text-muted">აქტიური დრო ითვლის, რამდენ ხანს იყო გვერდი ეკრანზე აქტიური: ჯამური აქტიური წამები / აქტიური მომხმარებლები. ეს საიტზე ყოფნის სრული დრო არ არის. მომხმარებელი სხვადასხვა გვერდზე შეიძლება განმეორდეს; სტრიქონებს საერთო მომხმარებლებად არ ვაჯამებთ. Google-ის დამუშავებას 24–48 საათი შეიძლება დასჭირდეს.</p>
  </section>
</template>
