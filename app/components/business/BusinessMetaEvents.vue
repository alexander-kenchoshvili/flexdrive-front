<script setup lang="ts">
import { useBusinessResource } from "~/composables/useBusinessResource";
import { businessToday, reportNumber, reportDate, type BusinessPeriod } from "~/utils/businessReport";
import { metaUpdated } from "~/utils/businessMarketing";
type Source = { status: string; fetched_at?: string | null; message?: string };
type EventRow = { event: string; label: string; browser: number | null; server: number | null };
type Report = { status: string; message?: string; sources?: Record<"browser" | "server", Source>; rows?: EventRow[]; daily?: { date: string; browser: number | null; server: number | null }[] };
const route = useRoute();
const today = businessToday();
const first = new Date(`${today}T00:00:00Z`); first.setUTCDate(first.getUTCDate() - 6);
const earliest = first.toISOString().slice(0, 10);
const period = computed<BusinessPeriod>(() => typeof route.query.start === "string" && typeof route.query.end === "string" ? { start: route.query.start, end: route.query.end } : { start: earliest, end: today });
const start = ref(period.value.start), end = ref(period.value.end), dateError = ref("");
const { report, loading, errorMessage, load } = useBusinessResource<Report>("/business/meta-events/");
const refresh = () => load({ ...period.value });
onMounted(refresh);
watch(period, (value) => { start.value = value.start; end.value = value.end; void refresh(); });
const apply = async (value = { start: start.value, end: end.value }) => {
  if (value.start < earliest || value.end > today || value.start > value.end || !value.start || !value.end) { dateError.value = "აირჩიეთ ბოლო 7 დღის ფარგლებში მოქცეული პერიოდი."; return; }
  dateError.value = "";
  if (period.value.start === value.start && period.value.end === value.end) await refresh();
  else await navigateTo({ path: route.path, query: { ...route.query, ...value } }, { replace: true });
};
const status = (value?: string) => ({ ready: "ანგარიში მიღებულია", empty: "მიღებულია · დაშვებული მოვლენები არ დაბრუნდა", stale: "ძველი პასუხი · განახლება ვერ მოხერხდა", unavailable: "ანგარიში მიუწვდომელია" } as Record<string, string>)[value || ""] || "ჯერ არ შემოწმებულა";
const sources = [{ key: "browser", title: "ბრაუზერი · Pixel" }, { key: "server", title: "სერვერი · CAPI" }] as const;
</script>

<template>
  <section aria-labelledby="meta-events-title" :aria-busy="loading" class="min-w-0">
    <header class="flex flex-wrap items-start justify-between gap-4"><div><p class="text-xs font-semibold text-accent-primary">წყარო: Meta · FlexDrive Web Pixel</p><h1 id="meta-events-title" class="mt-2 text-2xl font-bold md:text-3xl">საიტის მოვლენები · Pixel და CAPI</h1><p class="mt-3 max-w-3xl text-sm leading-7 text-text-secondary">Meta-ს მიერ დაბრუნებული მოვლენების რაოდენობები. რეკლამას მიწერილი შედეგები ცალკე, კამპანიებშია.</p></div><a href="https://eventsmanager.facebook.com/events_manager2/list/dataset/1020718363721235/overview?business_id=1761419678356905" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-[44px] items-center rounded-lg border border-border-default px-4 text-xs font-semibold">Events Manager ↗</a></header>
    <form class="my-5 rounded-xl border border-border-default bg-surface p-5" @submit.prevent="apply()"><div class="business-period-controls flex flex-wrap items-end gap-3"><label class="text-xs font-semibold">საწყისი თარიღი<input v-model="start" type="date" required :min="earliest" :max="today" class="mt-2 block min-h-[44px] rounded-lg border border-border-default bg-bg-primary p-2"></label><label class="text-xs font-semibold">საბოლოო თარიღი<input v-model="end" type="date" required :min="earliest" :max="today" class="mt-2 block min-h-[44px] rounded-lg border border-border-default bg-bg-primary p-2"></label><BaseButton type="submit" :disabled="loading">ჩვენება / განახლება</BaseButton><button type="button" class="min-h-[44px] px-3 text-xs underline" @click="apply({ start: earliest, end: today })">ბოლო 7 დღე</button><button type="button" class="min-h-[44px] px-3 text-xs underline" @click="apply({ start: today, end: today })">დღეს</button></div><p v-if="dateError" role="alert" class="mt-3 text-xs text-error">{{ dateError }}</p><p class="mt-3 text-xs leading-6 text-text-muted">ანგარიში ბოლო 7 დღეს მოიცავს · დღეები თბილისის დროით. დღევანდელი დღე არასრულია; Meta-ს დამუშავება შეიძლება დაგვიანდეს.</p></form>
    <p v-if="loading" role="status" class="py-6 text-sm text-text-muted">Meta-ს მოვლენები იტვირთება…</p><p v-else-if="errorMessage" role="alert" class="rounded-xl border border-border-default bg-surface p-5 text-sm">{{ errorMessage }}</p>
    <template v-else-if="report">
      <p v-if="report.message" role="status" class="mb-4 rounded-xl border border-border-default bg-surface p-5 text-sm">{{ report.message }}</p>
      <p v-if="report.status === 'unavailable'" role="status" class="mb-4 text-sm">Meta-მ რაოდენობები არ დააბრუნა. ეს ნულოვან მოვლენებს არ ნიშნავს; ქვემოთ ჩანს თითოეული წყაროს მდგომარეობა.</p>
      <div v-if="report.sources" class="mb-5 grid gap-4 sm:grid-cols-2"><article v-for="source in sources" :key="source.key" class="min-w-0 rounded-xl border border-border-default bg-surface p-5"><h2 class="font-bold">{{ source.title }}</h2><p class="mt-2 text-sm">{{ status(report.sources[source.key].status) }}</p><p class="mt-2 text-xs leading-6 text-text-muted">{{ report.sources[source.key].message }} მიღებულია: {{ metaUpdated(report.sources[source.key].fetched_at) || '—' }}</p></article></div>
      <section v-if="report.rows?.length" class="overflow-hidden rounded-xl border border-border-default bg-surface" aria-label="მოვლენები წყაროების მიხედვით"><div class="overflow-x-auto"><table class="w-full text-left text-sm"><thead class="bg-surface-2 text-xs text-text-muted"><tr><th scope="col" class="p-4">მოვლენა</th><th scope="col" class="p-4 text-right">ბრაუზერი · Pixel</th><th scope="col" class="p-4 text-right">სერვერი · CAPI</th></tr></thead><tbody><tr v-for="row in report.rows" :key="row.event" class="border-t border-border-default"><th scope="row" class="p-4 font-semibold">{{ row.label }}<span class="mt-1 block text-xs font-normal text-text-muted">{{ row.event }}</span></th><td class="p-4 text-right font-bold tabular-nums">{{ reportNumber(row.browser) }}</td><td class="p-4 text-right font-bold tabular-nums">{{ reportNumber(row.server) }}</td></tr></tbody></table></div></section>
      <details v-if="report.daily?.length" class="mt-5 rounded-xl border border-border-default bg-surface p-5"><summary class="cursor-pointer font-semibold">ამ მოვლენების რაოდენობები დღეების მიხედვით</summary><div class="mt-3 overflow-x-auto"><table class="w-full text-left text-xs"><thead><tr><th class="p-3">დღე</th><th class="p-3 text-right">ბრაუზერი</th><th class="p-3 text-right">სერვერი</th></tr></thead><tbody><tr v-for="day in report.daily" :key="day.date" class="border-t border-border-default"><td class="p-3">{{ reportDate(day.date) }}</td><td class="p-3 text-right">{{ reportNumber(day.browser) }}</td><td class="p-3 text-right">{{ reportNumber(day.server) }}</td></tr></tbody></table></div></details>
    </template>
    <footer class="mt-5 space-y-2 text-xs leading-6 text-text-muted"><p>ერთმა ადამიანმა ერთი მოვლენა რამდენჯერმე შეიძლება გამოიწვიოს. ბრაუზერისა და სერვერის რიცხვებს არ ვაჯამებთ: იგივე შეძენა ორივე წყაროდან შეიძლება იყოს გაგზავნილი. ეს ცხრილი დუბლირების მოცილებას ან უნიკალური მყიდველების რაოდენობას არ ადასტურებს.</p><p>ეს მთლიანი Pixel dataset-ის სტატისტიკაა და დომენით გაფილტრული არ არის. თუ სატესტო საიტიც ამ Pixel-ს იყენებს, მისი მოვლენებიც შეიძლება შედიოდეს.</p><p>სად შეჩერდა ყიდვა და რატომ ვერ შესრულდა გადახდა, ნახეთ <NuxtLink to="/business/carts?tab=checkout" class="underline">დაწყებულ ყიდვებში</NuxtLink> და <NuxtLink to="/business/payments" class="underline">გადახდის პრობლემებში</NuxtLink>.</p></footer>
  </section>
</template>
