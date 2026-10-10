<script setup lang="ts">
import { ArrowPathIcon, CircleStackIcon, InformationCircleIcon, ChartBarIcon, TruckIcon, BanknotesIcon, CubeIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import { BUSINESS_SECTIONS } from "~/utils/businessRouting";
import { buildBusinessInsights } from "~/utils/businessInsights";
import { REPORT_METRICS, businessPreset, reportMoney, reportNumber, reportDate, type BusinessPeriod, type ReportSection } from "~/utils/businessReport";

const props = defineProps<{ section: ReportSection }>();
const route = useRoute();
const { report, loading, errorMessage, load } = useBusinessReport();
const current = computed(() => BUSINESS_SECTIONS.find((item) => item.key === props.section)!);
const metrics = computed(() => REPORT_METRICS[props.section]);
const insights = computed(() => props.section === "overview" && report.value ? buildBusinessInsights(report.value) : null);
const readPeriod = (): BusinessPeriod => typeof route.query.start === "string" && typeof route.query.end === "string"
  ? { start: route.query.start, end: route.query.end } : businessPreset("month");
const initial = readPeriod();
const start = ref(initial.start);
const end = ref(initial.end);
const dateError = ref("");
const dialog = ref<HTMLDialogElement | null>(null);
const dialogTrigger = ref<HTMLButtonElement | null>(null);
const closeDialog = () => { dialog.value?.close(); dialogTrigger.value?.focus(); };
const applyPeriod = async (period = { start: start.value, end: end.value }) => {
  if (!period.start || !period.end || period.start > period.end) {
    dateError.value = "მიუთითეთ სწორი საწყისი და საბოლოო თარიღები.";
    return;
  }
  dateError.value = "";
  start.value = period.start; end.value = period.end;
  if (route.query.start === period.start && route.query.end === period.end) await load(period);
  else await navigateTo({ path: route.path, query: period }, { replace: true });
};
onMounted(() => load(readPeriod()));
watch(() => [route.query.start, route.query.end], () => {
  const period = readPeriod();
  start.value = period.start; end.value = period.end;
  void load(period);
});
const format = (key: string, money = true) => money ? reportMoney(report.value?.summary[key]) : reportNumber(report.value?.summary[key]);
const change = (key: string) => {
  const comparison = report.value?.comparisons[key];
  if (!comparison || comparison.delta === null) return "შედარება არ არის ხელმისაწვდომი";
  const delta = Number(comparison.delta);
  if (!delta) return "ცვლილება არ არის";
  const direction = delta > 0 ? "↑ მატება" : "↓ კლება";
  return comparison.percent === null ? `${direction} · წინა პერიოდი 0` : `${direction} ${reportNumber(Math.abs(Number(comparison.percent)))}%`;
};
const updated = computed(() => report.value ? new Intl.DateTimeFormat("ka-GE", { timeZone: "Asia/Tbilisi", hour: "2-digit", minute: "2-digit" }).format(new Date(report.value.generated_at)) : "");
const hasIncompleteData = computed(() => Number(report.value?.summary.unallocated_events)
  || props.section !== "sales" && Number(report.value?.summary.unknown_cost_lines)
  || props.section === "finance" && Number(report.value?.summary.unknown_loss_lines));
const chartTitle = computed(() => ({ overview: "მიღებული და დაბრუნებული თანხები", sales: "შეკვეთები და გაყიდული ერთეულები", finance: "პროდუქტების მოგება დროში" })[props.section]);
const hasChart = computed(() => report.value?.daily.some((day) => {
  if (props.section === "finance") return day.product_profit_net !== null && Number(day.product_profit_net) !== 0;
  if (props.section === "sales") return day.paid_orders > 0 || day.sold_units !== null && day.sold_units > 0;
  return Number(day.received) !== 0 || Number(day.refunded) !== 0;
}));
const details = [
  { key: "product_received", label: "პროდუქტებში მიღებული თანხა", note: "დღგ-ით, მიტანის გარეშე" },
  { key: "product_refunded", label: "პროდუქტებზე დაბრუნებული თანხა", note: "დადასტურებული დაბრუნებები, დღგ-ით" },
  { key: "net_product_received", label: "პროდუქტების თანხა დაბრუნებების შემდეგ", note: "დღგ-ით, მიტანის გარეშე" },
  { key: "net_delivery_received", label: "მიტანის თანხა დაბრუნებების შემდეგ", note: "მომხმარებლებისგან მიღებული საფასური, დღგ-ით" },
];
const profitSteps = computed(() => [
  { key: "product_sales_net", sign: "", label: "პროდუქტების გაყიდვის ჯამი", note: "დღგ-ის გარეშე, დადასტურებული დაბრუნებების გამოკლებით" },
  { key: "product_cost_net", sign: "−", label: "გაყიდული ნივთების შეძენის ღირებულება", note: "დღგ-ის გარეშე, დაბრუნებული ნივთების ღირებულების გამოკლებით" },
  ...(Number(report.value?.summary.product_rounding_net) ? [
    { key: "product_rounding_net", sign: Number(report.value?.summary.product_rounding_net) > 0 ? "+" : "", label: "დამრგვალების შესწორება", note: "თითო პროდუქტის დღგ-ის გამოთვლისას წარმოქმნილი თეთრების სხვაობა" },
  ] : []),
]);
</script>

<template>
  <section aria-labelledby="business-page-title" :aria-busy="loading">
    <div class="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:gap-6 min-[1200px]:items-end">
      <div>
        <p class="mb-2 text-[11px] font-bold leading-[18px] text-accent-primary">FLEXDRIVE · {{ current.label }}</p>
        <h1 id="business-page-title" class="text-[28px] font-extrabold leading-9 min-[1440px]:text-4xl min-[1440px]:leading-[44px]">{{ current.title }}</h1>
        <p class="mt-2 max-w-[720px] text-[13px] leading-5 text-text-muted">{{ current.description }}</p>
      </div>
      <button ref="dialogTrigger" type="button" class="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg border border-border-default bg-surface px-3.5 py-3 text-[13px] font-semibold text-text-secondary hover:bg-surface-2" @click="dialog?.showModal()"><CircleStackIcon class="h-5 w-5 shrink-0" aria-hidden="true" /> მონაცემების წყაროები</button>
    </div>

    <form class="rounded-xl border border-border-default bg-surface p-4 md:p-5" @submit.prevent="applyPeriod()">
      <div class="flex flex-wrap items-end gap-3">
        <label class="flex min-w-0 flex-1 flex-col gap-2 text-xs font-semibold text-text-secondary md:flex-none">საწყისი თარიღი<input v-model="start" type="date" required class="min-h-[44px] min-w-0 rounded-lg border border-border-default bg-bg-primary px-3 py-2 text-sm text-text-primary [color-scheme:light] dark:[color-scheme:dark]"></label>
        <label class="flex min-w-0 flex-1 flex-col gap-2 text-xs font-semibold text-text-secondary md:flex-none">საბოლოო თარიღი<input v-model="end" type="date" required class="min-h-[44px] min-w-0 rounded-lg border border-border-default bg-bg-primary px-3 py-2 text-sm text-text-primary [color-scheme:light] dark:[color-scheme:dark]"></label>
        <BaseButton type="submit" :disabled="loading">ჩვენება</BaseButton>
        <button type="button" class="inline-flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-2 disabled:opacity-60" :disabled="loading" aria-label="არჩეული პერიოდის განახლება" @click="load(report?.period || readPeriod())"><ArrowPathIcon class="h-5 w-5" :class="loading ? 'animate-spin motion-reduce:animate-none' : ''" aria-hidden="true" /></button>
        <span v-if="report" class="text-[11px] text-text-muted md:ml-auto">განახლდა {{ updated }} · თბილისის დრო</span>
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        <button v-for="preset in [{ key: 'month', label: 'მიმდინარე თვე' }, { key: 'previous', label: 'წინა თვე' }, { key: '30days', label: 'ბოლო 30 დღე' }] as const" :key="preset.key" type="button" class="min-h-[44px] rounded-lg border border-border-default px-3 text-xs font-semibold text-text-secondary hover:bg-surface-2" @click="applyPeriod(businessPreset(preset.key))">{{ preset.label }}</button>
      </div>
      <p v-if="dateError" class="mt-3 text-sm text-error" role="alert">{{ dateError }}</p>
    </form>

    <div v-if="errorMessage" class="mt-5 rounded-lg border border-error bg-surface p-4 text-sm text-error" role="alert">{{ errorMessage }} <button type="button" class="ml-2 min-h-[44px] underline underline-offset-4" @click="load(readPeriod())">ხელახლა ცდა</button></div>
    <div v-if="loading" class="my-6 flex min-h-[240px] items-center justify-center gap-3 text-sm text-text-muted" role="status"><ArrowPathIcon class="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> რეალური მონაცემები იტვირთება…</div>

    <template v-if="report && !loading">
      <div class="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
        <span>{{ reportDate(report.period.start) }} — {{ reportDate(report.period.end) }}</span>
        <span>შედარება: {{ reportDate(report.previous_period.start) }} — {{ reportDate(report.previous_period.end) }}</span>
      </div>
      <p v-if="hasIncompleteData" class="mt-4 flex items-start gap-2 rounded-lg border border-border-default bg-surface-2 p-3 text-xs leading-5 text-text-secondary"><InformationCircleIcon class="h-5 w-5 shrink-0" aria-hidden="true" /> ზოგი ჩანაწერის ღირებულება ან თანხის განაწილება არასრულია. შესაბამისი სრული მაჩვენებლის ნაცვლად ნაჩვენებია „—“; მიღებული და დაბრუნებული თანხები დადასტურებული გადახდებიდან ითვლება.</p>

      <p class="mt-3 text-[11px] leading-5 text-text-muted">წყარო: ამ გარემოს შენახული ჩანაწერები. არსებული სატესტო შეკვეთებიც ამ ეტაპზე ანგარიშში შედის.</p>
      <section v-if="section === 'overview' && insights" class="my-6 rounded-xl border border-border-default bg-surface p-5 md:p-6" aria-labelledby="business-analysis-title">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 id="business-analysis-title" class="flex items-center gap-2 text-base font-bold"><InformationCircleIcon class="h-5 w-5 shrink-0 text-accent-primary" aria-hidden="true" /> ბიზნესის მოკლე ანალიზი</h2>
          <span class="rounded-md bg-accent-soft px-2 py-1 text-[11px] font-semibold text-accent-primary">ავტომატური შეჯამება</span>
        </div>
        <p class="mt-4 text-sm leading-7 text-text-primary md:text-[15px]">{{ insights.paragraph }}</p>
        <p class="mt-4 border-t border-border-default pt-3 text-[11px] leading-5 text-text-muted">ეფუძნება არჩეული და შესადარებელი პერიოდების შენახულ მონაცემებს. განახლდება პერიოდის შეცვლისა და მონაცემების განახლებისას.</p>
      </section>
      <div v-if="section !== 'overview'" class="my-6 grid grid-cols-2 border-y border-border-default md:mb-7 md:grid-cols-4 md:py-6" aria-label="ძირითადი მაჩვენებლები">
        <article v-for="metric in metrics" :key="metric.key" class="border-b border-r border-border-default px-3.5 py-5 even:border-r-0 [&:nth-last-child(-n+2)]:border-b-0 md:border-b-0 md:px-5 md:py-0 md:first:pl-0 md:even:border-r md:last:border-r-0 md:last:pr-0">
          <h2 class="text-[13px] font-semibold leading-5 text-text-secondary">{{ metric.label }}</h2>
          <p class="mt-3 break-words text-xl font-bold leading-8 text-text-primary md:text-2xl min-[1440px]:text-[30px]">{{ format(metric.key, metric.money) }}</p>
          <p class="mt-2 text-[11px] font-semibold text-accent-primary">{{ change(metric.key) }}</p>
          <p class="mt-2 text-[11px] leading-[18px] text-text-muted">{{ metric.note }}</p>
        </article>
      </div>

      <div class="mb-6 grid grid-cols-[minmax(0,1fr)] gap-5 min-[1200px]:gap-6" :class="section === 'finance' ? 'md:grid-cols-[minmax(0,1fr)_280px] min-[1200px]:grid-cols-[minmax(0,1fr)_300px]' : ''">
        <section class="min-w-0 overflow-hidden rounded-xl border border-border-default bg-surface" aria-labelledby="business-chart-title">
          <div class="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 md:px-6"><div><h2 id="business-chart-title" class="text-base font-bold">{{ chartTitle }}</h2><p class="mt-1 text-xs text-text-muted">დადასტურებული მონაცემები დღეების მიხედვით</p></div><span class="rounded-md bg-accent-soft px-2 py-1 text-[11px] font-semibold text-accent-primary">ჩვენი მონაცემები</span></div>
          <div class="px-2 pt-4 md:px-4">
            <LazyBusinessChart v-if="hasChart" :daily="report.daily" :section="section" />
            <div v-else class="flex min-h-[300px] flex-col items-center justify-center gap-3 p-6 text-center text-text-muted"><ChartBarIcon class="h-8 w-8" aria-hidden="true" /><p class="text-sm">{{ section === 'finance' && report.summary.product_profit_net === null ? 'მოგების სრული გრაფიკისთვის მონაცემები არასაკმარისია.' : 'არჩეულ პერიოდში ამ გრაფიკის მაჩვენებლები ნულია.' }}</p></div>
          </div>
          <div class="border-t border-border-default px-5 py-3 text-[11px] text-text-muted md:px-6">{{ section === 'sales' ? 'გადახდის დადასტურების თარიღით · შეკვეთებისა და ერთეულების რაოდენობა' : 'გადახდისა და თანხის დაბრუნების დადასტურების თარიღით · GEL' }}</div>
        </section>
        <aside v-if="section === 'finance'" class="flex min-w-0 flex-col rounded-xl bg-footer-bg p-6 text-footer-text-primary">
          <span class="flex items-center gap-2 text-[11px] font-semibold text-footer-text-secondary"><InformationCircleIcon class="h-[17px] w-[17px] shrink-0 text-brand-primary" aria-hidden="true" /> როგორ წავიკითხოთ შედეგი</span>
          <h2 class="mt-6 text-[22px] font-bold leading-8">მიღებული თანხა და მოგება ცალ-ცალკეა.</h2>
          <p class="mt-4 text-xs leading-5 text-footer-text-secondary">პროდუქტების მოგება გაყიდვისა და შეძენის ღირებულებების სხვაობაა დღგ-ის გარეშე, დადასტურებული დაბრუნებების გათვალისწინებით.</p>
          <div class="mt-5 border-t border-footer-border pt-5"><p class="text-xs leading-5 text-footer-text-secondary">ამ რიცხვს დღგ-ის 18% ხელახლა აღარ გამოაკლო. ბანკის საკომისიო, რეკლამა და სხვა ბიზნესხარჯები ჯერ არ არის გამოკლებული.</p></div>
          <p class="mt-auto pt-5 text-[11px] leading-5 text-footer-text-muted">წყარო: შენახული გადახდები, შეკვეთები და გაყიდული ნივთების ისტორიული ღირებულება.</p>
        </aside>
      </div>

      <div v-if="section === 'overview' && insights" class="grid gap-4 md:grid-cols-2">
        <section class="rounded-xl border border-border-default bg-surface p-5">
          <h2 class="text-base font-bold">საყურადღებო ფაქტები</h2>
          <ul v-if="insights.facts.length" class="mt-4 divide-y divide-border-default">
            <li v-for="fact in insights.facts" :key="fact.key" class="py-4 first:pt-0 last:pb-0">
              <h3 class="text-[13px] font-semibold text-text-primary">{{ fact.title }}</h3>
              <p class="mt-2 text-xs leading-5 text-text-muted">{{ fact.text }}</p>
              <NuxtLink :to="{ path: fact.path, query: report.period, hash: fact.hash }" class="mt-2 inline-flex min-h-[44px] items-center text-xs font-semibold text-accent-primary underline-offset-4 hover:underline">ფინანსური დეტალების ნახვა →</NuxtLink>
            </li>
          </ul>
          <p v-else class="mt-4 text-xs leading-6 text-text-muted">არჩეულ პერიოდში თანხის დაბრუნება ან უვარგისი დაბრუნებული ნივთი არ დაფიქსირებულა.</p>
        </section>
        <section class="rounded-xl border border-border-default bg-surface p-5">
          <h2 class="text-base font-bold">მონაცემების წყაროები</h2>
          <dl class="mt-4 divide-y divide-border-default text-xs">
            <div class="flex flex-wrap items-start justify-between gap-2 pb-4"><dt class="font-semibold text-text-secondary">შეკვეთები და ფინანსები</dt><dd class="text-accent-primary">დაკავშირებულია</dd></div>
            <div class="flex flex-wrap items-start justify-between gap-2 py-4"><dt class="font-semibold text-text-secondary">Google Analytics-ის ანგარიშები</dt><dd class="text-text-muted">შემდეგ ეტაპზე დასაკავშირებელია</dd></div>
            <div class="flex flex-wrap items-start justify-between gap-2 pt-4"><dt class="font-semibold text-text-secondary">Meta-ს ანგარიშები</dt><dd class="text-text-muted">შემდეგ ეტაპზე დასაკავშირებელია</dd></div>
          </dl>
        </section>
      </div>
      <div v-if="section === 'overview'" class="mt-5 flex flex-wrap gap-3">
        <BaseButton as="nuxt-link" variant="secondary" :to="{ path: '/business/sales', query: report.period }">გაყიდვების დეტალები</BaseButton>
        <BaseButton as="nuxt-link" variant="secondary" :to="{ path: '/business/finance', query: report.period }">ფინანსების დეტალები</BaseButton>
      </div>

      <section v-if="section === 'finance'" class="mb-6" aria-labelledby="business-delivery-title">
        <h2 id="business-delivery-title" class="mb-4 text-base font-bold">მიტანა და დაბრუნებული ნივთები</h2>
        <div class="grid gap-4 sm:grid-cols-2 min-[1200px]:grid-cols-4">
          <article class="rounded-xl border border-border-default bg-surface p-5"><TruckIcon class="mb-3 h-5 w-5 text-accent-primary" aria-hidden="true" /><h3 class="text-[13px] font-semibold text-text-secondary">საკურიეროსთვის გადასახდელი</h3><p class="mt-3 text-xl font-bold">{{ format('courier_payable') }}</p><p class="mt-2 text-xs text-text-muted">{{ format('regional_orders', false) }} შეკვეთა · შენახული საკურიერო ფასების ჯამი</p></article>
          <article class="rounded-xl border border-border-default bg-surface p-5"><BanknotesIcon class="mb-3 h-5 w-5 text-accent-primary" aria-hidden="true" /><h3 class="text-[13px] font-semibold text-text-secondary">რეგიონული ბუფერი</h3><p class="mt-3 text-xl font-bold">{{ format('buffer_received') }}</p><p class="mt-2 text-xs text-text-muted">{{ format('buffer_orders', false) }} ბუფერი · მიღებული თანხა დღგ-ით</p><p class="mt-2 text-[11px] text-text-muted">დაბრუნების შემდეგ: {{ format('net_buffer') }}</p></article>
          <article class="rounded-xl border border-border-default bg-surface p-5"><TruckIcon class="mb-3 h-5 w-5 text-accent-primary" aria-hidden="true" /><h3 class="text-[13px] font-semibold text-text-secondary">თბილისში მიტანის საფასური</h3><p class="mt-3 text-xl font-bold">{{ format('internal_delivery_received') }}</p><p class="mt-2 text-xs text-text-muted">{{ format('internal_orders', false) }} შეკვეთა · მიღებული თანხა დღგ-ით</p><p class="mt-2 text-[11px] text-text-muted">დაბრუნების შემდეგ: {{ format('net_internal_delivery') }}</p></article>
          <article class="rounded-xl border border-border-default bg-surface p-5"><CubeIcon class="mb-3 h-5 w-5 text-text-muted" aria-hidden="true" /><h3 class="text-[13px] font-semibold text-text-secondary">უვარგისი დაბრუნებული ნივთები</h3><p class="mt-3 text-xl font-bold">{{ format('unsaleable_cost_net') }}</p><p class="mt-2 text-xs text-text-muted">{{ format('unsaleable_units', false) }} ერთეული · შეძენის ღირებულება დღგ-ის გარეშე</p><p class="mt-2 text-[11px] text-text-muted">შემოწმების თარიღით; პროდუქტების მოგებისგან ცალკეა</p></article>
        </div>
      </section>

        <section v-if="section === 'sales'" class="min-w-0 overflow-hidden rounded-xl border border-border-default bg-surface">
          <header class="p-5 pb-3"><h2 class="text-base font-bold">პოპულარული პროდუქტები</h2><p class="mt-1 text-xs text-text-muted">პირველი 10 პროდუქტი გაყიდვის თანხით, დაბრუნების გამოკლებამდე</p></header>
          <div class="overflow-x-auto">
            <table v-if="report.products.length" class="w-full text-left text-xs">
              <thead class="bg-surface-2 text-text-muted"><tr><th class="p-3 pl-5 font-semibold">პროდუქტი</th><th class="p-3 text-right font-semibold">გაყიდული ერთეულები</th><th class="p-3 text-right font-semibold">დაბრუნებული ერთეულები</th><th class="p-3 pr-5 text-right font-semibold">თანხა დაბრუნების შემდეგ, დღგ-ით</th></tr></thead>
              <tbody><tr v-for="product in report.products" :key="`${product.sku}:${product.name}`" class="border-t border-border-default"><td class="min-w-[180px] p-3 pl-5"><p class="font-semibold leading-5">{{ product.name }}</p><p class="mt-1 text-[11px] text-text-muted">{{ product.sku || 'კოდი არ არის მითითებული' }}</p></td><td class="p-3 text-right tabular-nums">{{ reportNumber(product.sold_units) }}</td><td class="p-3 text-right tabular-nums">{{ reportNumber(product.returned_units) }}</td><td class="whitespace-nowrap p-3 pr-5 text-right tabular-nums">{{ reportMoney(product.net_sales) }}</td></tr></tbody>
            </table>
            <p v-else class="px-5 py-12 text-center text-sm text-text-muted">არჩეულ პერიოდში პროდუქტების დადასტურებული გაყიდვა ან დაბრუნება არ არის.</p>
          </div>
          <p class="border-t border-border-default px-5 py-4 text-[11px] leading-5 text-text-muted">მთელ პერიოდში გაყიდული ერთეულები: {{ format('sold_units', false) }} · დაბრუნებული: {{ format('returned_units', false) }} · სხვაობა: {{ format('net_units', false) }}</p>
        </section>
        <section v-if="section === 'finance'" class="min-w-0 rounded-xl border border-border-default bg-surface p-5">
          <h2 class="text-base font-bold">პროდუქტების მოგების გამოთვლა</h2>
          <p class="mt-2 text-xs leading-5 text-text-muted">გაყიდვის ჯამს ვაკლებთ გაყიდული ნივთების შეძენის ღირებულებას. ორივე თანხიდან დღგ გამოყოფილია.</p>
          <dl class="mt-4">
            <div v-for="step in profitSteps" :key="step.key" class="flex flex-col gap-2 border-b border-border-default py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <dt class="min-w-0 text-xs"><p class="font-semibold text-text-secondary">{{ step.label }}</p><p class="mt-1 text-[11px] leading-[18px] text-text-muted">{{ step.note }}</p></dt>
              <dd class="shrink-0 text-[15px] font-semibold tabular-nums sm:text-right"><span v-if="step.sign" class="mr-2 text-text-muted" aria-hidden="true">{{ step.sign }}</span>{{ format(step.key) }}</dd>
            </div>
            <div class="flex flex-col gap-2 rounded-lg bg-surface-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <dt class="text-sm font-bold">პროდუქტების მოგება დღგ-ის გარეშე</dt><dd class="shrink-0 text-xl font-bold tabular-nums text-accent-primary"><span class="mr-2 text-text-muted" aria-hidden="true">=</span>{{ format('product_profit_net') }}</dd>
            </div>
          </dl>
          <p class="mt-3 text-[11px] leading-5 text-text-muted">შეძენის ღირებულება აღებულია გაყიდული ნივთების შენახული ისტორიული ფასებიდან; ეს არ არის ამ პერიოდში შეძენილი მთელი მარაგის ჯამი. მიტანა, ბუფერი და სხვა ბიზნესხარჯები ამ გამოთვლაში არ შედის.</p>
          <p v-if="report.summary.product_cost_net === null" class="mt-3 text-xs leading-5 text-text-muted">შეძენის ღირებულების ან გადახდის განაწილების მონაცემები არასრულია, ამიტომ მოგების სრულ გამოთვლას ვერ ვაჩვენებთ.</p>
          <h3 class="mt-6 border-t border-border-default pt-5 text-sm font-bold">თანხების განაწილება დღგ-ით</h3>
          <dl class="mt-3"><div v-for="item in details" :key="item.key" class="flex items-start justify-between gap-4 border-b border-border-default py-3 last:border-0"><dt class="min-w-0 text-xs"><p class="font-semibold text-text-secondary">{{ item.label }}</p><p class="mt-1 text-[11px] leading-[18px] text-text-muted">{{ item.note }}</p></dt><dd class="shrink-0 text-right text-[13px] font-semibold tabular-nums">{{ format(item.key) }}</dd></div></dl>
        </section>

      <template v-if="section === 'finance'">
        <section class="mt-6 min-w-0 overflow-hidden rounded-xl border border-border-default bg-surface">
          <header class="p-5"><h2 class="text-base font-bold">რეგიონული მიტანის შეკვეთები</h2><p class="mt-1 text-xs text-text-muted">სულ {{ reportNumber(report.delivery_rows_total) }} · ნაჩვენებია ბოლო {{ report.deliveries.length }} · თანხა ერთხელ თითო შეკვეთაზე</p></header>
          <div class="overflow-x-auto"><table v-if="report.deliveries.length" class="w-full text-left text-xs"><thead class="bg-surface-2 text-text-muted"><tr><th class="p-3 pl-5">შეკვეთა</th><th class="p-3">გადახდის თარიღი</th><th class="p-3 text-right">საკურიერო</th><th class="p-3 text-right">ბუფერი</th><th class="p-3 pr-5 text-right">მიტანის სრული საფასური</th></tr></thead><tbody><tr v-for="delivery in report.deliveries" :key="delivery.order_number" class="border-t border-border-default"><td class="whitespace-nowrap p-3 pl-5 font-semibold">{{ delivery.order_number }}</td><td class="whitespace-nowrap p-3 text-text-muted">{{ reportDate(delivery.date) }}</td><td class="whitespace-nowrap p-3 text-right">{{ reportMoney(delivery.carrier) }}</td><td class="whitespace-nowrap p-3 text-right">{{ reportMoney(delivery.buffer) }}</td><td class="whitespace-nowrap p-3 pr-5 text-right">{{ reportMoney(delivery.delivery) }}</td></tr></tbody></table><p v-else class="p-5 pb-8 text-sm text-text-muted">არჩეულ პერიოდში რეგიონული მიტანის შესაბამისი შეკვეთა არ არის.</p></div>
        </section>
        <section class="mt-6 min-w-0 overflow-hidden rounded-xl border border-border-default bg-surface">
          <header class="p-5"><h2 class="text-base font-bold">გასაყიდად უვარგისი დაბრუნებული ნივთები</h2><p class="mt-1 text-xs text-text-muted">სულ {{ reportNumber(report.loss_rows_total) }} ჩანაწერი · ნაჩვენებია ბოლო {{ report.losses.length }}</p></header>
          <div class="overflow-x-auto"><table v-if="report.losses.length" class="w-full text-left text-xs"><thead class="bg-surface-2 text-text-muted"><tr><th class="p-3 pl-5">პროდუქტი / შეკვეთა</th><th class="p-3">შემოწმების თარიღი</th><th class="p-3 text-right">ერთეულები</th><th class="p-3 pr-5 text-right">ღირებულება დღგ-ის გარეშე</th></tr></thead><tbody><tr v-for="(loss, index) in report.losses" :key="`${loss.order_number}:${loss.sku}:${index}`" class="border-t border-border-default"><td class="min-w-[180px] p-3 pl-5"><p class="font-semibold">{{ loss.name }}</p><p class="mt-1 text-text-muted">{{ loss.sku }} · {{ loss.order_number }}</p></td><td class="whitespace-nowrap p-3 text-text-muted">{{ reportDate(loss.date) }}</td><td class="p-3 text-right">{{ loss.quantity }}</td><td class="whitespace-nowrap p-3 pr-5 text-right">{{ reportMoney(loss.cost_net) }}</td></tr></tbody></table><p v-else class="p-5 pb-8 text-sm text-text-muted">არჩეულ პერიოდში უვარგისი დაბრუნებული ნივთი არ არის დაფიქსირებული.</p></div>
        </section>
      </template>

      <details v-if="section !== 'overview'" class="mt-6 rounded-xl border border-border-default bg-surface p-5">
        <summary class="min-h-[44px] cursor-pointer text-xs font-semibold text-text-secondary">{{ section === 'sales' ? 'დღიური გაყიდვები ცხრილში' : 'დღიური ფინანსური მონაცემები ცხრილში' }}</summary>
        <div class="mt-3 max-h-[360px] overflow-auto [scrollbar-width:thin] [scrollbar-color:var(--accent-primary)_transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-surface [&::-webkit-scrollbar-thumb]:bg-accent-primary [&::-webkit-scrollbar-thumb:hover]:bg-accent-hover [&::-webkit-scrollbar-button]:hidden">
          <table class="w-full text-left text-xs">
            <thead class="sticky top-0 bg-surface-2"><tr><th class="p-3">თარიღი</th><template v-if="section === 'sales'"><th class="p-3 text-right">გადახდილი შეკვეთები</th><th class="p-3 text-right">გაყიდული ერთეულები</th></template><template v-else><th class="p-3 text-right">მიღებული თანხა</th><th class="p-3 text-right">დაბრუნებული თანხა</th><th class="p-3 text-right">პროდუქტების მოგება დღგ-ის გარეშე</th></template></tr></thead>
            <tbody><tr v-for="day in report.daily" :key="day.date" class="border-t border-border-default"><td class="whitespace-nowrap p-3">{{ reportDate(day.date) }}</td><template v-if="section === 'sales'"><td class="p-3 text-right">{{ reportNumber(day.paid_orders) }}</td><td class="p-3 text-right">{{ reportNumber(day.sold_units) }}</td></template><template v-else><td class="whitespace-nowrap p-3 text-right">{{ reportMoney(day.received) }}</td><td class="whitespace-nowrap p-3 text-right">{{ reportMoney(day.refunded) }}</td><td class="whitespace-nowrap p-3 text-right">{{ reportMoney(day.product_profit_net) }}</td></template></tr></tbody>
          </table>
        </div>
      </details>
    </template>

    <dialog ref="dialog" class="m-auto max-h-[calc(100dvh_-_48px)] w-[calc(100%_-_32px)] max-w-[520px] overflow-y-auto rounded-xl border border-border-default bg-surface p-6 text-text-primary backdrop:bg-black/55" aria-labelledby="business-sources-title" @cancel.prevent="closeDialog">
      <div class="flex items-center justify-between gap-4"><h2 id="business-sources-title" class="text-lg font-bold">მონაცემების წყაროები</h2><button type="button" class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-surface-2" aria-label="დახურვა" @click="closeDialog"><XMarkIcon class="h-5 w-5" aria-hidden="true" /></button></div>
      <div class="mt-5 space-y-3"><article class="rounded-lg border border-border-default p-4"><h3 class="text-sm font-semibold">FlexDrive-ის მონაცემები</h3><p class="mt-2 text-xs leading-5 text-text-muted">დაკავშირებულია: გადახდები, შეკვეთები, შეძენის ისტორიული ღირებულება და დაბრუნებების შემოწმება.</p></article><article class="rounded-lg border border-border-default p-4"><h3 class="text-sm font-semibold">Google Analytics და Meta</h3><p class="mt-2 text-xs text-text-muted">ანგარიშების წამოღება შემდეგ ეტაპებზე დაემატება.</p></article></div>
    </dialog>
  </section>
</template>
