<script setup lang="ts">
import type { PageReport, PageRow } from "~/utils/businessPages";
import { activeTime, pageReportReady, publicPageName } from "~/utils/businessPages";
import { reportDate, reportNumber } from "~/utils/businessReport";
import { analyticsSource } from "~/utils/businessAnalytics";
import { metaUpdated } from "~/utils/businessMarketing";
const props = defineProps<{ row: PageRow; report: PageReport | null; loading: boolean; errorMessage: string }>();
defineEmits<{ close: []; refresh: [] }>();
const ready = computed(() => pageReportReady(props.report));
const metrics = computed(() => [
  { label: "მომხმარებლები", value: reportNumber(props.report?.summary?.users) },
  { label: "ვიზიტები", value: reportNumber(props.report?.summary?.sessions) },
  { label: "ნახვები", value: reportNumber(props.report?.summary?.views) },
  { label: "საშ. აქტიური დრო", value: activeTime(props.report?.summary?.average_active_seconds) },
]);
</script>

<template>
  <section id="page-detail" class="my-5 min-w-0 rounded-xl border border-accent-primary/40 bg-surface-2 p-4 md:p-5" aria-labelledby="page-detail-title" :aria-busy="loading">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 flex-1"><p class="text-xs text-text-muted">არჩეული გვერდი · {{ publicPageName(row.path) }}</p><h3 id="page-detail-title" class="mt-1 break-words text-base font-bold">{{ row.title || row.path }}</h3><a :href="row.path" target="_blank" rel="noopener noreferrer" class="mt-2 inline-block max-w-full break-all text-xs text-accent-primary underline underline-offset-4">{{ row.path }} ↗</a></div>
      <div class="flex flex-wrap gap-2"><button type="button" :disabled="loading" class="min-h-[44px] rounded-lg border border-border-default px-3 py-2 text-xs disabled:opacity-50" @click="$emit('refresh')">განახლება</button><button type="button" class="min-h-[44px] rounded-lg border border-border-default px-3 py-2 text-xs" @click="$emit('close')">დახურვა</button></div>
    </div>
    <p v-if="loading" role="status" class="py-6 text-sm text-text-muted">გვერდის დეტალები იტვირთება…</p>
    <p v-else-if="errorMessage" role="alert" class="py-4 text-sm text-error">{{ errorMessage }}</p>
    <template v-else-if="ready && report?.summary">
      <p class="mt-3 text-xs leading-6 text-text-muted">{{ reportDate(report.period.start) }} — {{ reportDate(report.period.end) }} · {{ report.timezone || 'წყაროს დროის სარტყელი უცნობია' }} · მიღებულია: {{ metaUpdated(report.fetched_at) }} <strong v-if="report.status === 'stale'" class="text-error">· ძველი პასუხი</strong></p>
      <p v-if="report.message" class="mt-2 text-xs text-text-muted">{{ report.message }}</p>
      <div class="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4"><div v-for="metric in metrics" :key="metric.label" class="min-w-0 rounded-lg border border-border-default bg-surface p-3"><p class="text-xs text-text-muted">{{ metric.label }}</p><p class="mt-2 break-words text-xl font-bold tabular-nums">{{ metric.value }}</p></div></div>
      <p v-if="report.facebook" class="mt-4 text-sm leading-6"><strong>Facebook-იდან:</strong> {{ reportNumber(report.facebook.users) }} მომხმარებელი · {{ reportNumber(report.facebook.sessions) }} ვიზიტი · {{ reportNumber(report.facebook.views) }} ნახვა.</p>
      <p class="mt-2 text-xs leading-6 text-text-muted">წყარო აღნიშნავს იმ ვიზიტის შემოსვლის წყაროს, რომლის დროსაც ეს გვერდი ნახეს. გვერდი შეიძლება საიტზე შესვლის პირველი გვერდი არ ყოფილიყო. Facebook-ის მაჩვენებელი ყველა მის აღრიცხულ წყაროს ერთად ითვლის; კონკრეტულ პოსტს თავისთავად ვერ გამოყოფს.</p>
      <h4 class="mt-5 text-sm font-bold">საიდან მოვიდნენ ამ გვერდის მომხმარებლები</h4>
      <p class="mt-1 text-xs leading-6 text-text-muted">პირველი {{ report.source_limit || 50 }} წყარო ვიზიტებით · სულ {{ reportNumber(report.source_row_count) }} წყარო. ერთი მომხმარებელი სხვადასხვა წყაროში შეიძლება განმეორდეს; სტრიქონებს საერთო მომხმარებლებად არ ვაჯამებთ.</p>
      <div v-if="report.sources?.length" class="mt-3 max-h-[360px] overflow-auto [scrollbar-width:thin]"><table class="w-full text-left text-xs"><thead class="sticky top-0 bg-surface"><tr><th class="p-3">წყარო / ტიპი</th><th class="p-3 text-right">მომხმარებლები</th><th class="p-3 text-right">ვიზიტები</th><th class="p-3 text-right">ნახვები</th></tr></thead><tbody><tr v-for="source in report.sources" :key="source.source" class="border-t border-border-default"><td class="min-w-[180px] break-words p-3">{{ source.source === '(direct) / (none)' ? 'პირდაპირი / დაუდგენელი წყარო' : analyticsSource(source.source) }}</td><td class="p-3 text-right tabular-nums">{{ reportNumber(source.users) }}</td><td class="p-3 text-right tabular-nums">{{ reportNumber(source.sessions) }}</td><td class="p-3 text-right tabular-nums">{{ reportNumber(source.views) }}</td></tr></tbody></table></div>
      <p v-else class="py-4 text-xs text-text-muted">ამ პერიოდში ამ გვერდისთვის წყაროები არ არის აღრიცხული.</p>
      <h4 class="mt-5 text-sm font-bold">დღეების მიხედვით</h4>
      <div class="mt-3 max-h-[360px] overflow-auto [scrollbar-width:thin]"><table class="w-full text-left text-xs"><thead class="sticky top-0 bg-surface"><tr><th class="p-3">თარიღი</th><th class="p-3 text-right">მომხმარებლები</th><th class="p-3 text-right">ვიზიტები</th><th class="p-3 text-right">ნახვები</th><th class="p-3 text-right">საშ. აქტიური დრო</th></tr></thead><tbody><tr v-for="day in report.daily" :key="day.date" class="border-t border-border-default"><td class="whitespace-nowrap p-3">{{ reportDate(day.date) }}</td><td class="p-3 text-right tabular-nums">{{ reportNumber(day.users) }}</td><td class="p-3 text-right tabular-nums">{{ reportNumber(day.sessions) }}</td><td class="p-3 text-right tabular-nums">{{ reportNumber(day.views) }}</td><td class="whitespace-nowrap p-3 text-right tabular-nums">{{ activeTime(day.average_active_seconds) }}</td></tr></tbody></table></div>
      <p class="mt-3 text-xs leading-6 text-text-muted">დღიური მომხმარებლები არ ჯამდება პერიოდის უნიკალურ მომხმარებლებად. ნახვა და აქტიური დრო სტატიის ბოლომდე წაკითხვას არ ადასტურებს.</p>
      <p v-for="warning in report.warnings" :key="warning" class="mt-3 text-xs leading-6 text-text-muted">{{ warning }}</p>
    </template>
    <p v-else class="py-4 text-sm leading-6 text-text-muted">{{ report?.message || 'გვერდის დეტალები ჯერ მიუწვდომელია. ეს ნულოვან ნახვებს არ ნიშნავს.' }}</p>
  </section>
</template>
