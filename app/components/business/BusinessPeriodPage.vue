<script setup lang="ts">
import { businessPreset, businessToday, type BusinessPeriod } from "~/utils/businessReport";
defineProps<{ title: string; source: string; description?: string }>();
const route = useRoute();
const period = computed<BusinessPeriod>(() => typeof route.query.start === "string" && typeof route.query.end === "string" ? { start: route.query.start, end: route.query.end } : businessPreset("month"));
const start = ref(period.value.start), end = ref(period.value.end), error = ref(""), refreshKey = ref(0);
watch(period, (value) => { start.value = value.start; end.value = value.end; });
const apply = async (value = { start: start.value, end: end.value }) => {
  if (!value.start || !value.end || value.start > value.end || value.end > businessToday() || (Date.parse(value.end) - Date.parse(value.start)) / 86400000 >= 366) { error.value = "აირჩიეთ სწორი პერიოდი, მაქსიმუმ 366 დღე, დღევანდელ დღემდე."; return; }
  error.value = "";
  if (route.query.start === value.start && route.query.end === value.end) refreshKey.value++;
  else await navigateTo({ path: route.path, query: { ...route.query, ...value } }, { replace: true });
};
</script>
<template>
  <section aria-labelledby="business-page-title"><p class="text-xs font-semibold text-accent-primary">წყარო: {{ source }}</p><h1 id="business-page-title" class="mt-2 text-2xl font-bold md:text-3xl">{{ title }}</h1><p v-if="description" class="mt-2 text-sm leading-6 text-text-muted">{{ description }}</p>
    <form class="my-5 rounded-xl border border-border-default bg-surface p-5" @submit.prevent="apply()"><div class="business-period-controls flex flex-wrap items-end gap-3"><label class="text-xs font-semibold">საწყისი თარიღი<input v-model="start" type="date" required :max="businessToday()" class="mt-2 block min-h-[44px] max-w-full rounded-lg border border-border-default bg-bg-primary p-2"></label><label class="text-xs font-semibold">საბოლოო თარიღი<input v-model="end" type="date" required :max="businessToday()" class="mt-2 block min-h-[44px] max-w-full rounded-lg border border-border-default bg-bg-primary p-2"></label><BaseButton type="submit">ჩვენება / განახლება</BaseButton></div><div class="mt-3 flex flex-wrap gap-2"><button v-for="preset in [{ key: 'month', label: 'მიმდინარე თვე' }, { key: 'previous', label: 'წინა თვე' }, { key: '30days', label: 'ბოლო 30 დღე' }] as const" :key="preset.key" type="button" class="min-h-[44px] rounded-lg border border-border-default px-3 text-xs" @click="apply(businessPreset(preset.key))">{{ preset.label }}</button></div><p v-if="error" role="alert" class="mt-3 text-xs text-error">{{ error }}</p></form>
    <p v-if="period.end === businessToday()" class="mb-4 text-xs text-text-muted">დღევანდელი დღე ჯერ არ დასრულებულა; წყაროს დამუშავებაც შეიძლება დაგვიანდეს. პერიოდები წყაროს დროის სარტყლით იკითხება.</p>
    <slot :period="period" :refresh-key="refreshKey" />
  </section>
</template>
