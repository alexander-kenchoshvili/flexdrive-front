<script setup lang="ts">
import { reportDate, reportNumber, type BusinessPeriod } from "~/utils/businessReport";
import { deviceShare } from "~/utils/businessDevices";
import { metaUpdated } from "~/utils/businessMarketing";
import { useBusinessDevices } from "~/composables/useBusinessDevices";

const props = defineProps<{ period: BusinessPeriod }>();
const { report, loading, errorMessage, load } = useBusinessDevices();
onMounted(() => load(props.period));
watch(() => [props.period.start, props.period.end], () => load(props.period));
const ready = computed(() => report.value && ["ready", "stale"].includes(report.value.status));
</script>

<template>
  <section class="my-6 min-w-0 overflow-hidden rounded-xl border border-border-default bg-surface p-4 md:p-6" aria-labelledby="devices-title" :aria-busy="loading">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 id="devices-title" class="text-lg font-bold">მობილურით შემოდიან თუ კომპიუტერით?</h2>
      <button type="button" :disabled="loading" class="min-h-[44px] rounded-lg border border-border-default px-4 py-2 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary disabled:opacity-50" @click="load(period)">განახლება</button>
    </div>
    <p class="mt-2 text-xs leading-6 text-text-muted">ვიზიტები და შესყიდვები მოწყობილობების მიხედვით · Google Analytics. პროცენტები თითოეული სვეტის საერთო რაოდენობიდან ითვლება.</p>
    <p v-if="loading" role="status" class="py-6 text-sm text-text-muted">მოწყობილობების ანგარიში იტვირთება…</p>
    <p v-else-if="errorMessage" role="alert" class="mt-4 text-sm text-error">{{ errorMessage }}</p>
    <template v-else-if="ready && report">
      <p class="mt-3 text-xs leading-6 text-text-muted">პერიოდი: {{ reportDate(report.period.start) }} — {{ reportDate(report.period.end) }} · წყაროს დროის სარტყელი: {{ report.timezone || 'უცნობია' }}</p>
      <p class="text-xs leading-6 text-text-muted">მიღებულია: {{ metaUpdated(report.fetched_at) }} · თბილისის დრო <strong v-if="report.status === 'stale'" class="text-error">· ძველი პასუხი</strong></p>
      <p v-if="report.message" class="mt-2 text-xs leading-6 text-text-muted">{{ report.message }}</p>
      <div v-if="report.rows?.length" class="mt-4 overflow-x-auto [scrollbar-width:thin]">
        <table class="w-full text-left text-xs">
          <caption class="sr-only">ვიზიტები და Google-ში აღრიცხული შესყიდვები მოწყობილობების მიხედვით</caption>
          <thead class="bg-surface-2"><tr><th scope="col" class="p-3">მოწყობილობა</th><th scope="col" class="p-3 text-right">ვიზიტები</th><th scope="col" class="p-3 text-right">ვიზიტების წილი</th><th scope="col" class="p-3 text-right">შესყიდვები Google-ში</th><th scope="col" class="p-3 text-right">შესყიდვების წილი</th></tr></thead>
          <tbody><tr v-for="row in report.rows" :key="row.category" class="border-t border-border-default">
            <th scope="row" class="min-w-[150px] p-3 font-semibold">{{ row.label }}</th>
            <td class="p-3 text-right tabular-nums">{{ reportNumber(row.sessions) }}</td><td class="p-3 text-right tabular-nums">{{ deviceShare(row.session_share) }}</td>
            <td class="p-3 text-right tabular-nums">{{ reportNumber(row.purchases) }}</td><td class="p-3 text-right tabular-nums">{{ deviceShare(row.purchase_share) }}</td>
          </tr></tbody>
          <tfoot v-if="report.totals" class="border-t border-border-default font-semibold"><tr><th scope="row" class="p-3">სულ აღრიცხულია</th><td class="p-3 text-right tabular-nums">{{ reportNumber(report.totals.sessions) }}</td><td class="p-3 text-right">{{ report.totals.sessions ? '100%' : '—' }}</td><td class="p-3 text-right tabular-nums">{{ reportNumber(report.totals.purchases) }}</td><td class="p-3 text-right">{{ report.totals.purchases ? '100%' : '—' }}</td></tr></tfoot>
        </table>
      </div>
      <p v-if="report.totals?.purchases === 0" class="mt-3 text-xs leading-6 text-text-muted">ამ პერიოდში Google-ში შესყიდვები არ დაფიქსირებულა. ეს რეალური შეკვეთების არქონას არ ნიშნავს.</p>
      <p v-for="warning in report.warnings" :key="warning" class="mt-3 text-xs leading-6 text-text-muted">{{ warning }}</p>
    </template>
    <p v-else class="mt-4 text-sm leading-6 text-text-muted">{{ report?.message || 'მოწყობილობების ანგარიში ჯერ მიუწვდომელია. ეს ნულოვან ვიზიტებს ან შესყიდვებს არ ნიშნავს.' }}</p>
    <p class="mt-4 border-t border-border-default pt-4 text-xs leading-6 text-text-muted">ვიზიტებში ერთი ადამიანის განმეორებითი შემოსვლებიც ითვლება. შესყიდვები Google-ში მიღებული purchase მოვლენებია და ფინანსური შეკვეთების სრულ რაოდენობას შეიძლება არ ემთხვეოდეს: გავლენას ახდენს თანხმობა, ბრაუზერის შეზღუდვები და მონაცემების დაგვიანება. ეს შეძენის მოწყობილობაა; წინა ვიზიტები სხვა მოწყობილობით შეიძლებოდა ყოფილიყო. კომპიუტერი და ლეპტოპი ერთ ჯგუფშია. ანგარიში კონკრეტული შეკვეთის მოწყობილობას არ ადგენს.</p>
  </section>
</template>
