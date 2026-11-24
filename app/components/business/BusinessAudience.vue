<script setup lang="ts">
import { useBusinessResource } from "~/composables/useBusinessResource";
import type { AudienceReport } from "~/utils/businessAudience";
import { reportNumber, reportDate, type BusinessPeriod } from "~/utils/businessReport";
import { analyticsSource } from "~/utils/businessAnalytics";
import { metaUpdated } from "~/utils/businessMarketing";
const props = defineProps<{ period: BusinessPeriod }>();
const { report, loading, errorMessage, load } = useBusinessResource<AudienceReport>("/business/audience/");
onMounted(() => load({ ...props.period }));
watch(() => [props.period.start, props.period.end], () => load({ ...props.period }));
</script>
<template>
  <section class="my-6 min-w-0 rounded-xl border border-border-default bg-surface p-5" aria-label="ახალი და დაბრუნებული მომხმარებლები" :aria-busy="loading">
    <h2 class="text-lg font-bold">ახალი და დაბრუნებული მომხმარებლები</h2><p class="mt-1 text-xs text-accent-primary">წყარო: Google Analytics · მხოლოდ flexdrive.ge</p>
    <p v-if="loading" role="status" class="py-5 text-sm">იტვირთება…</p><p v-else-if="errorMessage" role="alert" class="py-5 text-sm text-error">{{ errorMessage }}</p>
    <template v-else-if="report"><p class="mt-3 text-xs leading-6 text-text-muted">{{ report.message }} {{ report.status === 'stale' ? 'ნაჩვენებია ძველი პასუხი.' : '' }} მიღებულია: {{ metaUpdated(report.fetched_at) || '—' }} · დღეები: {{ report.timezone || 'წყაროს დროის სარტყელი მიუწვდომელია' }}</p>
      <template v-if="report.new_users != null && report.returning_users != null">
        <dl class="my-5 grid grid-cols-2 gap-4"><div><dt class="text-xs">პირველად აღრიცხული</dt><dd class="mt-2 text-3xl font-bold">{{ reportNumber(report.new_users) }}</dd></div><div><dt class="text-xs">დაბრუნებული</dt><dd class="mt-2 text-3xl font-bold">{{ reportNumber(report.returning_users) }}</dd></div></dl>
        <p v-for="warning in report.warnings" :key="warning" class="my-2 text-xs text-text-muted">{{ warning }}</p>
        <details><summary class="cursor-pointer py-3 text-sm font-semibold">მომხმარებლები დღეების მიხედვით</summary><div class="max-h-[340px] overflow-auto"><table class="w-full text-left text-xs"><thead class="sticky top-0 bg-surface-2"><tr><th class="p-3">თარიღი</th><th class="p-3 text-right">ახალი</th><th class="p-3 text-right">დაბრუნებული</th></tr></thead><tbody><tr v-for="day in report.daily" :key="day.date" class="border-t border-border-default"><td class="p-3">{{ reportDate(day.date) }}</td><td class="p-3 text-right">{{ reportNumber(day.new_users) }}</td><td class="p-3 text-right">{{ reportNumber(day.returning_users) }}</td></tr></tbody></table></div></details>
        <h3 class="mt-5 font-semibold">საიდან მოვიდნენ პირველად</h3><p class="my-2 text-xs text-text-muted">პირველი 20 წყარო ახალი მომხმარებლებით · სესიის წყაროებისგან განსხვავებული დათვლაა.</p><div class="overflow-auto"><table class="w-full text-left text-xs"><thead><tr><th class="p-3">პირველი შემოსვლის წყარო / ტიპი</th><th class="p-3 text-right">ახალი მომხმარებლები</th></tr></thead><tbody><tr v-for="row in report.first_sources" :key="row.source" class="border-t border-border-default"><td class="p-3">{{ analyticsSource(row.source) }}</td><td class="p-3 text-right">{{ reportNumber(row.new_users) }}</td></tr></tbody></table></div>
        <p class="mt-4 text-xs leading-6 text-text-muted">პირველად Google-ის მიერ ამოცნობილი მომხმარებელია; რეგისტრაციას არ ნიშნავს. სხვა ბრაუზერმა ან წაშლილმა cookie-მ შეიძლება ახალ მომხმარებლად აღრიცხოს. ერთმა მომხმარებელმა პერიოდში ორივე ჯგუფში შეიძლება მოხვდეს; ჯგუფებსა და დღიურ უნიკალურ მომხმარებლებს არ ვაჯამებთ.</p>
      </template>
    </template>
  </section>
</template>
