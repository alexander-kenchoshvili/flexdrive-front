<script setup lang="ts">
import { ArrowPathIcon, InformationCircleIcon } from "@heroicons/vue/24/outline";
import { businessPreset, businessToday, reportDate, reportNumber, type BusinessPeriod } from "~/utils/businessReport";
import { marketingInsight, marketingMoney, metaHasData, metaUpdated } from "~/utils/businessMarketing";

const route = useRoute();
const { report, loading, errorMessage, load } = useBusinessMarketing();
const readPeriod = (): BusinessPeriod => typeof route.query.start === "string" && typeof route.query.end === "string"
  ? { start: route.query.start, end: route.query.end } : businessPreset("month");
const initial = readPeriod(), start = ref(initial.start), end = ref(initial.end), dateError = ref("");
const today = businessToday();
const ads = computed(() => report.value?.ads);
const hasAds = computed(() => metaHasData(ads.value) && !!ads.value?.summary);
const hasChart = computed(() => ads.value?.daily?.some((day) => Number(day.spend) || day.impressions || day.clicks));
const insight = computed(() => marketingInsight(report.value));
const money = (value?: string | number | null) => marketingMoney(value, ads.value?.currency);
const adMetrics = computed(() => [
  { label: "რეკლამის ხარჯი", value: money(ads.value?.summary?.spend), note: "Meta-ს მიერ აღრიცხული სარეკლამო ხარჯი ანგარიშის ვალუტაში." },
  { label: "რეკლამის ჩვენებები", value: reportNumber(ads.value?.summary?.impressions), note: "რამდენჯერ გამოჩნდა რეკლამა; განმეორებითი ჩვენებებიც ითვლება." },
  { label: "დაწკაპუნებები", value: reportNumber(ads.value?.summary?.clicks), note: "ყველა დაწკაპუნება რეკლამაზე; მხოლოდ საიტზე გადასვლები არ არის." },
  { label: "რეკლამაზე მიწერილი შეძენები", value: reportNumber(ads.value?.summary?.website_purchases), note: "Meta-ს მიერ ვებსაიტის შეძენად მიჩნეული შედეგები; ჩვენი ბაზის შეკვეთები ცალკეა." },
]);
const adDetails = computed(() => {
  const summary = ads.value?.summary;
  return [
    { label: "მიღწეული ანგარიშები", value: reportNumber(summary?.reach) },
    { label: "დაწკაპუნების წილი", value: summary?.impressions ? `${reportNumber(Math.round(summary.clicks / summary.impressions * 10000) / 100)}%` : "—" },
    { label: "დაწკაპუნების საშუალო ფასი", value: summary?.clicks ? money(Number(summary.spend) / summary.clicks) : "—" },
    { label: "მიწერილი შეძენების თანხა", value: money(summary?.website_purchase_value) },
  ];
});
const social = computed(() => {
  const fb = report.value?.facebook, ig = report.value?.instagram;
  return [
    { key: "facebook", title: "Facebook", name: fb?.profile.name || "FlexDrive • ფლექსდრაივი", profile: fb?.profile, activity: fb?.activity,
      note: "ნახვები და ჩართულობა Meta-ს დღიური ანგარიშებიდანაა. დღის საზღვრები Meta-ს მიერაა განსაზღვრული; თბილისის დროით თავიდან არ ნაწილდება. მაქსიმუმ 90 დღე.",
      metrics: [
        { label: "გამომწერები ახლა", value: metaHasData(fb?.profile) ? fb?.profile.followers : undefined, note: "მიმდინარე რაოდენობა; არჩეული პერიოდის ზრდა არ არის." },
        { label: "კონტენტის ნახვები", value: metaHasData(fb?.activity) ? fb?.activity.views : undefined, note: "არჩეულ პერიოდში; განმეორებითი ნახვების ჩათვლით." },
        { label: "პოსტებზე ჩართულობა", value: metaHasData(fb?.activity) ? fb?.activity.interactions : undefined, note: "Meta-ს მიერ აღრიცხული პოსტებთან ურთიერთქმედებები." },
      ] },
    { key: "instagram", title: "Instagram", name: "@flexdrive.ge", profile: ig?.profile, activity: ig?.activity,
      note: "პერიოდის ანგარიში UTC დღის საზღვრებით; მაქსიმუმ 30 დღე. მიღწეული ანგარიშები მთელი დიაპაზონის მაჩვენებელია და დღიური რიცხვების შეკრებით არ ითვლება.",
      metrics: [
        { label: "გამომწერები ახლა", value: metaHasData(ig?.profile) ? ig?.profile.followers : undefined, note: "მიმდინარე რაოდენობა; არჩეული პერიოდის ზრდა არ არის." },
        { label: "მიღწეული ანგარიშები", value: metaHasData(ig?.activity) ? ig?.activity.reach : undefined, note: "რამდენ ანგარიშამდე მივიდა კონტენტი არჩეულ პერიოდში." },
        { label: "კონტენტის ნახვები", value: metaHasData(ig?.activity) ? ig?.activity.views : undefined, note: "კონტენტის ჩვენება ან დაკვრა, განმეორებების ჩათვლით." },
        { label: "კონტენტზე მოქმედებები", value: metaHasData(ig?.activity) ? ig?.activity.total_interactions : undefined, note: "Meta-ს მიერ აღრიცხული კონტენტთან ურთიერთქმედებები." },
      ] },
  ];
});
const scrollClass = "[scrollbar-width:thin] [scrollbar-color:var(--accent-primary)_transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-surface [&::-webkit-scrollbar-thumb]:bg-accent-primary [&::-webkit-scrollbar-thumb:hover]:bg-accent-hover [&::-webkit-scrollbar-button]:hidden";
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
      <p class="mb-2 text-[11px] font-bold leading-[18px] text-accent-primary">FLEXDRIVE · მარკეტინგი</p>
      <h1 id="business-page-title" class="text-[28px] font-extrabold leading-9 min-[1440px]:text-4xl min-[1440px]:leading-[44px]">მარკეტინგის შედეგები</h1>
      <p class="mt-2 text-[13px] leading-5 text-text-muted">რეკლამის ხარჯი და შედეგები, Facebook-ისა და Instagram-ის აქტივობა.</p>
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
    <p v-if="loading" role="status" class="py-10 text-center text-sm text-text-muted">Meta-ს მონაცემები იტვირთება…</p>
    <p v-else-if="errorMessage" role="alert" class="mt-5 rounded-xl border border-border-default bg-surface p-5 text-sm text-error">{{ errorMessage }}</p>
    <template v-else-if="report">
      <div class="my-5 flex flex-wrap items-center justify-between gap-2 text-[11px] leading-5 text-text-muted"><p>წყარო: Meta · FlexDrive-ის ანგარიშები</p><p>{{ reportDate(report.period.start) }} — {{ reportDate(report.period.end) }}</p></div>
      <p v-if="report.message" role="status" class="mb-5 rounded-xl border border-border-default bg-surface p-5 text-sm leading-6 text-text-secondary">{{ report.message }}</p>
      <template v-if="report.status !== 'not_configured'">
        <section class="mb-6 rounded-xl border border-border-default bg-surface p-5 md:p-6" aria-labelledby="marketing-analysis-title">
          <h2 id="marketing-analysis-title" class="flex items-center gap-2 text-base font-bold"><InformationCircleIcon class="h-5 w-5 shrink-0 text-accent-primary" aria-hidden="true" /> მარკეტინგის მოკლე ანალიზი</h2>
          <p class="mt-3 text-sm leading-7 text-text-secondary">{{ insight }}</p><p class="mt-3 text-[11px] leading-5 text-text-muted">ავტომატური შეჯამება Meta-ს მიღებული მონაცემებით. ნახვა და დაწკაპუნება შეძენას თავისთავად არ ნიშნავს.</p>
        </section>
        <section class="mb-6" aria-labelledby="ad-report-title">
          <h2 id="ad-report-title" class="text-lg font-bold">რეკლამის შედეგები</h2>
          <p v-if="ads?.message" role="status" class="mt-3 rounded-lg border border-border-default bg-surface p-4 text-sm leading-6 text-text-secondary">{{ ads.message }}</p>
          <template v-if="hasAds">
            <p class="mt-2 text-[11px] leading-5 text-text-muted">მიღებულია: {{ metaUpdated(ads?.fetched_at) }} · თბილისის დრო · ანგარიშის ვალუტა: {{ ads?.currency }} · ანგარიშის დროის სარტყელი: {{ ads?.timezone }}</p>
            <div class="my-5 grid grid-cols-2 border-y border-border-default md:grid-cols-4 md:py-6">
              <article v-for="metric in adMetrics" :key="metric.label" class="border-b border-r border-border-default px-3.5 py-5 even:border-r-0 [&:nth-last-child(-n+2)]:border-b-0 md:border-b-0 md:px-5 md:py-0 md:first:pl-0 md:even:border-r md:last:border-r-0 md:last:pr-0"><h3 class="text-[13px] font-semibold leading-5 text-text-secondary">{{ metric.label }}</h3><p class="mt-3 break-words text-2xl font-bold leading-8 tabular-nums min-[1440px]:text-[30px]">{{ metric.value }}</p><p class="mt-3 text-[11px] leading-5 text-text-muted">{{ metric.note }}</p></article>
            </div>
            <div class="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4"><div v-for="metric in adDetails" :key="metric.label" class="rounded-lg border border-border-default bg-surface p-4"><h3 class="text-xs leading-5 text-text-muted">{{ metric.label }}</h3><p class="mt-2 break-words text-lg font-bold tabular-nums">{{ metric.value }}</p></div></div>
            <p class="mb-5 text-[11px] leading-5 text-text-muted">შეძენა რეკლამას მიეწერება დაწკაპუნებიდან 7 დღეში ან ნახვიდან 1 დღეში; არჩეული პერიოდი შეძენის თარიღით ითვლება. Meta-ს მიერ მიწერილი შეძენები და თანხები ჩვენს გაყიდვებს არ ემატება. შეიძლება შეფასებით დათვლილი შედეგებიც იყოს.</p>
            <section class="overflow-hidden rounded-xl border border-border-default bg-surface" aria-labelledby="marketing-chart-title">
              <div class="p-5 pb-2"><h3 id="marketing-chart-title" class="text-base font-bold">რეკლამის ხარჯი დღეების მიხედვით</h3><p class="mt-2 text-xs leading-5 text-text-muted">{{ ads?.currency }} · დღეები სარეკლამო ანგარიშის დროის სარტყლით.</p></div>
              <ClientOnly v-if="hasChart"><LazyBusinessMarketingChart :daily="ads?.daily || []" :currency="ads?.currency || 'USD'" /></ClientOnly>
              <p v-else class="py-10 text-center text-sm text-text-muted">არჩეულ პერიოდში სარეკლამო აქტივობა არ არის.</p>
              <details class="p-5 pt-3"><summary class="cursor-pointer text-xs font-semibold text-text-secondary">დღიური მონაცემების ნახვა ცხრილში</summary><div class="mt-4 max-h-[320px] overflow-auto rounded-lg" :class="scrollClass"><table class="w-full text-left text-xs"><thead class="sticky top-0 bg-surface-2 text-text-secondary"><tr><th class="p-3">თარიღი</th><th class="p-3 text-right">ხარჯი</th><th class="p-3 text-right">ჩვენებები</th><th class="p-3 text-right">დაწკაპუნებები</th></tr></thead><tbody><tr v-for="day in ads?.daily" :key="day.date" class="border-t border-border-default"><td class="whitespace-nowrap p-3">{{ reportDate(day.date) }}</td><td class="whitespace-nowrap p-3 text-right tabular-nums">{{ money(day.spend) }}</td><td class="p-3 text-right tabular-nums">{{ reportNumber(day.impressions) }}</td><td class="p-3 text-right tabular-nums">{{ reportNumber(day.clicks) }}</td></tr></tbody></table></div></details>
            </section>
            <section class="mt-5 overflow-hidden rounded-xl border border-border-default bg-surface" aria-labelledby="campaigns-title">
              <div class="p-5"><h3 id="campaigns-title" class="text-base font-bold">კამპანიები</h3><p class="mt-2 text-xs leading-5 text-text-muted">არჩეულ პერიოდში აქტივობის მქონე კამპანიები, ხარჯის მიხედვით. {{ ads?.campaigns_limited ? 'სია შეზღუდულია პირველი 300 ჩანაწერით; ზედა ჯამები მთელ პერიოდს მოიცავს.' : '' }}</p></div>
              <div v-if="ads?.campaigns?.length" class="max-h-[420px] overflow-auto" :class="scrollClass"><table class="w-full text-left text-xs"><thead class="sticky top-0 bg-surface-2 text-text-secondary"><tr><th class="p-3 pl-5">კამპანია</th><th class="p-3 text-right">ხარჯი</th><th class="p-3 text-right">ჩვენებები</th><th class="p-3 text-right">დაწკაპუნებები</th><th class="p-3 pr-5 text-right">მიწერილი შეძენები</th></tr></thead><tbody><tr v-for="campaign in ads.campaigns" :key="campaign.id" class="border-t border-border-default"><td class="min-w-[180px] max-w-[320px] break-words p-3 pl-5 font-semibold">{{ campaign.name || `კამპანია ${campaign.id}` }}</td><td class="whitespace-nowrap p-3 text-right tabular-nums">{{ money(campaign.spend) }}</td><td class="p-3 text-right tabular-nums">{{ reportNumber(campaign.impressions) }}</td><td class="p-3 text-right tabular-nums">{{ reportNumber(campaign.clicks) }}</td><td class="p-3 pr-5 text-right tabular-nums">{{ reportNumber(campaign.website_purchases) }}</td></tr></tbody></table></div>
              <p v-else class="px-5 pb-8 text-sm text-text-muted">არჩეულ პერიოდში კამპანიების შედეგები არ არის.</p>
            </section>
          </template>
        </section>
        <div class="grid min-w-0 gap-5 xl:grid-cols-2">
          <section v-for="platform in social" :key="platform.key" class="min-w-0 rounded-xl border border-border-default bg-surface p-5 md:p-6" :aria-labelledby="`${platform.key}-title`">
            <h2 :id="`${platform.key}-title`" class="text-lg font-bold">{{ platform.title }}</h2><p class="mt-1 text-xs text-text-muted">{{ platform.name }}</p>
            <p v-if="platform.profile?.message" role="status" class="mt-3 text-xs leading-6 text-text-secondary">მიმდინარე პროფილი: {{ platform.profile.message }}</p>
            <p v-if="platform.activity?.message" role="status" class="mt-3 rounded-lg border border-border-default bg-surface-2 p-3 text-xs leading-6 text-text-secondary">{{ platform.activity.message }}</p>
            <p v-if="platform.key === 'facebook' && report.facebook?.activity.complete === false" class="mt-3 text-xs leading-6 text-text-secondary">Meta-მ მხოლოდ {{ report.facebook.activity.reported_days }} დღის ჩანაწერები დააბრუნა. ნაჩვენები ჯამი მხოლოდ ამ დღეებს მოიცავს.</p>
            <div class="mt-5 grid grid-cols-2 gap-4"><article v-for="metric in platform.metrics" :key="metric.label" class="min-w-0 rounded-lg border border-border-default p-4"><h3 class="text-xs font-semibold leading-5 text-text-secondary">{{ metric.label }}</h3><p class="mt-3 break-words text-2xl font-bold tabular-nums">{{ reportNumber(metric.value) }}</p><p class="mt-2 text-[11px] leading-5 text-text-muted">{{ metric.note }}</p></article></div>
            <p v-if="platform.key === 'instagram' && metaHasData(report.instagram?.profile)" class="mt-4 text-xs text-text-muted">გამოქვეყნებული მედია ახლა: {{ reportNumber(report.instagram?.profile.posts) }} · ეს მთელი პროფილის მიმდინარე რაოდენობაა.</p>
            <p class="mt-5 text-[11px] leading-5 text-text-muted">{{ platform.note }}</p>
            <div class="mt-4 border-t border-border-default pt-4 text-[11px] leading-5 text-text-muted"><p v-if="platform.profile?.fetched_at">პროფილი მიღებულია: {{ metaUpdated(platform.profile.fetched_at) }} · თბილისის დრო</p><p v-if="platform.activity?.fetched_at">პერიოდის სტატისტიკა მიღებულია: {{ metaUpdated(platform.activity.fetched_at) }} · თბილისის დრო</p></div>
          </section>
        </div>
        <p class="mt-5 text-[11px] leading-5 text-text-muted">მონაცემები ხელახლა მოითხოვება გახსნის ან განახლებისას, თუ ბოლო მიღებიდან 5 წუთი გავიდა. Meta-ს დამუშავება შეიძლება დაგვიანდეს. პლატფორმების მიღწეული ანგარიშები ერთმანეთს არ ემატება; ერთ ადამიანს ორივე პლატფორმა შეიძლება ჰქონდეს.</p>
      </template>
    </template>
  </section>
</template>
