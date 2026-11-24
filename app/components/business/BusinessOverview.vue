<script setup lang="ts">
import { useBusinessResource } from "~/composables/useBusinessResource";
import type { AudienceReport } from "~/utils/businessAudience";
import { analyticsHasData } from "~/utils/businessAnalytics";
import { marketingMoney, metaHasData, metaUpdated } from "~/utils/businessMarketing";
import { reportMoney, reportNumber, type BusinessPeriod, type BusinessReport } from "~/utils/businessReport";
import { buildBusinessInsights } from "~/utils/businessInsights";

const props = defineProps<{ period: BusinessPeriod; shop: BusinessReport }>();
const analytics = useBusinessAnalytics();
const marketing = useBusinessMarketing();
const audience = useBusinessResource<AudienceReport>("/business/audience/");
const google = analytics.report, meta = marketing.report;
const load = () => Promise.allSettled([analytics.load(props.period), marketing.load(props.period), audience.load({ ...props.period })]);
onMounted(load);
watch(() => [props.period.start, props.period.end], load);
const stateLabel = (value?: string) => ({ ready: "მიღებულია", empty: "მიღებულია · აქტივობა არ არის", partial: "ნაწილობრივი", stale: "ძველი პასუხი", unavailable: "მიუწვდომელია", not_configured: "არ არის დაკავშირებული" } as Record<string, string>)[value || ""] || "იტვირთება";
const cards = computed(() => [
  { label: "დადასტურებული შეკვეთები", value: reportNumber(props.shop.summary.paid_orders), source: "ჩვენი ბაზა", path: "/business/sales", note: "არჩეულ პერიოდში დადასტურებული გადახდებით." },
  { label: "პროდუქტების გაყიდვები", value: reportMoney(props.shop.summary.product_received), source: "ჩვენი ბაზა · GEL", path: "/business/sales", note: "დღგ-ით, მიტანის გარეშე; დაბრუნებები ფინანსებშია." },
  { label: "ახალი მომხმარებლები", value: reportNumber(audience.report.value?.new_users), source: "Google Analytics · " + stateLabel(audience.report.value?.status), path: "/business/users", note: "Google-ის მიერ პირველად აღრიცხული; რეგისტრაცია არ იგულისხმება." },
  { label: "ვიზიტები", value: reportNumber(analyticsHasData(google.value) ? google.value?.summary?.sessions : null), source: "Google Analytics", path: "/business/users", note: "ერთ მომხმარებელს რამდენიმე ვიზიტი შეიძლება ჰქონდეს." },
  { label: "რეკლამის ხარჯი", value: marketingMoney(metaHasData(meta.value?.ads) ? meta.value?.ads?.summary?.spend : null, meta.value?.ads?.currency), source: "Meta · " + (meta.value?.ads?.currency || "ვალუტა მიუწვდომელია"), path: "/business/marketing", note: "Meta-ს სარეკლამო ანგარიშის თანხა, არა მოგება." },
  { label: "საყურადღებო გადახდები", value: reportNumber(props.shop.payment_attention), source: "ჩვენი ბაზა · მიმდინარე მდგომარეობა", path: "/business/operations", note: "ყველა პერიოდის მიმდინარე მცდელობები, არა უნიკალური მყიდველები." },
]);
const facts = computed(() => {
  const result: { key: string; title: string; text: string; path: string; hash?: string }[] = [];
  if (props.shop.payment_attention) result.push({ key: "payments", title: "გადახდის მცდელობები შესამოწმებელია", text: `${reportNumber(props.shop.payment_attention)} მიმდინარე ჩანაწერი. მიზეზები, ისტორია და მოგვიანებით გადახდა დეტალებშია.`, path: "/business/operations" });
  if (audience.errorMessage.value || audience.report.value && ["stale", "unavailable", "not_configured"].includes(audience.report.value.status) || analytics.errorMessage.value || google.value && ["stale", "unavailable", "not_configured"].includes(google.value.status) || marketing.errorMessage.value || meta.value && meta.value.status !== "ready") result.push({ key: "sources", title: "ზოგი წყარო სრულად ვერ განახლდა", text: "მიუწვდომელი მონაცემი ნულოვან შედეგს არ ნიშნავს. შეამოწმეთ წყაროს მდგომარეობა.", path: "/business/diagnostics" });
  if (google.value?.search?.status === "ready" && google.value.search.no_results) result.push({ key: "search", title: "საიტზე უშედეგო ძიებები დაფიქსირდა", text: `${reportNumber(google.value.search.no_results)} ძიების შედეგის ნახვაზე პროდუქტი ვერ მოიძებნა.`, path: "/business/users", hash: "#audience-search-title" });
  return [...result, ...buildBusinessInsights(props.shop).facts].slice(0, 3);
});
</script>

<template>
  <section class="my-6" aria-label="ბიზნესის სწრაფი მიმოხილვა">
    <h2 class="mb-4 text-lg font-bold">არჩეული პერიოდი · მთავარი მაჩვენებლები</h2>
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <NuxtLink v-for="card in cards" :key="card.label" :to="{ path: card.path, query: period }" class="min-w-0 rounded-xl border border-border-default bg-surface p-5 hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary">
        <p class="text-[11px] font-semibold text-accent-primary">{{ card.source }}</p><h3 class="mt-2 text-sm font-semibold">{{ card.label }}</h3>
        <p class="mt-3 break-words text-3xl font-bold tabular-nums">{{ card.value }}</p><p class="mt-3 text-xs leading-5 text-text-muted">{{ card.note }}</p>
      </NuxtLink>
    </div>
    <p class="mt-3 text-xs leading-5 text-text-muted">GA4: {{ stateLabel(google?.status) }} · მიღებულია {{ metaUpdated(google?.fetched_at) || '—' }} · Meta: {{ stateLabel(meta?.ads?.status) }} · მიღებულია {{ metaUpdated(meta?.ads?.fetched_at) || '—' }}. ახალი მომხმარებლები: {{ stateLabel(audience.report.value?.status) }} · {{ metaUpdated(audience.report.value?.fetched_at) || '—' }}. წყაროების შეძენებს ერთმანეთს არ ვუმატებთ.</p>
    <section class="mt-5 rounded-xl border border-border-default bg-surface p-5" aria-label="საყურადღებო ფაქტები">
      <h2 class="font-bold">რას მივაქციოთ ყურადღება</h2><ul v-if="facts.length" class="mt-3 divide-y divide-border-default"><li v-for="fact in facts" :key="fact.key" class="py-3"><h3 class="text-sm font-semibold">{{ fact.title }}</h3><p class="mt-1 text-xs leading-6 text-text-muted">{{ fact.text }}</p><NuxtLink :to="{ path: fact.path, query: { ...period, ...(fact.key === 'search' ? { tab: 'search' } : {}) }, hash: fact.hash }" class="inline-flex min-h-[44px] items-center text-xs font-semibold underline underline-offset-4">დეტალების ნახვა →</NuxtLink></li></ul><p v-else class="mt-3 text-sm text-text-muted">ამ ანგარიშებით დამატებითი საყურადღებო ფაქტი არ გამოვლენილა.</p>
    </section>
  </section>
</template>
