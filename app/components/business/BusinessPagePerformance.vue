<script setup lang="ts">
import BusinessPageDetails from "./BusinessPageDetails.vue";
import type { BusinessPeriod } from "~/utils/businessReport";
import { reportNumber } from "~/utils/businessReport";
import type { PageRow } from "~/utils/businessPages";
import { activeTime, pageReportReady, publicPageName } from "~/utils/businessPages";
import { metaUpdated } from "~/utils/businessMarketing";
const props = defineProps<{ period: BusinessPeriod }>();
const { report, loading, errorMessage, load } = useBusinessPages();
const { report: detail, loading: detailLoading, errorMessage: detailError, load: loadDetail, clear: clearDetail } = useBusinessPages();
const draft = ref(""), query = ref(""), page = ref(1), selected = ref<PageRow | null>(null);
const detailTarget = ref<HTMLElement | null>(null);
const ready = computed(() => pageReportReady(report.value));
const totalPages = computed(() => Math.max(1, Math.ceil((report.value?.row_count || 0) / (report.value?.page_size || 20))));
const closeDetail = () => { selected.value = null; clearDetail(); };
const refreshDetail = () => { if (selected.value) void loadDetail(props.period, { path: selected.value.path }); };
const refresh = () => { void load(props.period, { q: query.value, page: page.value }); refreshDetail(); };
const search = () => {
  query.value = draft.value.trim(); page.value = 1; closeDetail();
  void load(props.period, { q: query.value, page: page.value });
};
const changePage = (value: number) => {
  if (value < 1 || value > totalPages.value) return;
  page.value = value; closeDetail(); void load(props.period, { q: query.value, page: value });
};
const selectPage = async (row: PageRow) => {
  selected.value = row; refreshDetail();
  await nextTick(); detailTarget.value?.scrollIntoView({ block: "nearest" });
};
onMounted(refresh);
watch(() => [props.period.start, props.period.end], () => {
  page.value = 1; clearDetail(); refresh();
});
</script>

<template>
  <section class="my-6 min-w-0 overflow-hidden rounded-xl border border-border-default bg-surface p-4 md:p-6" aria-labelledby="page-performance-title" :aria-busy="loading">
    <div class="flex flex-wrap items-center justify-between gap-3"><h2 id="page-performance-title" class="text-lg font-bold">რომელ გვერდებს ნახულობენ</h2><button type="button" :disabled="loading" class="min-h-[44px] rounded-lg border border-border-default px-4 py-2 text-xs disabled:opacity-50" @click="refresh">განახლება</button></div>
    <p class="mt-2 text-xs leading-6 text-text-muted">მთავარი, ბლოგები, კატალოგი, პროდუქტები, კატეგორიები და შერჩეული საინფორმაციო გვერდები. აირჩიე გვერდი მისი შემოსვლის წყაროებისა და დღიური მონაცემების სანახავად. განმეორებითი ნახვებიც ითვლება.</p>
    <form class="mt-4 flex flex-wrap items-end gap-2" role="search" aria-label="ანალიტიკაში გვერდის ძებნა" @submit.prevent="search">
      <label class="flex min-w-0 flex-1 basis-[220px] flex-col gap-2 text-xs font-semibold">გვერდის ძებნა<input v-model="draft" type="search" maxlength="120" placeholder="სათაური ან მისამართი, მაგალითად Subaru" class="min-h-[44px] w-full min-w-0 rounded-lg border border-border-default bg-bg-primary px-3 py-2 text-sm text-text-primary" /></label>
      <button type="submit" :disabled="loading" class="min-h-[44px] rounded-lg border border-border-default px-4 py-2 text-xs disabled:opacity-50">ძებნა</button><button v-if="query || draft" type="button" :disabled="loading" class="min-h-[44px] rounded-lg border border-border-default px-3 py-2 text-xs disabled:opacity-50" @click="draft = ''; search()">გასუფთავება</button>
    </form>
    <div v-if="selected" ref="detailTarget"><BusinessPageDetails :row="selected" :report="detail" :loading="detailLoading" :error-message="detailError" @close="closeDetail" @refresh="refreshDetail" /></div>
    <p v-if="loading" role="status" class="py-6 text-sm text-text-muted">გვერდების ანგარიში იტვირთება…</p>
    <p v-else-if="errorMessage" role="alert" class="mt-4 text-sm text-error">{{ errorMessage }}</p>
    <template v-else-if="ready && report">
      <p class="mt-3 text-xs leading-6 text-text-muted">მიღებულია: {{ metaUpdated(report.fetched_at) }} · {{ report.timezone || 'წყაროს დროის სარტყელი უცნობია' }} <span v-if="!report.search_too_broad">· {{ query ? 'ძიების შედეგი' : 'სულ' }} {{ reportNumber(report.row_count) }} გვერდი</span> <strong v-if="report.status === 'stale'" class="text-error">· ძველი პასუხი</strong></p>
      <p v-if="report.message" class="mt-2 text-xs leading-6 text-text-muted">{{ report.message }}</p>
      <p v-if="report.search_too_broad" role="status" class="py-6 text-sm text-text-muted">ძიებას 500-ზე მეტი გვერდი ემთხვევა. მიუთითე უფრო ზუსტი სათაური ან მისამართი.</p>
      <template v-else>
        <div v-if="report.rows?.length" class="mt-4 max-h-[480px] overflow-auto [scrollbar-width:thin]">
          <table class="w-full text-left text-xs"><thead class="sticky top-0 bg-surface-2"><tr><th class="p-3">გვერდი</th><th class="p-3 text-right">მომხმარებლები</th><th class="p-3 text-right">ვიზიტები</th><th class="p-3 text-right">ნახვები</th><th class="p-3 text-right">საშ. აქტიური დრო</th></tr></thead>
            <tbody><tr v-for="row in report.rows" :key="row.path" class="border-t border-border-default" :class="selected?.path === row.path ? 'bg-surface-2' : ''"><td class="min-w-[200px] max-w-[420px] break-words p-3"><button type="button" class="min-h-[44px] w-full rounded text-left font-semibold text-accent-primary underline decoration-accent-primary/40 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary" aria-controls="page-detail" :aria-expanded="selected?.path === row.path" @click="selectPage(row)">{{ row.title || publicPageName(row.path) }}</button><p class="mt-1 text-text-muted">{{ publicPageName(row.path) }}</p><p class="mt-1 break-all text-text-muted">{{ row.path }}</p></td><td class="p-3 text-right tabular-nums">{{ reportNumber(row.users) }}</td><td class="p-3 text-right tabular-nums">{{ reportNumber(row.sessions) }}</td><td class="p-3 text-right tabular-nums">{{ reportNumber(row.views) }}</td><td class="whitespace-nowrap p-3 text-right tabular-nums">{{ activeTime(row.average_active_seconds) }}</td></tr></tbody>
          </table>
        </div>
        <p v-else class="py-6 text-sm text-text-muted">{{ query ? 'ამ პერიოდში ძიებას არცერთი აღრიცხული გვერდი არ ემთხვევა.' : 'ამ პერიოდში საჯარო გვერდების ჩანაწერები არ არის.' }}</p>
        <nav v-if="totalPages > 1" class="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs" aria-label="ანალიტიკის გვერდები"><button type="button" :disabled="loading || page <= 1" class="min-h-[44px] rounded-lg border border-border-default px-3 py-2 disabled:opacity-50" @click="changePage(page - 1)">წინა</button><span>{{ reportNumber(page) }} / {{ reportNumber(totalPages) }}</span><button type="button" :disabled="loading || page >= totalPages" class="min-h-[44px] rounded-lg border border-border-default px-3 py-2 disabled:opacity-50" @click="changePage(page + 1)">შემდეგი</button></nav>
      </template>
      <p v-for="warning in report.warnings" :key="warning" class="mt-3 text-xs leading-6 text-text-muted">{{ warning }}</p>
    </template>
    <p v-else class="mt-4 text-sm leading-6 text-text-muted">{{ report?.message || 'ამ გარემოში გვერდების ანგარიში ჯერ მიუწვდომელია. ეს ნულოვან ნახვებს არ ნიშნავს.' }}</p>
    <p class="mt-4 border-t border-border-default pt-4 text-xs leading-6 text-text-muted">აქტიური დრო: ჯამური აქტიური წამები / აქტიური მომხმარებლები; ეს საიტზე ყოფნის სრული დრო არ არის. სხვადასხვა გვერდის მომხმარებლებს საერთო რაოდენობად არ ვაჯამებთ. სათაურები Google-ის აღრიცხვიდან მოდის; პირადი შეკვეთების მისამართები არ ჩანს. Google-ის დამუშავებას 24–48 საათი შეიძლება დასჭირდეს.</p>
  </section>
</template>
