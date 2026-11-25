<script setup lang="ts">
import { computed } from "vue";
import BusinessPaymentAttempt from "./BusinessPaymentAttempt.vue";
import { groupPaymentAttempts, operationsDate, operationsMoney, paymentOrderNote, type OperationPayment } from "~/utils/businessOperations";
const props = defineProps<{ payments: OperationPayment[] }>();
const groups = computed(() => groupPaymentAttempts(props.payments));
</script>

<template>
  <p v-if="groups.length < payments.length" class="px-5 pb-4 text-xs leading-5 text-text-muted">ამ გვერდზე დაკავშირებული მცდელობები გაერთიანებულია. საერთო მიზეზი და ისტორია თითო ჯგუფში ერთხელ ჩანს; ჯამური რაოდენობა კვლავ მცდელობებს ითვლის.</p>
  <div class="overflow-x-auto">
    <table v-if="groups.length" class="w-full text-left text-xs">
      <thead class="bg-surface-2 text-text-muted"><tr><th class="p-3 pl-5">მცდელობა / შეკვეთა</th><th class="p-3">მდგომარეობა</th><th class="p-3 text-right">მცდელობის თანხა</th><th class="p-3">მიზეზი და შედეგი</th><th class="p-3 pr-5">ბოლო ცვლილება</th></tr></thead>
      <tbody>
        <tr v-for="group in groups" :key="group.payment.id" class="border-t border-border-default align-top">
          <td class="min-w-[170px] p-3 pl-5">
            <p class="font-semibold">{{ group.ids.length > 1 ? 'დაკავშირებული მცდელობები' : 'გადახდის მცდელობა' }}</p>
            <p class="mt-1 font-semibold">{{ group.ids.map((id) => `#${id}`).join(', ') }}</p>
            <p class="mt-2 text-text-muted">{{ paymentOrderNote(group.payment, group.ids.length) }}</p>
          </td>
          <td class="min-w-[160px] p-3"><p v-for="status in group.statuses" :key="status.label" class="font-semibold">{{ group.ids.length > 1 ? `${status.count} × ` : '' }}{{ status.label }}</p><p class="mt-2 text-text-muted">{{ group.payment.action_label }}</p></td>
          <td class="whitespace-nowrap p-3 text-right font-semibold tabular-nums"><p v-for="amount in group.amounts" :key="`${amount.currency}:${amount.amount}`">{{ operationsMoney(amount.amount, amount.currency) }}</p><p v-if="group.ids.length > 1" class="mt-2 font-normal text-text-muted">თითო მცდელობა · არ ჯამდება</p></td>
          <td class="min-w-[300px] p-3"><BusinessPaymentAttempt :payment="group.payment" /></td>
          <td class="min-w-[150px] p-3 pr-5 text-text-muted">{{ operationsDate(group.payment.updated_at) }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else class="px-5 py-10 text-center text-sm text-text-muted">ამ ფილტრით გადახდის ჩანაწერი არ არის.</p>
  </div>
</template>
