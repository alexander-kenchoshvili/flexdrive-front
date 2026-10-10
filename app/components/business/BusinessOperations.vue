<script setup lang="ts">
import { ArrowPathIcon, ArrowUturnLeftIcon, CubeIcon, ClockIcon, ExclamationCircleIcon, InformationCircleIcon } from "@heroicons/vue/24/outline";
import { operationsDate, operationsMoney, operationsQuery, type ReturnFilter, type PaymentFilter } from "~/utils/businessOperations";
import { reportMoney, reportNumber } from "~/utils/businessReport";

const { report, loading, errorMessage, load } = useBusinessOperations();
const query = reactive(operationsQuery());
const refresh = async () => {
  await load({ ...query });
  if (report.value) {
    query.returns_page = report.value.returns.page;
    query.stock_page = report.value.stock.page;
    query.payments_page = report.value.payments.page;
  }
};
onMounted(refresh);
const returnFilters: { value: ReturnFilter; label: string }[] = [
  { value: "awaiting", label: "მიღების მოლოდინში" }, { value: "received", label: "მიღებულია" },
  { value: "not_required", label: "მიღება საჭირო არ არის" }, { value: "all", label: "ყველა დაბრუნება" },
];
const paymentFilters: { value: PaymentFilter; label: string }[] = [
  { value: "attention", label: "მოლოდინი და პრობლემები" }, { value: "pending", label: "დაუსრულებელი მოქმედებები" },
  { value: "failed", label: "წარუმატებელი მოქმედებები" }, { value: "issues", label: "გადასამოწმებელი ჩანაწერები" },
];
const paymentHints: Record<PaymentFilter, string> = {
  attention: "მოლოდინში მყოფი, წარუმატებელი და შენახული პრობლემის მქონე მოქმედებები.",
  pending: "დადასტურების მოლოდინი, თანხის ავტორიზაცია ან თანხის დაბრუნების მოლოდინი. ავტორიზაცია ნიშნავს თანხის დროებით დაბლოკვას საბოლოო ჩამოჭრამდე.",
  failed: "წარუმატებელი მცდელობები. იმავე შეკვეთაზე შემდგომი მცდელობა შეიძლება წარმატებული იყოს.",
  issues: "შენახული გადამოწმების საჭიროება, მათ შორის გადახდა დაკავშირებული შეკვეთის გარეშე.",
};
const changeFilter = (kind: "returns" | "payments", value: string | number | null) => {
  if (kind === "returns") {
    const filter = returnFilters.find((item) => item.value === value);
    if (!filter || filter.value === query.returns) return;
    query.returns = filter.value;
  } else {
    const filter = paymentFilters.find((item) => item.value === value);
    if (!filter || filter.value === query.payments) return;
    query.payments = filter.value;
  }
  query[`${kind}_page`] = 1;
  void refresh();
};
const turnPage = (kind: "returns" | "stock" | "payments", direction: number) => {
  const page = report.value?.[kind];
  if (!page) return;
  query[`${kind}_page`] = Math.min(page.pages, Math.max(1, page.page + direction));
  void refresh();
};
const age = (value: number | null) => value === null ? "—" : `${reportNumber(value)} დღე`;
</script>

<template>
  <section aria-labelledby="business-operations-title" :aria-busy="loading">
    <header class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
      <div><p class="mb-2 text-[11px] font-bold text-accent-primary">FLEXDRIVE · ოპერაციები</p><h1 id="business-operations-title" class="text-[28px] font-extrabold leading-9 min-[1440px]:text-4xl">ყოველდღიური ოპერაციები</h1><p class="mt-2 max-w-[720px] text-[13px] leading-5 text-text-muted">დაბრუნებები, საკუთარი მარაგი, გადახდები და სინქრონიზაციების ბოლო ცნობილი შედეგები.</p></div>
      <BaseButton variant="secondary" :disabled="loading" @click="refresh"><ArrowPathIcon class="h-5 w-5" :class="loading ? 'animate-spin motion-reduce:animate-none' : ''" aria-hidden="true" /> განახლება</BaseButton>
    </header>
    <div class="mb-6 flex flex-col gap-2 border-y border-border-default py-4 text-xs text-text-muted sm:flex-row sm:items-start sm:justify-between">
      <p class="flex max-w-[680px] items-start gap-2 leading-5"><InformationCircleIcon class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> მიმდინარე მდგომარეობა და შენახული ისტორია · არსებული სატესტო ჩანაწერებიც შედის.</p>
      <p v-if="report" class="shrink-0 leading-5">განახლდა {{ operationsDate(report.generated_at) }} · თბილისის დრო</p>
    </div>
    <div v-if="errorMessage" role="alert" class="rounded-xl border border-border-default bg-surface p-5"><p class="text-sm">{{ errorMessage }}</p><BaseButton class="mt-4" variant="secondary" @click="refresh">ხელახლა ცდა</BaseButton></div>
    <div v-else-if="loading" role="status" class="flex min-h-[280px] items-center justify-center gap-3 text-sm text-text-muted"><ArrowPathIcon class="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> ოპერაციების მონაცემები იტვირთება…</div>
    <template v-else-if="report">
      <div class="mb-6 grid gap-4 sm:grid-cols-2 min-[1200px]:grid-cols-4">
        <article class="rounded-xl border border-border-default bg-surface p-5"><ArrowUturnLeftIcon class="mb-3 h-5 w-5 text-accent-primary" aria-hidden="true" /><h2 class="text-[13px] font-semibold text-text-secondary">ნივთების დაბრუნების მოლოდინში</h2><p class="mt-3 text-2xl font-bold tabular-nums">{{ reportNumber(report.returns.summary.awaiting) }}</p><p class="mt-2 text-xs leading-5 text-text-muted">შეკვეთა · {{ reportNumber(report.returns.summary.awaiting_units) }} ნივთი მისაღებია</p></article>
        <article class="rounded-xl border border-border-default bg-surface p-5"><CubeIcon class="mb-3 h-5 w-5 text-accent-primary" aria-hidden="true" /><h2 class="text-[13px] font-semibold text-text-secondary">FlexDrive-ის საკუთარი მარაგი</h2><p class="mt-3 text-2xl font-bold tabular-nums">{{ reportNumber(report.stock.summary.units) }}</p><p class="mt-2 text-xs leading-5 text-text-muted">ერთეული · {{ reportNumber(report.stock.summary.products) }} სხვადასხვა პროდუქტი</p></article>
        <article class="rounded-xl border border-border-default bg-surface p-5"><ClockIcon class="mb-3 h-5 w-5 text-accent-primary" aria-hidden="true" /><h2 class="text-[13px] font-semibold text-text-secondary">გადახდის პროცესის მოლოდინში</h2><p class="mt-3 text-2xl font-bold tabular-nums">{{ reportNumber(report.payments.summary.pending) }}</p><p class="mt-2 text-xs leading-5 text-text-muted">მცდელობა · მოიცავს ავტორიზაციას და თანხის დაბრუნების მოლოდინს</p></article>
        <article class="rounded-xl border border-border-default bg-surface p-5"><ExclamationCircleIcon class="mb-3 h-5 w-5 text-text-muted" aria-hidden="true" /><h2 class="text-[13px] font-semibold text-text-secondary">წარუმატებელი გადახდის მოქმედებები</h2><p class="mt-3 text-2xl font-bold tabular-nums">{{ reportNumber(report.payments.summary.failed) }}</p><p class="mt-2 text-xs leading-5 text-text-muted">მთელი შენახული ისტორია · ერთ შეკვეთას შეიძლება რამდენიმე მცდელობა ჰქონდეს</p></article>
      </div>

      <section class="relative mb-6 rounded-xl border border-border-default bg-surface" aria-labelledby="operations-returns-title">
        <header class="flex flex-col gap-4 p-5 md:flex-row md:items-end md:justify-between">
          <div><h2 id="operations-returns-title" class="text-base font-bold">დაბრუნებული და დასაბრუნებელი ნივთები</h2><p class="mt-2 text-xs leading-5 text-text-muted">ნივთის მიღება და თანხის დაბრუნება სხვადასხვა პროცესია. მიღების მოლოდინში ჯერ ძველი ჩანაწერები ჩანს.</p></div>
          <BaseSelect :model-value="query.returns" :options="returnFilters" label="სიის მდგომარეობა" name="operations-returns-filter" class="w-full min-w-0 md:w-[280px] md:shrink-0" @update:model-value="changeFilter('returns', $event)" />
        </header>
        <div class="overflow-x-auto"><table v-if="report.returns.items.length" class="w-full text-left text-xs"><thead class="bg-surface-2 text-text-muted"><tr><th class="p-3 pl-5">შეკვეთა / პროდუქტები</th><th class="p-3">ნივთების მდგომარეობა</th><th class="p-3">გადახდის შენახული მდგომარეობა</th><th class="p-3 pr-5">თარიღები</th></tr></thead><tbody><tr v-for="item in report.returns.items" :key="item.id" class="border-t border-border-default align-top">
          <td class="min-w-[240px] p-3 pl-5"><p class="font-bold">{{ item.order_number }}</p><ul class="mt-2 space-y-2 text-text-secondary"><li v-for="(product, index) in item.products" :key="index"><p>{{ product.name }} × {{ product.quantity }}</p><p v-if="product.sku" class="mt-1 text-[11px] text-text-muted">{{ product.sku }}</p></li></ul><p v-if="item.product_count > item.products.length" class="mt-2 text-text-muted">კიდევ {{ item.product_count - item.products.length }} პროდუქტი</p><p class="mt-2 text-text-muted">სულ {{ item.expected_units }} ერთეული</p></td>
          <td class="min-w-[190px] p-3"><p class="font-semibold" :class="item.receipt_status === 'awaiting' ? 'text-accent-primary' : 'text-text-secondary'">{{ item.receipt_label }}</p><p v-if="item.receipt_status === 'awaiting'" class="mt-2 text-text-muted">მოლოდინი: {{ age(item.waiting_days) }}</p><p v-else-if="item.receipt_status === 'received'" class="mt-2 leading-5 text-text-muted">ვარგისი: {{ item.saleable_units }} · უვარგისი: {{ item.unsaleable_units }}</p><p class="mt-2 text-[11px] leading-5 text-text-muted">{{ item.disposition_label }}</p></td>
          <td class="min-w-[160px] p-3 text-text-secondary">{{ item.payment_label }}</td><td class="min-w-[180px] p-3 pr-5 text-text-muted"><p>დაფიქსირდა:<br>{{ operationsDate(item.requested_at) }}</p><p v-if="item.received_at" class="mt-3">მიღებულია:<br>{{ operationsDate(item.received_at) }}</p></td>
        </tr></tbody></table><p v-else class="px-5 py-10 text-center text-sm text-text-muted">ამ ფილტრით დაბრუნების ჩანაწერი არ არის.</p></div>
        <footer class="flex flex-wrap items-center justify-between gap-3 border-t border-border-default px-5 py-4"><p class="text-xs text-text-muted">სულ {{ reportNumber(report.returns.total) }} ჩანაწერი · გვერდი {{ report.returns.page }} / {{ report.returns.pages }}</p><div v-if="report.returns.pages > 1" class="flex gap-2"><BaseButton variant="secondary" :disabled="report.returns.page === 1" aria-label="დაბრუნებების წინა გვერდი" @click="turnPage('returns', -1)">წინა</BaseButton><BaseButton variant="secondary" :disabled="report.returns.page === report.returns.pages" aria-label="დაბრუნებების შემდეგი გვერდი" @click="turnPage('returns', 1)">შემდეგი</BaseButton></div></footer>
      </section>

      <section class="mb-6 overflow-hidden rounded-xl border border-border-default bg-surface" aria-labelledby="operations-stock-title">
        <header class="p-5"><h2 id="operations-stock-title" class="text-base font-bold">ჩვენი მარაგი — დარჩენილი ნივთები</h2><p class="mt-2 text-xs leading-5 text-text-muted">თითო სტრიქონი მიღების ერთი პარტიაა. გაყიდული რაოდენობა გამოკლებულია; მარაგში აღდგენილი რაოდენობა ისევ შედის. სია დალაგებულია მიღების ძველი თარიღიდან.</p></header>
        <div class="mx-5 mb-5 grid gap-4 rounded-lg bg-surface-2 p-4 sm:grid-cols-2"><div><p class="text-xs text-text-muted">დარჩენილი მარაგის შეძენის ღირებულება დღგ-ით</p><p class="mt-2 text-lg font-bold tabular-nums">{{ reportMoney(report.stock.summary.value_gross) }}</p><p v-if="report.stock.summary.unknown_cost_units" class="mt-2 text-xs leading-5 text-text-muted">{{ report.stock.summary.unknown_cost_units }} ერთეულის ფასი უცნობია. ცნობილი ნაწილის ჯამი: {{ reportMoney(report.stock.summary.known_value_gross) }}</p></div><div><p class="text-xs text-text-muted">მიღების დარჩენილი პარტიები</p><p class="mt-2 text-lg font-bold tabular-nums">{{ reportNumber(report.stock.summary.lots) }}</p><p class="mt-2 text-xs leading-5 text-text-muted">ასაკი ნიშნავს ამ პარტიის მიღებიდან გასულ დღეებს.</p></div></div>
        <p v-if="report.stock.summary.invalid_lots" role="status" class="mx-5 mb-5 text-xs leading-5 text-text-muted">{{ report.stock.summary.invalid_lots }} პარტიის ნაშთი გადასამოწმებელია; ისინი დადებითი ნაშთების სიაში არ შედის და სრული ღირებულება არ არის ნაჩვენები.</p>
        <div class="overflow-x-auto"><table v-if="report.stock.items.length" class="w-full text-left text-xs"><thead class="bg-surface-2 text-text-muted"><tr><th class="p-3 pl-5">პროდუქტი / წყარო</th><th class="p-3">მიღება / ასაკი</th><th class="p-3 text-right">მიღებული / დარჩენილი</th><th class="p-3 pr-5 text-right">დარჩენილი ღირებულება დღგ-ით</th></tr></thead><tbody><tr v-for="item in report.stock.items" :key="item.id" class="border-t border-border-default align-top"><td class="min-w-[220px] p-3 pl-5"><p class="font-semibold">{{ item.name }}</p><p class="mt-1 text-text-muted">{{ item.sku || 'კოდი არ არის' }}</p><p class="mt-2 text-[11px] text-text-muted">წყარო: {{ item.order_number }} · პარტია #{{ item.id }}</p></td><td class="min-w-[170px] p-3"><p class="text-text-muted">{{ operationsDate(item.received_at) }}</p><p class="mt-2 font-semibold">{{ age(item.age_days) }}</p></td><td class="whitespace-nowrap p-3 text-right tabular-nums">{{ item.received_units }} / {{ item.remaining_units }}</td><td class="whitespace-nowrap p-3 pr-5 text-right"><p class="font-semibold tabular-nums">{{ reportMoney(item.value_gross) }}</p><p class="mt-2 text-[11px] text-text-muted">ერთეული: {{ reportMoney(item.unit_cost_gross) }}</p></td></tr></tbody></table><p v-else class="px-5 py-10 text-center text-sm text-text-muted">დადებითი ნაშთის მქონე საკუთარი მარაგი არ არის.</p></div>
        <footer class="flex flex-wrap items-center justify-between gap-3 border-t border-border-default px-5 py-4"><p class="text-xs text-text-muted">სულ {{ reportNumber(report.stock.total) }} პარტია · გვერდი {{ report.stock.page }} / {{ report.stock.pages }}</p><div v-if="report.stock.pages > 1" class="flex gap-2"><BaseButton variant="secondary" :disabled="report.stock.page === 1" aria-label="მარაგის წინა გვერდი" @click="turnPage('stock', -1)">წინა</BaseButton><BaseButton variant="secondary" :disabled="report.stock.page === report.stock.pages" aria-label="მარაგის შემდეგი გვერდი" @click="turnPage('stock', 1)">შემდეგი</BaseButton></div></footer>
      </section>

      <section class="relative mb-6 rounded-xl border border-border-default bg-surface" aria-labelledby="operations-payments-title">
        <header class="flex flex-col gap-4 p-5 min-[1200px]:flex-row min-[1200px]:items-start min-[1200px]:justify-between">
          <div class="max-w-[620px]"><h2 id="operations-payments-title" class="text-base font-bold">გადახდის მცდელობები და მდგომარეობები</h2><p class="mt-2 text-xs leading-5 text-text-muted">მთელი შენახული ისტორია; ბოლო შეცვლილი ჩანაწერები პირველია. წარუმატებელი მცდელობა არ ნიშნავს აუცილებლად დაკარგულ შეკვეთას.</p><p class="mt-2 text-xs text-text-secondary">გადასამოწმებელი ჩანაწერები: {{ reportNumber(report.payments.summary.issues) }}</p></div>
          <BaseSelect :model-value="query.payments" :options="paymentFilters" :hint="paymentHints[query.payments]" label="სიის მდგომარეობა" name="operations-payments-filter" class="w-full min-w-0 min-[1200px]:w-[320px] min-[1200px]:shrink-0" @update:model-value="changeFilter('payments', $event)" />
        </header>
        <div class="overflow-x-auto"><table v-if="report.payments.items.length" class="w-full text-left text-xs"><thead class="bg-surface-2 text-text-muted"><tr><th class="p-3 pl-5">გადახდა / შეკვეთა</th><th class="p-3">მოქმედება / მდგომარეობა</th><th class="p-3 text-right">თანხა</th><th class="p-3">შენახული გადამოწმება</th><th class="p-3 pr-5">ბოლო ცვლილება</th></tr></thead><tbody><tr v-for="item in report.payments.items" :key="item.id" class="border-t border-border-default align-top"><td class="min-w-[150px] p-3 pl-5"><p class="font-semibold">გადახდა #{{ item.id }}</p><p class="mt-2 text-text-muted">{{ item.order_number || 'შეკვეთა არ არის დაკავშირებული' }}</p></td><td class="min-w-[170px] p-3"><p class="font-semibold">{{ item.status_label }}</p><p class="mt-2 text-text-muted">{{ item.action_label }}</p></td><td class="whitespace-nowrap p-3 text-right font-semibold tabular-nums">{{ operationsMoney(item.amount, item.currency) }}</td><td class="min-w-[210px] p-3 text-text-muted"><p v-if="item.issue" class="leading-5">{{ item.issue }}</p><p v-if="item.checked_at" class="mt-2">ბოლო მცდელობა:<br>{{ operationsDate(item.checked_at) }}</p><p v-else>გადამოწმების დრო არ არის შენახული.</p></td><td class="min-w-[170px] p-3 pr-5 text-text-muted">{{ operationsDate(item.updated_at) }}</td></tr></tbody></table><p v-else class="px-5 py-10 text-center text-sm text-text-muted">ამ ფილტრით გადახდის ჩანაწერი არ არის.</p></div>
        <footer class="flex flex-wrap items-center justify-between gap-3 border-t border-border-default px-5 py-4"><p class="text-xs text-text-muted">სულ {{ reportNumber(report.payments.total) }} მცდელობა · გვერდი {{ report.payments.page }} / {{ report.payments.pages }}</p><div v-if="report.payments.pages > 1" class="flex gap-2"><BaseButton variant="secondary" :disabled="report.payments.page === 1" aria-label="გადახდების წინა გვერდი" @click="turnPage('payments', -1)">წინა</BaseButton><BaseButton variant="secondary" :disabled="report.payments.page === report.payments.pages" aria-label="გადახდების შემდეგი გვერდი" @click="turnPage('payments', 1)">შემდეგი</BaseButton></div></footer>
      </section>

      <section aria-labelledby="operations-sync-title"><h2 id="operations-sync-title" class="mb-4 text-base font-bold">სინქრონიზაციების ბოლო შენახული შედეგები</h2><div class="grid gap-4 md:grid-cols-2"><article v-for="sync in report.syncs" :key="sync.key" class="min-w-0 rounded-xl border border-border-default bg-surface p-5"><div class="flex flex-wrap items-start justify-between gap-3"><h3 class="text-base font-bold">{{ sync.label }}</h3><span class="rounded-md bg-surface-2 px-3 py-1 text-xs font-semibold" :class="sync.latest?.status === 'success' ? 'text-accent-primary' : 'text-text-secondary'">{{ sync.latest?.status_label || 'ანგარიში არ არის' }}</span></div><template v-if="sync.latest"><p class="mt-3 text-xs leading-5 text-text-muted">ბოლო ანგარიშის დასრულება: {{ operationsDate(sync.latest.finished_at) }}<span v-if="sync.latest.source_label"><br>{{ sync.latest.source_label }}</span></p><dl class="mt-4 grid grid-cols-2 gap-3"><div v-for="count in sync.latest.counts" :key="count.key" class="rounded-lg bg-surface-2 p-3"><dt class="text-[11px] text-text-muted">{{ count.label }}</dt><dd class="mt-2 text-lg font-bold tabular-nums">{{ reportNumber(count.value) }}</dd></div></dl></template><p v-else class="mt-4 text-xs leading-6 text-text-muted">ამ ბაზაში სინქრონიზაციის ანგარიში არ არის შენახული. ეს თავისთავად არ ნიშნავს შეცდომას ან განრიგის არქონას.</p><p class="mt-4 text-xs leading-5 text-text-muted">ბოლო შენახული წარმატებული ანგარიში: {{ operationsDate(sync.last_success_at) }}</p><p v-if="sync.key === 'carrier'" class="mt-3 border-t border-border-default pt-3 text-[11px] leading-5 text-text-muted">EasyWay უცვლელ წარმატებულ შემოწმებაზე ყოველთვის არ ინახავს ანგარიშს. აქ ჩანს ბოლო შენახული შედეგი.</p></article></div></section>
    </template>
  </section>
</template>
