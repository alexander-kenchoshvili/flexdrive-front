<script setup lang="ts">
import { reportMoney, reportNumber, reportDate, type BusinessReport } from "~/utils/businessReport";
const props = defineProps<{ report: BusinessReport }>();
const showBuffer = computed(() => Number(props.report.summary.buffer_received || 0) !== 0 || props.report.deliveries.some((row) => Number(row.buffer) !== 0));
const cards = computed(() => [
  { key: "delivery_received", label: "მომხმარებლებისგან მიღებული მიტანის თანხა", note: "გადახდის დადასტურების თარიღით; დაბრუნება ცალკე გამოაკლდება." },
  { key: "courier_payable", label: "RedCap-ში შექმნილი გზავნილების ფასი", note: "გზავნილის შექმნის თარიღით; ინვოისის დავალიანება ან გადახდილი ხარჯი არ არის." },
  { key: "return_delivery_cost", label: "დაფიქსირებული უკუმიტანის ხარჯი", note: "ხარჯის პირველი დაფიქსირების თარიღით; ბანკის დაბრუნების პასუხზე დამოკიდებული არ არის." },
  { key: "retained_return_fee", label: "უკუმიტანისთვის დაქვითული თანხა", note: "მხოლოდ ბანკით დადასტურებულ დაბრუნებებზე; პროდუქტის მოგებაში არ შედის." },
  ...(showBuffer.value ? [{ key: "buffer_received", label: "დადგენილი ბუფერი", note: "შეკვეთაზე შენახული დანამატი; RedCap-ის ფასის სხვაობა ცალკე ჩანს." }] : []),
]);
</script>

<template>
  <section class="mb-6" aria-labelledby="business-delivery-title">
    <h2 id="business-delivery-title" class="mb-4 text-base font-bold">RedCap — მიტანა და დაბრუნება</h2>
    <div class="grid gap-4 sm:grid-cols-2">
      <article v-for="card in cards" :key="card.key" class="rounded-xl border border-border-default bg-surface p-5">
        <h3 class="text-[13px] font-semibold text-text-secondary">{{ card.label }}</h3>
        <p class="mt-3 text-xl font-bold">{{ reportMoney(report.summary[card.key]) }}</p>
        <p class="mt-2 text-xs leading-5 text-text-muted">{{ card.note }}</p>
      </article>
    </div>
    <p class="mt-3 text-xs leading-6 text-text-muted">
      დაბრუნებების შემდეგ მიტანის თანხა: {{ reportMoney(report.summary.net_delivery_received) }}.
      შექმნილი გზავნილები: {{ reportNumber(report.summary.courier_booked_orders) }}.
      გაუქმებული: {{ reportNumber(report.summary.courier_cancelled_orders) }} — მათი შესაძლო საფასური ცალკე შესაჯერებელია და ჯამში არ შედის.
    </p>
    <p v-if="Number(report.summary.courier_mismatch_orders)" class="mt-3 rounded-lg border border-border-default bg-surface-2 p-3 text-xs leading-6" role="status">
      ფასთა შეუსაბამობა: {{ reportNumber(report.summary.courier_mismatch_orders) }} გზავნილი.
      სხვაობის ჯამი: {{ reportMoney(report.summary.courier_price_difference) }}. გადაამოწმეთ RedCap-თან; მომხმარებლის გადახდა არ იცვლება.
    </p>
    <p v-if="Number(report.summary.courier_unknown_price_orders) || Number(report.summary.unknown_return_cost_events)" class="mt-3 rounded-lg border border-border-default bg-surface-2 p-3 text-xs leading-6" role="status">
      უცნობი საკურიერო ფასი: {{ reportNumber(report.summary.courier_unknown_price_orders) }};
      უცნობი უკუმიტანის ხარჯი: {{ reportNumber(report.summary.unknown_return_cost_events) }}.
      არასრული ჯამი „—“-ითაა ნაჩვენები.
    </p>
    <div class="mt-5 overflow-hidden rounded-xl border border-border-default bg-surface">
      <header class="p-5">
        <h3 class="text-sm font-bold">პერიოდში შექმნილი RedCap-ის გზავნილები</h3>
        <p class="mt-2 text-xs text-text-muted">სულ {{ reportNumber(report.delivery_rows_total) }} · ნაჩვენებია ბოლო {{ report.deliveries.length }} · ფასი ერთხელ თითო გზავნილზე</p>
      </header>
      <div class="overflow-x-auto">
        <table v-if="report.deliveries.length" class="w-full text-left text-xs">
          <thead class="bg-surface-2 text-text-muted"><tr>
            <th class="p-3">შეკვეთა / შექმნა</th><th class="p-3 text-right">მომხმარებლის მიტანის თანხა</th>
            <th class="p-3 text-right">ჩექაუთის ტარიფი</th><th class="p-3 text-right">RedCap-ის ფასი</th>
            <th v-if="showBuffer" class="p-3 text-right">ბუფერი</th><th class="p-3 text-right">ფასთა სხვაობა</th>
          </tr></thead>
          <tbody><template v-for="row in report.deliveries" :key="row.order_number">
            <tr class="border-t border-border-default align-top">
              <td class="p-3"><p class="font-semibold">{{ row.order_number }}</p><p class="mt-2 text-text-muted">{{ reportDate(row.date) }} · {{ row.stage_label }}</p></td>
              <td class="whitespace-nowrap p-3 text-right">{{ reportMoney(row.customer_delivery) }}</td>
              <td class="whitespace-nowrap p-3 text-right">{{ reportMoney(row.quoted_price) }}</td>
              <td class="whitespace-nowrap p-3 text-right">{{ reportMoney(row.booked_price) }}</td>
              <td v-if="showBuffer" class="whitespace-nowrap p-3 text-right">{{ reportMoney(row.buffer) }}</td>
              <td class="whitespace-nowrap p-3 text-right" :class="Number(row.difference) ? 'font-bold text-error' : ''">{{ reportMoney(row.difference) }}</td>
            </tr>
            <tr v-if="row.issues.length || row.cancelled"><td :colspan="showBuffer ? 6 : 5" class="px-3 pb-3 text-xs leading-6 text-text-secondary">
              <p v-for="issue in row.issues" :key="issue">{{ issue }}</p>
              <p v-if="row.cancelled">გაუქმებულია — ჯამში არ შედის; შესაძლო საკურიერო ხარჯი გადაამოწმეთ.</p>
            </td></tr>
          </template></tbody>
        </table>
        <p v-else class="p-5 text-sm text-text-muted">არჩეულ პერიოდში RedCap-ის გზავნილი არ შექმნილა.</p>
      </div>
    </div>
  </section>
</template>
