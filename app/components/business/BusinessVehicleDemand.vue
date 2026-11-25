<script setup lang="ts">
import { businessPreset, reportNumber, reportDate } from "~/utils/businessReport";
import type { BusinessPeriod } from "~/utils/businessReport";
const route = useRoute();
const { report, loading, errorMessage, load } = useBusinessVehicleDemand();
const readPeriod = (): BusinessPeriod => typeof route.query.start === "string" && typeof route.query.end === "string"
  ? { start: route.query.start, end: route.query.end } : businessPreset("month");
const initial = readPeriod();
const start = ref(initial.start), end = ref(initial.end), dateError = ref("");
const apply = async (period: BusinessPeriod = { start: start.value, end: end.value }) => {
  if (!period.start || !period.end || period.start > period.end) { dateError.value = "აირჩიე სწორი საწყისი და საბოლოო თარიღები."; return; }
  dateError.value = ""; start.value = period.start; end.value = period.end;
  if (route.query.start === period.start && route.query.end === period.end) await load(period);
  else await navigateTo({ path: route.path, query: period }, { replace: true });
};
onMounted(() => load(readPeriod()));
watch(() => [route.query.start, route.query.end], () => { const period = readPeriod(); start.value = period.start; end.value = period.end; void load(period); });
const cards = computed(() => [
  { label: "ძიების სესიები", value: report.value?.summary.visits, note: "ვიზიტები, რომლებშიც მანქანის მახასიათებლები აირჩიეს." },
  { label: "მოდელი / წლის კომბინაციები", value: report.value?.row_count, note: "რამდენ განსხვავებულ მანქანასა და წელს ეძებდნენ." },
  { label: "უშედეგო ძიების სესიები", value: report.value?.summary.no_results, note: "ერთ-ერთ კატალოგის ძიებაში შედეგი ვერ მიიღეს." },
]);
</script>

<template>
  <div class="min-w-0">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div><p class="text-xs font-semibold text-accent-primary">მომხმარებლების ინტერესი</p><h1 class="mt-2 text-2xl font-bold md:text-3xl">რა მანქანების ნაწილებს ეძებენ</h1><p class="mt-3 max-w-3xl text-sm leading-7 text-text-secondary">VIN-ით ამოცნობილი და კატალოგში არჩეული მანქანები. ნახე, რომელი მარკა, მოდელი და წელი აინტერესებთ ყველაზე ხშირად.</p></div>
      <button type="button" class="min-h-[44px] rounded-lg border border-border-default bg-surface px-4 py-2 text-sm disabled:opacity-50" :disabled="loading" @click="load(readPeriod())">განახლება</button>
    </header>
    <form class="business-period-controls mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-border-default bg-surface p-4" @submit.prevent="apply()">
      <label class="grid gap-2 text-xs font-semibold">საწყისი თარიღი<input v-model="start" type="date" required class="min-h-[44px] rounded-lg border border-border-default bg-bg-primary px-3 text-sm" /></label>
      <label class="grid gap-2 text-xs font-semibold">საბოლოო თარიღი<input v-model="end" type="date" required class="min-h-[44px] rounded-lg border border-border-default bg-bg-primary px-3 text-sm" /></label>
      <button type="submit" class="min-h-[44px] rounded-lg bg-accent-primary px-5 text-sm font-bold text-text-invert" :disabled="loading">ჩვენება</button>
      <button type="button" class="min-h-[44px] px-3 text-xs text-text-secondary" @click="apply(businessPreset('month'))">ამ თვეში</button>
    </form>
    <p v-if="dateError" class="mt-3 text-sm text-error" role="alert">{{ dateError }}</p>
    <p v-if="loading" class="py-10 text-sm text-text-muted" role="status">მანქანების მოთხოვნა იტვირთება…</p>
    <p v-else-if="errorMessage" class="mt-5 rounded-xl border border-error/30 bg-surface p-5 text-sm text-error" role="alert">{{ errorMessage }}</p>
    <template v-else-if="report">
      <div class="mt-6 grid gap-4 sm:grid-cols-3"><section v-for="card in cards" :key="card.label" class="rounded-xl border border-border-default bg-surface p-5"><p class="text-xs font-semibold text-text-secondary">{{ card.label }}</p><p class="mt-3 text-3xl font-bold tabular-nums">{{ reportNumber(card.value) }}</p><p class="mt-2 text-xs leading-6 text-text-muted">{{ card.note }}</p></section></div>
      <section class="mt-6 rounded-xl border border-accent-primary/25 bg-accent-primary/5 p-5 md:p-6" aria-labelledby="vehicle-demand-insights"><h2 id="vehicle-demand-insights" class="text-lg font-bold">მოკლე შეჯამება</h2><ul class="mt-3 space-y-3"><li v-for="insight in report.insights" :key="insight" class="text-sm leading-7 text-text-secondary">{{ insight }}</li></ul></section>
      <section class="mt-6 min-w-0 overflow-hidden rounded-xl border border-border-default bg-surface" aria-labelledby="vehicle-demand-table">
        <div class="p-5"><h2 id="vehicle-demand-table" class="text-lg font-bold">მანქანები მოთხოვნის მიხედვით</h2><p class="mt-2 text-xs leading-6 text-text-muted">{{ reportDate(report.period.start) }} — {{ reportDate(report.period.end) }} · ყველაზე მოთხოვნადი {{ Math.min(report.row_count, 100) }} კომბინაცია</p></div>
        <div v-if="report.rows.length" tabindex="0" role="region" aria-labelledby="vehicle-demand-table" class="max-h-[min(60vh,560px)] overflow-auto overscroll-contain focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-primary"><table class="w-full text-left text-sm"><thead class="sticky top-0 z-10 border-y border-border-default bg-surface-2 text-xs text-text-secondary"><tr><th class="p-4">მარკა</th><th class="p-4">მოდელი</th><th class="p-4">წელი</th><th class="p-4 text-right">ძიების სესიები</th><th class="p-4 text-right">VIN გამოიყენეს</th><th class="p-4 text-right">უშედეგო ძიებით</th></tr></thead><tbody><tr v-for="row in report.rows" :key="`${row.make}|${row.model}|${row.year}`" class="border-b border-border-default last:border-0"><td class="whitespace-nowrap p-4 font-semibold">{{ row.make }}</td><td class="min-w-[120px] p-4">{{ row.model }}</td><td class="whitespace-nowrap p-4">{{ row.year ?? 'არ არის არჩეული' }}</td><td class="p-4 text-right font-bold tabular-nums">{{ reportNumber(row.visits) }}</td><td class="p-4 text-right tabular-nums">{{ reportNumber(row.vin_visits) }}</td><td class="p-4 text-right tabular-nums">{{ reportNumber(row.no_results) }}</td></tr></tbody></table></div>
        <p v-else class="px-5 pb-6 text-sm leading-7 text-text-muted">ჩანაწერები გამოჩნდება რეალური ძიებების დაგროვების შემდეგ. ძველი VIN-ების ისტორია არ ინახებოდა.</p>
      </section>
      <footer class="mt-5 space-y-2 text-xs leading-6 text-text-muted"><p>ერთი სესიის განმეორებითი ძიება იმავე მოდელსა და წელზე ერთხელ ითვლება. ერთ სესიაში რამდენიმე მანქანა შეიძლება მოძებნონ, ამიტომ სტრიქონების ჯამი საერთო სესიების რაოდენობას შეიძლება აღემატებოდეს.</p><p>აღირიცხება მხოლოდ ანალიტიკაზე თანხმობით, მთავარ დომენზე. ლოკალური და ბიზნესპანელის ბრაუზერის ტესტები გამოირიცხება. ამ ანგარიშისთვის სრული VIN, სახელი, ელფოსტა, ტელეფონი, IP მისამართი და საძიებო ტექსტი არ ინახება. ეს არის ინტერესის მაჩვენებელი და არა მანქანის მფლობელთა სია.</p><p v-if="report.collection_started_at">აღრიცხვის პირველი ჩანაწერი: {{ reportDate(report.collection_started_at.slice(0, 10)) }}.</p></footer>
    </template>
  </div>
</template>
