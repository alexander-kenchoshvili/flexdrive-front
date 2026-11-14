<script setup lang="ts">
import type { BusinessPeriod } from "~/utils/businessReport";
import { reportDate, reportNumber } from "~/utils/businessReport";
import { searchConsoleHasData, searchConsoleInsight, searchMetric, searchChange, type SearchMetrics } from "~/utils/businessSearchConsole";
import { metaUpdated } from "~/utils/businessMarketing";

const props = defineProps<{ period: BusinessPeriod; compact?: boolean }>();
const { report, loading, errorMessage, load } = useBusinessSearchConsole();
onMounted(() => load(props.period));
watch(() => [props.period.start, props.period.end], () => load(props.period));
const hasData = computed(() => searchConsoleHasData(report.value));
const insight = computed(() => searchConsoleInsight(report.value));
const comparable = computed(() => hasData.value && report.value?.status !== "stale" && report.value?.previous?.status === "ready");
const cards: { key: keyof SearchMetrics; label: string; note: string }[] = [
  { key: "impressions", label: "Google-ში გამოჩენები", note: "რამდენჯერ გამოჩნდა საიტის ბმული ძიების შედეგებში; ეს უნიკალური ადამიანების რაოდენობა არ არის." },
  { key: "clicks", label: "ძიებიდან დაწკაპუნებები", note: "რამდენჯერ დააჭირეს ჩვენს ბმულს Google-ის ძიებაში. ეს Analytics-ის ვიზიტებისგან განსხვავებული მაჩვენებელია." },
  { key: "ctr", label: "დაწკაპუნების წილი", note: "გამოჩენების რამდენ პროცენტს მოჰყვა დაწკაპუნება. მაგალითად, 2% ნიშნავს 2 დაწკაპუნებას 100 გამოჩენაზე." },
  { key: "position", label: "საშუალო პოზიცია", note: "რა ადგილას ჩანდა ჩვენი საუკეთესო შედეგი საშუალოდ. მცირე რიცხვი უკეთესია; ეს ყოველთვის ერთსა და იმავე ადგილს არ ნიშნავს." },
];
const lists = computed(() => [
  { key: "queries", title: "რა სიტყვებით გვპოულობენ Google-ში", column: "საძიებო სიტყვა", block: report.value?.queries },
  { key: "pages", title: "რომელი გვერდები ჩანს Google-ში", column: "გვერდის მისამართი", block: report.value?.pages },
]);
</script>

<template>
  <section id="google-search-results" class="my-6 min-w-0 rounded-xl border border-border-default bg-surface p-4 md:p-6" :aria-busy="loading" aria-label="Google-ის ძიებაში საიტის გამოჩენა">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0"><p class="text-[11px] font-bold text-accent-primary">GOOGLE SEARCH CONSOLE</p><h2 class="mt-2 text-lg font-bold">როგორ გვპოულობენ Google-ში</h2><p class="mt-2 text-xs leading-6 text-text-muted">Google-ის ჩვეულებრივი ძიების შედეგები, რეკლამის გარეშე. ეს ჩვენი საიტის შიგნით გამოყენებული საძიებო ველი არ არის.</p></div>
      <button type="button" :disabled="loading" class="min-h-[44px] rounded-lg border border-border-default px-4 py-2 text-xs font-semibold disabled:opacity-50" @click="load(period)">განახლება</button>
    </div>
    <p v-if="loading" role="status" class="py-6 text-sm text-text-muted">Google-ში გამოჩენის მონაცემები იტვირთება…</p>
    <p v-else-if="errorMessage" role="alert" class="mt-4 text-sm text-error">{{ errorMessage }}</p>
    <template v-else-if="report">
      <p v-if="!hasData" role="status" class="mt-4 text-sm leading-6 text-text-secondary">{{ report.message || 'ანგარიში ჯერ მიუწვდომელია; ეს ნულოვან შედეგს არ ნიშნავს.' }}</p>
      <template v-else-if="report.summary && report.period">
        <div class="mt-4 space-y-1 text-xs leading-6 text-text-muted"><p>ანგარიშის პერიოდი: {{ reportDate(report.period.start) }} — {{ reportDate(report.period.end) }} · დღეები Google-ის წყნარი ოკეანის დროით (PT).</p><p>მიღებულია: {{ metaUpdated(report.fetched_at) }} · თბილისის დრო <strong v-if="report.status === 'stale'" class="text-error">· ძველი პასუხი</strong></p><p>წყარო: flexdrive.ge დომენი, www და მისი სხვა ქვედომენების ჩათვლით.</p></div>
        <p class="mt-3 rounded-lg bg-surface-2 p-3 text-xs leading-6 text-text-muted">ბოლო 3 დღე გამოტოვებულია, რადგან მონაცემებს დამუშავება სჭირდება. ნაჩვენებია მხოლოდ საბოლოოდ დამუშავებული მონაცემები; Google-ს ზოგჯერ მეტი დროც სჭირდება. არჩეული თარიღები შეიძლება ანგარიშის პერიოდს განსხვავდებოდეს.</p>
        <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"><article v-for="card in cards" :key="card.key" class="min-w-0 rounded-lg border border-border-default p-4"><h3 class="text-xs font-semibold leading-5 text-text-secondary">{{ card.label }}</h3><p class="mt-3 break-words text-2xl font-bold tabular-nums">{{ searchMetric(report.summary[card.key], card.key === 'ctr') }}</p><p class="mt-2 text-xs leading-5 text-text-secondary">{{ searchChange(report.summary[card.key], report.previous?.summary?.[card.key], card.key, comparable) }}</p><p class="mt-2 text-xs leading-6 text-text-muted">{{ card.note }}</p></article></div>
        <p v-if="report.previous_period" class="mt-3 text-xs leading-6 text-text-muted">შედარება: {{ reportDate(report.previous_period.start) }} — {{ reportDate(report.previous_period.end) }}. მიმდინარე თვე ედრება წინა თვის შესაბამის ნაწილს; სხვა დიაპაზონი — წინა იმავე რაოდენობის დღეებს.</p>
        <p v-if="report.status === 'partial'" role="status" class="mt-3 text-xs leading-6 text-text-muted">ზოგი დეტალური ანგარიში ან შედარება ვერ დაბრუნდა. მიღებული მონაცემები ქვემოთ ჩანს; მიუწვდომელი ნაწილი ნულით არ იცვლება.</p>
        <p class="mt-4 rounded-lg bg-surface-2 p-4 text-sm leading-7 text-text-secondary">{{ insight }}</p>
        <template v-if="!compact">
          <section class="mt-6" aria-label="Google-იდან დაწკაპუნებები დღეების მიხედვით"><h3 class="font-bold">Google-ის შედეგები დღეების მიხედვით</h3>
            <p v-if="report.daily?.status !== 'ready'" class="mt-3 text-sm text-text-muted">დღიური ანგარიში დროებით მიუწვდომელია.</p>
            <template v-else-if="report.daily.rows?.length"><ClientOnly><LazyBusinessSearchChart :daily="report.daily.rows" /></ClientOnly><details class="mt-3"><summary class="cursor-pointer text-xs font-semibold">დღიური მონაცემები ცხრილში</summary><div class="mt-3 max-h-[320px] overflow-auto [scrollbar-width:thin]"><table class="w-full text-left text-xs"><thead class="sticky top-0 bg-surface-2"><tr><th class="p-3">PT თარიღი</th><th class="p-3 text-right">გამოჩენები</th><th class="p-3 text-right">დაწკაპუნებები</th><th class="p-3 text-right">წილი</th><th class="p-3 text-right">პოზიცია</th></tr></thead><tbody><tr v-for="day in report.daily.rows" :key="day.date" class="border-t border-border-default"><td class="whitespace-nowrap p-3">{{ day.date ? reportDate(day.date) : '—' }}</td><td class="p-3 text-right">{{ reportNumber(day.impressions) }}</td><td class="p-3 text-right">{{ reportNumber(day.clicks) }}</td><td class="p-3 text-right">{{ searchMetric(day.ctr, true) }}</td><td class="p-3 text-right">{{ searchMetric(day.position) }}</td></tr></tbody></table></div></details></template>
            <p v-else class="mt-3 text-sm text-text-muted">ამ პერიოდში დღიური ჩანაწერები ჯერ არ არის.</p>
          </section>
          <section v-for="list in lists" :key="list.key" class="mt-6 min-w-0 rounded-lg border border-border-default p-4"><h3 class="font-bold">{{ list.title }}</h3><p class="mt-2 text-xs leading-6 text-text-muted">პირველი {{ report.row_limit }} ჩანაწერი, დაწკაპუნებების მიხედვით. Google ყველა მოთხოვნას არ აჩვენებს; იშვიათი/დაფარული მოთხოვნები შეიძლება სიაში არ იყოს. ზედა ჯამები ამ ცხრილის შეკრებით არ ითვლება.</p>
            <p v-if="list.block?.status !== 'ready'" class="mt-3 text-sm text-text-muted">ეს დეტალური ანგარიში დროებით მიუწვდომელია.</p>
            <div v-else-if="list.block.rows?.length" class="mt-3 max-h-[420px] overflow-auto [scrollbar-width:thin]"><table class="w-full text-left text-xs"><thead class="sticky top-0 bg-surface-2"><tr><th class="p-3">{{ list.column }}</th><th class="p-3 text-right">გამოჩენები</th><th class="p-3 text-right">დაწკაპუნებები</th><th class="p-3 text-right">წილი</th><th class="p-3 text-right">პოზიცია</th></tr></thead><tbody><tr v-for="row in list.block.rows" :key="row.query || row.page" class="border-t border-border-default"><td class="min-w-[190px] max-w-[360px] break-words p-3 font-semibold"><a v-if="row.page" :href="row.page" target="_blank" rel="noopener noreferrer" class="underline underline-offset-4">{{ row.page }}</a><template v-else>{{ row.query }}</template></td><td class="p-3 text-right tabular-nums">{{ reportNumber(row.impressions) }}</td><td class="p-3 text-right tabular-nums">{{ reportNumber(row.clicks) }}</td><td class="p-3 text-right tabular-nums">{{ searchMetric(row.ctr, true) }}</td><td class="p-3 text-right tabular-nums">{{ searchMetric(row.position) }}</td></tr></tbody></table></div>
            <p v-else class="mt-3 text-sm text-text-muted">ამ პერიოდში Google-ს ჩანაწერები არ დაუბრუნებია.</p>
          </section>
        </template>
        <NuxtLink v-else :to="{ path: '/business/users', query: report.requested_period, hash: '#google-search-results' }" class="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold underline underline-offset-4">საძიებო სიტყვებისა და გვერდების ნახვა</NuxtLink>
        <p class="mt-5 border-t border-border-default pt-4 text-xs leading-6 text-text-muted">Search Console-ის დაწკაპუნება, Analytics-ის ვიზიტი და ჩვენი შეკვეთა სხვადასხვა მაჩვენებელია; ერთმანეთს არ ემატება. ცხრილების შეჯამება მთელ დომენთან ზუსტად შეიძლება არ ემთხვეოდეს. ეს ბლოკი აჩვენებს ძიების შედეგებს; ინდექსაციის შეცდომები და sitemap თავად Search Console-ში მოწმდება.</p>
      </template>
    </template>
  </section>
</template>
