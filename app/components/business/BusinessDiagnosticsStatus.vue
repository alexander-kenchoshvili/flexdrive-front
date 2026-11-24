<script setup lang="ts">
import { useBusinessResource } from "~/composables/useBusinessResource";
import type { AudienceReport } from "~/utils/businessAudience";
import type { BusinessPeriod } from "~/utils/businessReport";
import { metaUpdated } from "~/utils/businessMarketing";
const meta = useBusinessMarketing(), google = useBusinessAnalytics();
const audience = useBusinessResource<AudienceReport>("/business/audience/");
const status = (value?: string) => ({ ready: "მონაცემები მიღებულია", empty: "მიღებულია · წარმატებული ცარიელი პასუხი", partial: "ნაწილობრივი მონაცემები", stale: "ძველი პასუხი", unavailable: "მიუწვდომელია", not_configured: "არ არის დაკავშირებული", range_limit: "პერიოდი შეზღუდულია" } as Record<string, string>)[value || ""] || "ჯერ არ შემოწმებულა";
const load = (period: BusinessPeriod) => Promise.allSettled([meta.load(period), google.load(period), audience.load({ ...period })]);
const props = defineProps<{ period: BusinessPeriod }>();
onMounted(() => load(props.period));
watch(() => [props.period.start, props.period.end], () => load(props.period));
</script>
<template>
  <div>
    <p v-if="meta.loading.value || google.loading.value" role="status" class="my-4 text-sm">წყაროები მოწმდება…</p><p v-if="meta.errorMessage.value || google.errorMessage.value" role="alert" class="my-4 text-sm text-error">{{ meta.errorMessage.value || google.errorMessage.value }}</p>
    <section class="my-5 rounded-xl border border-border-default bg-surface p-5"><h2 class="font-bold">Google Analytics</h2><p class="mt-2 text-sm">{{ status(google.report.value?.status) }}</p><p class="mt-2 text-xs text-text-muted">{{ google.report.value?.message }} · მიღებულია: {{ metaUpdated(google.report.value?.fetched_at) || '—' }} · დღეები: {{ google.report.value?.report_timezone || 'უცნობია' }}</p><p class="mt-2 text-xs text-text-muted">ანგარიშები მხოლოდ flexdrive.ge-ს მოიცავს. Search Console-ის დამოუკიდებელი მდგომარეობა ჩანს Google-ის საძიებო სისტემის გვერდზე.</p></section>
    <section class="my-5 rounded-xl border border-border-default bg-surface p-5"><h2 class="font-bold">GA4 · ახალი და დაბრუნებული მომხმარებლები</h2><p class="mt-2 text-sm">{{ audience.loading.value ? "მოწმდება…" : status(audience.report.value?.status) }}</p><p class="mt-2 text-xs text-text-muted">{{ audience.errorMessage.value || audience.report.value?.message }} · მიღებულია: {{ metaUpdated(audience.report.value?.fetched_at) || "—" }}</p></section>
    <BusinessMetaTechnical v-if="meta.report.value" :report="meta.report.value" />
    <section v-if="meta.report.value" class="my-5 rounded-xl border border-border-default bg-surface p-5"><h2 class="font-bold">Meta-ს ანგარიშების მდგომარეობა</h2><dl class="mt-3 space-y-3 text-sm"><div><dt>რეკლამის ანგარიში</dt><dd>{{ status(meta.report.value.ads?.status) }} · {{ metaUpdated(meta.report.value.ads?.fetched_at) || '—' }}</dd></div><div><dt>Facebook</dt><dd>{{ status(meta.report.value.facebook?.activity.status) }} · {{ metaUpdated(meta.report.value.facebook?.activity.fetched_at) || '—' }}</dd></div><div><dt>Instagram</dt><dd>{{ status(meta.report.value.instagram?.activity.status) }} · {{ metaUpdated(meta.report.value.instagram?.activity.fetched_at) || '—' }}</dd></div></dl><p class="mt-4 text-xs leading-6 text-text-muted">{{ meta.report.value.message }}</p></section>
    <section class="my-5 rounded-xl border border-border-default bg-surface p-5"><h2 class="font-bold">GTM და მოვლენების მიღება</h2><p class="mt-2 text-xs leading-6 text-text-muted">ამ პანელში GTM-ის ცოცხალი ვერსია, ყველა ბრაუზერის მოვლენის მიღება და დუბლირების შედეგი ავტომატურად არ მოწმდება. დეტალური შემოწმება GTM-სა და Meta Events Manager-ში ხდება. „ჩართულია“ სრულ დაფარვას არ ნიშნავს.</p></section>
  </div>
</template>
