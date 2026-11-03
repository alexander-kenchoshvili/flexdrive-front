<script setup lang="ts">
import { operationsDate, type OperationsReport, type ShipmentFilter } from "~/utils/businessOperations";
import { reportMoney, reportNumber } from "~/utils/businessReport";
defineProps<{ shipments: OperationsReport["shipments"] }>();
const emit = defineEmits<{ filter: [value: ShipmentFilter]; page: [value: number] }>();
const filters: { value: ShipmentFilter; label: string }[] = [
  { value: "all", label: "ყველა" }, { value: "not_sent", label: "ჯერ არ გაგზავნილა" },
  { value: "created", label: "შექმნილია" }, { value: "shipped", label: "გზაშია" },
  { value: "delivered", label: "ჩაბარებულია" }, { value: "cancelled", label: "გაუქმებულია" },
  { value: "returning", label: "ნივთების დაბრუნება" }, { value: "review", label: "გადასამოწმებელი" },
];
const changeFilter = (value: string | number | null) => {
  const selected = filters.find((item) => item.value === value);
  if (selected) emit("filter", selected.value);
};
</script>

<template>
  <section class="mb-6 rounded-xl border border-border-default bg-surface" aria-labelledby="business-shipments-title">
    <header class="flex flex-col gap-4 p-5 md:flex-row md:items-end md:justify-between">
      <div><h2 id="business-shipments-title" class="text-base font-bold">RedCap-ის გზავნილები</h2>
        <p class="mt-2 max-w-[620px] text-xs leading-6 text-text-muted">ინახება ჩვენი სისტემის ბოლო მონაცემები. ამ გვერდის განახლება RedCap-ში მოთხოვნას არ აგზავნის; საკურიერო სტატუსი ადმინიდან ან პერიოდული სამუშაოთი მოწმდება.</p>
        <p class="mt-2 text-xs">გადასამოწმებელია: {{ reportNumber(shipments.summary.review) }}</p>
      </div>
      <BaseSelect :model-value="shipments.filter" :options="filters" label="გზავნილების მდგომარეობა" name="operations-shipments-filter" class="w-full md:w-[280px]" @update:model-value="changeFilter" />
    </header>
    <div class="overflow-x-auto">
      <table v-if="shipments.items.length" class="w-full text-left text-xs">
        <thead class="bg-surface-2 text-text-muted"><tr>
          <th class="p-3">შეკვეთა / თრექინგი</th><th class="p-3">მდგომარეობა</th>
          <th class="p-3">მიტანის თანხები</th><th class="p-3">ბოლო შემოწმება</th>
        </tr></thead>
        <tbody><tr v-for="row in shipments.items" :key="row.order_number" class="border-t border-border-default align-top">
          <td class="min-w-[170px] p-3"><p class="font-semibold">{{ row.order_number }}</p><p class="mt-2 text-text-muted">{{ row.tracking_number || 'თრექინგი ჯერ არ არის' }}</p></td>
          <td class="min-w-[240px] p-3"><p class="font-semibold">{{ row.stage_label }}</p><p class="mt-2 text-text-muted">{{ row.carrier_status_label }}</p><p v-for="issue in row.issues" :key="issue" class="mt-2 leading-5 text-error">{{ issue }}</p></td>
          <td class="min-w-[210px] p-3 leading-6">
            <p>მომხმარებელი: {{ reportMoney(row.customer_delivery) }}</p><p>ჩექაუთის ტარიფი: {{ reportMoney(row.quoted_price) }}</p>
            <p>RedCap: {{ reportMoney(row.booked_price) }}</p><p v-if="Number(row.buffer)">ბუფერი: {{ reportMoney(row.buffer) }}</p>
            <p v-if="Number(row.difference)" class="font-semibold text-error">სხვაობა: {{ reportMoney(row.difference) }}</p>
          </td>
          <td class="min-w-[170px] p-3 text-text-muted"><p>{{ operationsDate(row.checked_at) }}</p><p v-if="row.submitted_at" class="mt-2">შეიქმნა: {{ operationsDate(row.submitted_at) }}</p></td>
        </tr></tbody>
      </table>
      <p v-else class="p-5 text-sm text-text-muted">ამ ფილტრით გზავნილი არ არის.</p>
    </div>
    <footer class="flex flex-wrap items-center justify-between gap-3 border-t border-border-default p-5">
      <p class="text-xs text-text-muted">სულ {{ reportNumber(shipments.total) }} · გვერდი {{ shipments.page }} / {{ shipments.pages }}</p>
      <div v-if="shipments.pages > 1" class="flex gap-2">
        <BaseButton variant="secondary" :disabled="shipments.page === 1" @click="emit('page', shipments.page - 1)">წინა</BaseButton>
        <BaseButton variant="secondary" :disabled="shipments.page === shipments.pages" @click="emit('page', shipments.page + 1)">შემდეგი</BaseButton>
      </div>
    </footer>
  </section>
</template>
