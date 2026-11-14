<script setup lang="ts">
import { adEfficiency, decisionChange, decisionReady, decisionSummary, type DecisionState } from "~/utils/businessDecisions";
import { marketingMoney, metaUpdated } from "~/utils/businessMarketing";
import { analyticsSource } from "~/utils/businessAnalytics";
import { reportDate, reportNumber, type BusinessPeriod } from "~/utils/businessReport";

const props = defineProps<{ period: BusinessPeriod; source: "all" | "google" | "meta"; compact?: boolean }>();
const { report, loading, errorMessage, load } = useBusinessDecisions();
onMounted(() => load(props.period, props.source));
watch(() => [props.period.start, props.period.end, props.source], () => load(props.period, props.source));
const google = computed(() => report.value?.google);
const ads = computed(() => report.value?.ads);
const oldAds = computed(() => report.value?.previous_ads);
const funnel = computed(() => report.value?.funnel);
const notes = computed(() => decisionSummary(report.value));
const comparableAds = computed(() => !!oldAds.value?.summary && !!ads.value?.summary
  && ["ready", "empty"].includes(ads.value.status) && ["ready", "empty"].includes(oldAds.value.status)
  && ads.value.currency === oldAds.value.currency && ads.value.timezone === oldAds.value.timezone);
const money = (value?: string | number | null) => marketingMoney(value, ads.value?.currency);
const efficiency = computed(() => adEfficiency(ads.value?.summary));
const oldEfficiency = computed(() => adEfficiency(oldAds.value?.summary));
const googleCards = computed(() => [
  { label: "ვიზიტები", key: "sessions" as const }, { label: "მომხმარებლები", key: "totalUsers" as const },
  { label: "Google-ში აღრიცხული შეძენები", key: "ecommercePurchases" as const }, { label: "შეძენების თანხა · GEL", key: "purchaseRevenue" as const },
]);
const adCards = computed(() => [
  { label: "რეკლამის ხარჯი", value: money(ads.value?.summary?.spend), change: decisionChange(ads.value?.summary?.spend, oldAds.value?.summary?.spend, comparableAds.value), note: "Meta-ს სარეკლამო ანგარიშის ვალუტაში." },
  { label: "ერთი შეძენის საშუალო ფასი", value: money(efficiency.value.cpa), change: decisionChange(efficiency.value.cpa, oldEfficiency.value.cpa, comparableAds.value), note: "სარეკლამო ხარჯი / Meta-ს მიერ მიწერილი შეძენები. შეძენების გარეშე არ გამოითვლება." },
  { label: "დახარჯული 1-ის უკუგება", value: efficiency.value.roas === null ? "—" : `${reportNumber(Math.round(efficiency.value.roas * 100) / 100)}×`, change: decisionChange(efficiency.value.roas, oldEfficiency.value.roas, comparableAds.value), note: "მაგალითად 3× ნიშნავს: დახარჯულ ყოველ 1-ზე Meta-მ 3-ის გაყიდვა მიაწერა. ეს მოგება არ არის." },
  { label: "Meta-ზე მიწერილი შეძენები", value: reportNumber(ads.value?.summary?.website_purchases), change: decisionChange(ads.value?.summary?.website_purchases, oldAds.value?.summary?.website_purchases, comparableAds.value), note: "შეიძლება შეფასებითი რაოდენობა იყოს. ჩვენს გადახდილ შეკვეთებს არ ემატება." },
]);
const stateMessage = (state?: DecisionState) => state?.status === "not_configured" ? "ამ გარემოში წყაროს წაკითხვის წვდომა ჯერ არ არის მითითებული."
  : state?.message || "ანგარიში დროებით მიუწვდომელია. ეს ნულოვან შედეგს არ ნიშნავს.";
const percent = (users: number) => funnel.value?.steps?.[0]?.users ? Math.round(users / funnel.value.steps[0].users * 100) : 0;
</script>

<template>
  <section class="my-6 min-w-0 rounded-xl border border-border-default bg-surface p-4 md:p-6" :aria-busy="loading" aria-label="ტრეფიკი და რეკლამის ეფექტიანობა">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div><h2 class="text-lg font-bold">რა შედეგი მოაქვს ვიზიტებსა და რეკლამას</h2><p class="mt-1 text-xs leading-5 text-text-muted">შერჩეული პერიოდი · Google და Meta აღრიცხავენ აქტივობას; ზუსტ გაყიდვებსა და მოგებას ჩვენი ბაზა ითვლის.</p></div>
      <button type="button" :disabled="loading" class="min-h-[44px] rounded-lg border border-border-default px-4 py-2 text-xs font-semibold disabled:opacity-50" @click="load(period, source)">განახლება</button>
    </div>
    <p v-if="loading" role="status" class="py-6 text-sm text-text-muted">ანგარიშები იტვირთება…</p>
    <p v-else-if="errorMessage" role="alert" class="mt-4 text-sm text-error">{{ errorMessage }}</p>
    <template v-else-if="report">
      <p class="mt-4 text-xs leading-6 text-text-muted">შედარება: {{ reportDate(report.previous_period.start) }} — {{ reportDate(report.previous_period.end) }}. მიმდინარე თვე ედრება წინა თვის შესაბამის ნაწილს; სხვა დიაპაზონი — წინა იმავე რაოდენობის დღეებს. მიმდინარე დღე ჯერ არასრულია.</p>
      <ul v-if="notes.length" class="my-4 space-y-2 rounded-lg bg-surface-2 p-4 text-sm leading-6 text-text-secondary"><li v-for="note in notes" :key="note">{{ note }}</li></ul>
      <section v-if="google" class="mt-6" aria-label="Google-ის შედეგები">
        <h3 class="font-bold">Google · ვიზიტიდან შეძენამდე</h3>
        <template v-if="decisionReady(google) && google.current">
          <p class="mt-2 text-xs text-text-muted">მიღებულია: {{ metaUpdated(google.fetched_at) }} · {{ google.timezone || 'წყაროს დროის სარტყელი უცნობია' }} <strong v-if="google.status === 'stale'" class="text-error">· ძველი პასუხი</strong></p>
          <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article v-for="card in googleCards" :key="card.key" class="min-w-0 rounded-lg border border-border-default p-4"><h4 class="text-xs leading-5 text-text-muted">{{ card.label }}</h4><p class="mt-2 break-words text-2xl font-bold tabular-nums">{{ card.key === 'purchaseRevenue' ? marketingMoney(google.current[card.key], 'GEL') : reportNumber(google.current[card.key]) }}</p><p class="mt-2 text-xs leading-5 text-text-secondary">{{ decisionChange(google.current[card.key], google.previous?.[card.key], google.status === 'ready') }}</p></article>
          </div>
          <details v-if="!compact" class="mt-5 rounded-lg border border-border-default p-4" open><summary class="cursor-pointer text-sm font-semibold">რომელი წყაროდან და კამპანიიდან მოდის შეძენები</summary>
            <p class="my-3 text-xs leading-5 text-text-muted">Google-ის სესიის წყაროსა და კამპანიის მიხედვით · თანხა GEL-ში · პირველი 30 ჩანაწერი, შეძენებით და შემდეგ ვიზიტებით. სულ {{ reportNumber(google.source_row_count) }} ჩანაწერი. კამპანიის გასარჩევად სარეკლამო ბმულებს შესაბამისი UTM ნიშნები სჭირდება.</p>
            <div v-if="google.sources?.length" class="max-h-[360px] overflow-auto [scrollbar-width:thin]"><table class="w-full text-left text-xs"><thead class="sticky top-0 bg-surface-2"><tr><th class="p-3">წყარო / კამპანია</th><th class="p-3 text-right">ვიზიტები</th><th class="p-3 text-right">შეძენები</th><th class="p-3 text-right">თანხა</th></tr></thead><tbody><tr v-for="row in google.sources" :key="`${row.sessionSourceMedium}:${row.sessionCampaignName}`" class="border-t border-border-default"><td class="min-w-[170px] max-w-[320px] break-words p-3"><span class="font-semibold">{{ analyticsSource(row.sessionSourceMedium) }}</span><span class="mt-1 block text-text-muted">{{ row.sessionCampaignName === '(not set)' ? 'კამპანია მითითებული არ არის' : row.sessionCampaignName }}</span></td><td class="p-3 text-right tabular-nums">{{ reportNumber(row.sessions) }}</td><td class="p-3 text-right tabular-nums">{{ reportNumber(row.ecommercePurchases) }}</td><td class="whitespace-nowrap p-3 text-right tabular-nums">{{ marketingMoney(row.purchaseRevenue, 'GEL') }}</td></tr></tbody></table></div><p v-else class="py-4 text-sm text-text-muted">ამ პერიოდში წყაროების ჩანაწერები არ არის.</p>
          </details>
          <p v-for="warning in google.warnings" :key="warning" class="mt-3 text-xs leading-5 text-text-muted">{{ warning }}</p>
        </template><p v-else role="status" class="mt-3 text-sm leading-6 text-text-muted">{{ stateMessage(google) }}</p>
      </section>
      <section v-if="funnel && !compact" class="mt-6" aria-label="შეძენის თანმიმდევრული ეტაპები">
        <h3 class="font-bold">რომელ ეტაპზე ჩერდება მომხმარებელი</h3><p class="mt-2 text-xs leading-5 text-text-muted">ითვლება მომხმარებელი, რომელმაც ეტაპები ამ რიგით გაიარა, პროდუქტის ნახვიდან დაწყებული. შუალედური მოქმედებები და რამდენიმე ვიზიტი დასაშვებია არჩეული პერიოდის ფარგლებში. ეს ყველა შეკვეთის რაოდენობა არ არის.</p>
        <template v-if="decisionReady(funnel) && funnel.steps">
          <p class="mt-2 text-xs text-text-muted">მიღებულია: {{ metaUpdated(funnel.fetched_at) }} <strong v-if="funnel.status === 'stale'" class="text-error">· ძველი პასუხი</strong></p>
          <ol class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"><li v-for="(step, index) in funnel.steps" :key="step.event" class="min-w-0 rounded-lg border border-border-default p-4"><h4 class="text-xs font-semibold leading-5">{{ index + 1 }}. {{ step.label }}</h4><p class="mt-2 text-2xl font-bold tabular-nums">{{ reportNumber(step.users) }}</p><div class="my-3 h-2 overflow-hidden rounded bg-surface-2" aria-hidden="true"><div class="h-full bg-accent-primary" :style="{ width: `${percent(step.users)}%` }" /></div><p class="text-xs leading-5 text-text-muted">{{ funnel.steps[0]?.users ? `${percent(step.users)}% პირველი ეტაპიდან` : 'შედარებისთვის მონაცემები ჯერ არ არის' }}</p><p v-if="step.lost !== null" class="mt-2 text-xs leading-5">შემდეგ ეტაპზე არ გადასულა: {{ reportNumber(step.lost) }}</p></li></ol>
          <p v-for="warning in funnel.warnings" :key="warning" class="mt-3 text-xs leading-5 text-text-muted">{{ warning }}</p>
        </template><p v-else role="status" class="mt-3 text-sm leading-6 text-text-muted">{{ stateMessage(funnel) }}</p>
      </section>
      <section v-if="ads" class="mt-6" aria-label="რეკლამის ეფექტიანობა">
        <h3 class="font-bold">Meta · რას ვიღებთ სარეკლამო ხარჯით</h3>
        <template v-if="decisionReady(ads) && ads.summary">
          <p class="mt-2 text-xs text-text-muted">მიღებულია: {{ metaUpdated(ads.fetched_at) }} · {{ ads.currency }} · {{ ads.timezone }} <strong v-if="ads.status === 'stale'" class="text-error">· ძველი პასუხი</strong></p>
          <p v-if="oldAds?.fetched_at" class="mt-1 text-xs text-text-muted">წინა პერიოდი მიღებულია: {{ metaUpdated(oldAds.fetched_at) }}</p>
          <p v-if="!comparableAds" class="mt-2 text-xs leading-5 text-text-muted">წინა პერიოდის თავსებადი, განახლებული პასუხი არ გვაქვს; ცვლილებას არ ვანგარიშობთ.</p>
          <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"><article v-for="card in adCards" :key="card.label" class="min-w-0 rounded-lg border border-border-default p-4"><h4 class="text-xs leading-5 text-text-muted">{{ card.label }}</h4><p class="mt-2 break-words text-2xl font-bold tabular-nums">{{ card.value }}</p><p class="mt-2 text-xs leading-5 text-text-secondary">{{ card.change }}</p><p class="mt-2 text-xs leading-5 text-text-muted">{{ card.note }}</p></article></div>
          <p class="mt-4 text-sm leading-6">ბმულზე დაწკაპუნება: <strong>{{ reportNumber(ads.summary.link_clicks) }}</strong> · გვერდის ჩატვირთვა რეკლამიდან: <strong>{{ reportNumber(ads.summary.landing_page_views) }}</strong></p>
          <p class="mt-2 text-xs leading-5 text-text-muted">Meta-ს მიერ მიწერილი შედეგები: 7 დღე დაწკაპუნებიდან / 1 დღე ნახვიდან, შეძენის თარიღით. თანხები ერთი სარეკლამო ანგარიშის ვალუტაშია. Google-ის GEL თანხებს არ ვყოფთ USD ხარჯზე და პლატფორმების შეძენებს ერთმანეთს არ ვუმატებთ.</p>
          <details v-if="!compact && ads.campaigns?.length" class="mt-4 rounded-lg border border-border-default p-4"><summary class="cursor-pointer text-sm font-semibold">კამპანიების თანხა და ეფექტიანობა</summary><p v-if="ads.campaigns_limited" class="mt-2 text-xs text-text-muted">პირველი 300 კამპანია; ზედა ჯამები მთელ ანგარიშს მოიცავს.</p><div class="mt-3 max-h-[360px] overflow-auto [scrollbar-width:thin]"><table class="w-full text-left text-xs"><thead class="sticky top-0 bg-surface-2"><tr><th class="p-3">კამპანია</th><th class="p-3 text-right">ხარჯი</th><th class="p-3 text-right">შეძენები</th><th class="p-3 text-right">მიწერილი თანხა</th><th class="p-3 text-right">ერთი შეძენის ფასი</th><th class="p-3 text-right">უკუგება</th></tr></thead><tbody><tr v-for="campaign in ads.campaigns" :key="campaign.id" class="border-t border-border-default"><td class="min-w-[160px] max-w-[280px] break-words p-3">{{ campaign.name }}</td><td class="whitespace-nowrap p-3 text-right">{{ money(campaign.spend) }}</td><td class="p-3 text-right">{{ reportNumber(campaign.website_purchases) }}</td><td class="whitespace-nowrap p-3 text-right">{{ money(campaign.website_purchase_value) }}</td><td class="whitespace-nowrap p-3 text-right">{{ money(adEfficiency(campaign).cpa) }}</td><td class="p-3 text-right">{{ adEfficiency(campaign).roas === null ? '—' : `${reportNumber(Math.round(adEfficiency(campaign).roas! * 100) / 100)}×` }}</td></tr></tbody></table></div></details>
        </template><p v-else role="status" class="mt-3 text-sm leading-6 text-text-muted">{{ stateMessage(ads) }}</p>
      </section>
      <div v-if="compact" class="mt-4 flex flex-wrap gap-4 text-sm font-semibold"><NuxtLink :to="{ path: '/business/users', query: report.period }" class="underline underline-offset-4">მომხმარებლის გზის ნახვა</NuxtLink><NuxtLink :to="{ path: '/business/marketing', query: report.period }" class="underline underline-offset-4">მარკეტინგის დეტალები</NuxtLink></div>
      <p class="mt-5 border-t border-border-default pt-4 text-xs leading-6 text-text-muted">მცირე რაოდენობით მონაცემებზე მკვეთრ დასკვნებს ნუ გამოიტან. თანხმობა, დაბლოკილი აღრიცხვა და წყაროების დამუშავების დრო გავლენას ახდენს შედეგებზე. წყაროები 5 წუთით ინახება; ეს ანგარიში რეალურ დროში არ ახლდება.</p>
    </template>
  </section>
</template>
