<script setup lang="ts">
import { ArrowPathIcon, InformationCircleIcon } from "@heroicons/vue/24/outline";
import { businessPreset, businessToday, reportDate, reportNumber, type BusinessPeriod } from "~/utils/businessReport";
import { analyticsHasData, analyticsInsight, analyticsSource } from "~/utils/businessAnalytics";

const route = useRoute();
const { report, loading, errorMessage, load } = useBusinessAnalytics();
const readPeriod = (): BusinessPeriod => typeof route.query.start === "string" && typeof route.query.end === "string"
  ? { start: route.query.start, end: route.query.end } : businessPreset("month");
const initial = readPeriod();
const start = ref(initial.start), end = ref(initial.end), dateError = ref("");
const today = businessToday();
const hasData = computed(() => analyticsHasData(report.value));
const insight = computed(() => analyticsInsight(report.value));
const updated = computed(() => report.value?.fetched_at ? new Intl.DateTimeFormat("ka-GE", { timeZone: "Asia/Tbilisi", dateStyle: "short", timeStyle: "short" }).format(new Date(report.value.fetched_at)) : "");
const hasChart = computed(() => report.value?.daily?.some((day) => day.sessions || day.users));
const scrollClass = "[scrollbar-width:thin] [scrollbar-color:var(--accent-primary)_transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-surface [&::-webkit-scrollbar-thumb]:bg-accent-primary [&::-webkit-scrollbar-thumb:hover]:bg-accent-hover [&::-webkit-scrollbar-button]:hidden";
const metrics = computed(() => [
  { label: "ვიზიტები", value: report.value?.summary?.sessions, note: "საიტზე ვიზიტები; ერთ ადამიანს რამდენიმე ვიზიტი შეიძლება ჰქონდეს." },
  { label: "მომხმარებლები", value: report.value?.summary?.totalUsers, note: "Google-ის მიერ აღრიცხული მომხმარებლები; მაღაზიაში რეგისტრირებულთა რაოდენობა არ არის." },
  { label: "ძიების შედეგების ნახვა", value: report.value?.search?.total, note: "წარმატებით ჩატვირთული ძიების შედეგების ნახვები, განმეორებითი ნახვების ჩათვლით." },
  { label: "უშედეგო ძიების ნახვა", value: report.value?.search?.no_results, note: "შედეგების ნახვები, რომლებშიც ვერცერთი პროდუქტი მოიძებნა." },
]);
const applyPeriod = async (period = { start: start.value, end: end.value }) => {
  if (!period.start || !period.end || period.start > period.end || period.end > today) {
    dateError.value = "აირჩიეთ სწორი თარიღები, დღევანდელ დღემდე."; return;
  }
  dateError.value = ""; start.value = period.start; end.value = period.end;
  if (route.query.start === period.start && route.query.end === period.end) await load(period);
  else await navigateTo({ path: route.path, query: period }, { replace: true });
};
onMounted(() => load(readPeriod()));
watch(() => [route.query.start, route.query.end], () => {
  const period = readPeriod(); start.value = period.start; end.value = period.end; void load(period);
});
</script>

<template>
  <section aria-labelledby="business-page-title" :aria-busy="loading">
    <div class="mb-6">
      <p class="mb-2 text-[11px] font-bold leading-[18px] text-accent-primary">FLEXDRIVE · მომხმარებლები</p>
      <h1 id="business-page-title" class="text-[28px] font-extrabold leading-9 min-[1440px]:text-4xl min-[1440px]:leading-[44px]">მომხმარებლები და ძებნა</h1>
      <p class="mt-2 text-[13px] leading-5 text-text-muted">რამდენი ადამიანი სტუმრობს საიტს, საიდან მოდის და რას ეძებს.</p>
    </div>
    <form class="rounded-xl border border-border-default bg-surface p-4 md:p-5" @submit.prevent="applyPeriod()">
      <div class="flex flex-wrap items-end gap-3">
        <label class="flex min-w-0 flex-1 flex-col gap-2 text-xs font-semibold text-text-secondary md:flex-none">საწყისი თარიღი<input v-model="start" type="date" :max="today" required class="min-h-[44px] min-w-0 rounded-lg border border-border-default bg-bg-primary px-3 py-2 text-sm text-text-primary [color-scheme:light] dark:[color-scheme:dark]"></label>
        <label class="flex min-w-0 flex-1 flex-col gap-2 text-xs font-semibold text-text-secondary md:flex-none">საბოლოო თარიღი<input v-model="end" type="date" :max="today" required class="min-h-[44px] min-w-0 rounded-lg border border-border-default bg-bg-primary px-3 py-2 text-sm text-text-primary [color-scheme:light] dark:[color-scheme:dark]"></label>
        <BaseButton type="submit" :disabled="loading">ჩვენება</BaseButton>
        <button type="button" :disabled="loading" class="inline-flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-2 disabled:opacity-50" aria-label="მონაცემების განახლება" @click="applyPeriod()"><ArrowPathIcon class="h-5 w-5" :class="{ 'animate-spin': loading }" aria-hidden="true" /></button>
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        <button v-for="preset in [{ key: 'month', label: 'მიმდინარე თვე' }, { key: 'previous', label: 'წინა თვე' }, { key: '30days', label: 'ბოლო 30 დღე' }] as const" :key="preset.key" type="button" :disabled="loading" class="min-h-[44px] rounded-lg border border-border-default px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-2 disabled:opacity-50" @click="applyPeriod(businessPreset(preset.key))">{{ preset.label }}</button>
      </div>
      <p v-if="dateError" role="alert" class="mt-3 text-xs text-error">{{ dateError }}</p>
    </form>
    <p v-if="loading" role="status" class="py-10 text-center text-sm text-text-muted">Google-ის მონაცემები იტვირთება…</p>
    <p v-else-if="errorMessage" role="alert" class="mt-5 rounded-xl border border-border-default bg-surface p-5 text-sm text-error">{{ errorMessage }}</p>
    <template v-else-if="report">
      <div class="my-5 flex flex-wrap items-center justify-between gap-2 text-[11px] leading-5 text-text-muted">
        <p>წყარო: Google Analytics · მხოლოდ <span class="font-semibold text-text-secondary">{{ report.hostname }}</span></p>
        <p v-if="updated">Google-დან მიღებულია: {{ updated }} · თბილისის დრო</p>
      </div>
      <p v-if="report.message" role="status" class="mb-5 rounded-xl border border-border-default bg-surface p-5 text-sm leading-6 text-text-secondary">{{ report.message }}</p>
      <template v-if="hasData">
        <p class="text-xs leading-5 text-text-muted">პერიოდი: {{ reportDate(report.period.start) }} — {{ reportDate(report.period.end) }} · Google-ის ანგარიშის დროის სარტყელი: {{ report.report_timezone || 'მიუთითებელი' }}</p>
        <p class="mt-2 text-[11px] leading-5 text-text-muted">განახლებისას ახალი პასუხი მოითხოვება, თუ ბოლო წამოღებიდან 5 წუთი გავიდა. დღევანდელი მონაცემები შეიძლება დაგვიანებით დაემატოს; ეს რეალურ დროში ანგარიში არ არის.</p>
        <p v-for="warning in report.warnings" :key="warning" class="mt-3 rounded-lg border border-border-default bg-surface p-3 text-xs leading-5 text-text-secondary">{{ warning }}</p>
        <div class="my-6 grid grid-cols-2 border-y border-border-default md:grid-cols-4 md:py-6" aria-label="ძირითადი მაჩვენებლები">
          <article v-for="metric in metrics" :key="metric.label" class="border-b border-r border-border-default px-3.5 py-5 even:border-r-0 [&:nth-last-child(-n+2)]:border-b-0 md:border-b-0 md:px-5 md:py-0 md:first:pl-0 md:even:border-r md:last:border-r-0 md:last:pr-0">
            <h2 class="text-[13px] font-semibold leading-5 text-text-secondary">{{ metric.label }}</h2>
            <p class="mt-3 break-words text-2xl font-bold leading-8 tabular-nums text-text-primary min-[1440px]:text-[30px]">{{ reportNumber(metric.value) }}</p>
            <p class="mt-3 text-[11px] leading-5 text-text-muted">{{ metric.note }}</p>
          </article>
        </div>
        <section class="mb-6 rounded-xl border border-border-default bg-surface p-5 md:p-6" aria-labelledby="audience-analysis-title">
          <h2 id="audience-analysis-title" class="flex items-center gap-2 text-base font-bold"><InformationCircleIcon class="h-5 w-5 shrink-0 text-accent-primary" aria-hidden="true" /> მომხმარებლების მოკლე ანალიზი</h2>
          <p class="mt-3 text-sm leading-7 text-text-secondary">{{ insight }}</p>
          <p class="mt-3 text-[11px] leading-5 text-text-muted">არჩეული პერიოდის ავტომატური შეჯამება. ეფუძნება Google-ის მიღებულ მონაცემებს.</p>
        </section>
        <section class="mb-6 overflow-hidden rounded-xl border border-border-default bg-surface" aria-labelledby="audience-chart-title">
          <div class="p-5 pb-2"><h2 id="audience-chart-title" class="text-base font-bold">ვიზიტები და მომხმარებლები დღეების მიხედვით</h2><p class="mt-2 text-xs leading-5 text-text-muted">დღიური მომხმარებლები არ ჯამდება პერიოდის უნიკალურ მომხმარებლებად: ერთი ადამიანი რამდენიმე დღეს შეიძლება გვესტუმროს.</p></div>
          <ClientOnly v-if="hasChart"><LazyBusinessAudienceChart :daily="report.daily || []" /></ClientOnly>
          <p v-else class="py-10 text-center text-sm text-text-muted">არჩეული პერიოდის გრაფიკისთვის მონაცემები არ არის.</p>
          <details class="p-5 pt-3"><summary class="cursor-pointer text-xs font-semibold text-text-secondary">დღიური მონაცემების ნახვა ცხრილში</summary><div class="mt-4 max-h-[320px] overflow-auto rounded-lg" :class="scrollClass"><table class="w-full text-left text-xs"><thead class="sticky top-0 bg-surface-2 text-text-secondary"><tr><th class="p-3">თარიღი</th><th class="p-3 text-right">ვიზიტები</th><th class="p-3 text-right">მომხმარებლები</th></tr></thead><tbody><tr v-for="day in report.daily" :key="day.date" class="border-t border-border-default"><td class="p-3">{{ reportDate(day.date) }}</td><td class="p-3 text-right tabular-nums">{{ reportNumber(day.sessions) }}</td><td class="p-3 text-right tabular-nums">{{ reportNumber(day.users) }}</td></tr></tbody></table></div></details>
        </section>
        <section class="mb-6 overflow-hidden rounded-xl border border-border-default bg-surface" aria-labelledby="audience-sources-title">
          <div class="p-5"><h2 id="audience-sources-title" class="text-base font-bold">საიდან მოდიან მომხმარებლები</h2><p class="mt-2 text-xs leading-5 text-text-muted">პირველი 20 წყარო ვიზიტების რაოდენობით · სულ {{ reportNumber(report.source_row_count) }} წყარო. წყაროსთან წერია შემოსვლის ტიპიც: organic — საძიებო სისტემა, referral — სხვა საიტის ბმული, cpc — ფასიანი რეკლამა.</p></div>
          <div v-if="report.sources?.length" class="overflow-auto" :class="scrollClass"><table class="w-full text-left text-xs"><thead class="bg-surface-2 text-text-secondary"><tr><th class="p-3 pl-5">შემოსვლის წყარო / ტიპი</th><th class="p-3 text-right">ვიზიტები</th><th class="p-3 pr-5 text-right">ჩართული ვიზიტები</th></tr></thead><tbody><tr v-for="source in report.sources" :key="source.source" class="border-t border-border-default"><td class="min-w-[200px] p-3 pl-5 font-semibold">{{ analyticsSource(source.source) }}</td><td class="p-3 text-right tabular-nums">{{ reportNumber(source.sessions) }}</td><td class="p-3 pr-5 text-right tabular-nums">{{ reportNumber(source.engaged_sessions) }}</td></tr></tbody></table></div>
          <p v-else class="px-5 pb-8 text-sm text-text-muted">არჩეულ პერიოდში შემოსვლის წყაროები არ არის.</p>
          <p class="border-t border-border-default p-5 text-[11px] leading-5 text-text-muted">ჩართული ვიზიტი Google-ში ნიშნავს საკმარისი ხანგრძლივობის, მინიმუმ ორი გვერდის ნახვის ან მნიშვნელოვანი მოვლენის მქონე ვიზიტს. ეს შეძენას თავისთავად არ ნიშნავს.</p>
        </section>
        <section class="overflow-hidden rounded-xl border border-border-default bg-surface" aria-labelledby="audience-search-title">
          <div class="p-5"><h2 id="audience-search-title" class="text-base font-bold">რას ეძებენ მომხმარებლები</h2><p class="mt-2 text-xs leading-5 text-text-muted">პირველი 30 ჩანაწერი შედეგების ნახვის სიხშირით. უშედეგო ძიება ცალკე მონიშნულია; იგივე ტექსტი შეიძლება სხვადასხვა შედეგით გამოჩნდეს.</p></div>
          <p v-if="report.search?.status !== 'ready'" class="px-5 pb-8 text-sm leading-6 text-text-muted">{{ report.search?.message || 'ძიების მონაცემები დროებით მიუწვდომელია.' }}</p>
          <div v-else-if="report.search.terms.length" class="overflow-auto" :class="scrollClass"><table class="w-full text-left text-xs"><thead class="bg-surface-2 text-text-secondary"><tr><th class="p-3 pl-5">საძიებო სიტყვა</th><th class="p-3">შედეგი</th><th class="p-3 text-right">ნახვები</th><th class="p-3 pr-5 text-right">ნაპოვნი პროდუქტები საშუალოდ</th></tr></thead><tbody><tr v-for="term in report.search.terms" :key="`${term.term}:${term.outcome}`" class="border-t border-border-default"><td class="min-w-[200px] max-w-[350px] break-words p-3 pl-5 font-semibold">{{ term.term === '(not set)' ? 'სიტყვა მიუთითებელია' : term.term }}</td><td class="min-w-[160px] p-3" :class="term.outcome === 'no_results' ? 'text-error' : 'text-text-secondary'">{{ term.outcome === 'no_results' ? 'პროდუქტი ვერ მოიძებნა' : 'პროდუქტი მოიძებნა' }}</td><td class="p-3 text-right tabular-nums">{{ reportNumber(term.count) }}</td><td class="p-3 pr-5 text-right tabular-nums">{{ reportNumber(Math.round(term.average_results * 10) / 10) }}</td></tr></tbody></table></div>
          <p v-else class="px-5 pb-8 text-sm text-text-muted">არჩეულ პერიოდში ახალი წესით აღრიცხული ძიების შედეგები არ არის.</p>
          <p class="border-t border-border-default p-5 text-[11px] leading-5 text-text-muted">ითვლება მხოლოდ ახალი წესით აღრიცხული ძიების შედეგების ნახვა (search, ვერსია 2). Google-ის ავტომატური ძიების მოვლენა და შეთავაზებაზე დაწკაპუნება ამ რიცხვებს არ ემატება. დათვლა სრულდება ძიების პასუხის მიხედვით, ფილტრების გათვალისწინებით.</p>
        </section>
        <p class="mt-5 text-[11px] leading-5 text-text-muted">Google Analytics აღწერს მის მიერ აღრიცხულ აქტივობას. თანხმობა, ბრაუზერის შეზღუდვები და Google-ის დამუშავება შეიძლება გავლენას ახდენდეს დაფარვაზე. გაყიდვებისა და ფინანსების ზუსტი თანხები ცალკე სექციებში, ჩვენს ბაზაში დადასტურებული გადახდებიდან მოდის.</p>
      </template>
    </template>
  </section>
</template>
