<script setup lang="ts">
import { computed } from "vue";
import { operationsDate, operationsMoney, type OperationPayment, type OperationPaymentFailure } from "~/utils/businessOperations";

const props = defineProps<{ payment: OperationPayment }>();
const context = computed(() => props.payment.attempt_context);
const history = computed(() => context.value?.history || []);
const failures = computed(() => {
  const reasons = new Map<string, { reason: OperationPaymentFailure; count: number }>();
  const entries = history.value.length ? history.value : [{ failure: context.value?.failure }];
  for (const entry of entries) {
    if (!entry.failure) continue;
    const key = `${entry.failure.kind}:${entry.failure.code || ""}`;
    const current = reasons.get(key);
    if (current) current.count++; else reasons.set(key, { reason: entry.failure, count: 1 });
  }
  return [...reasons.values()];
});
</script>

<template>
  <div class="max-w-[520px] space-y-3 text-xs leading-5 text-text-secondary">
    <div v-if="failures.length" class="space-y-2">
      <p v-for="failure in failures" :key="`${failure.reason.kind}:${failure.reason.code}`" class="font-semibold text-text-primary"><span v-if="failure.count > 1">{{ failure.count }} მცდელობა — </span>{{ failure.reason.label }}<span v-if="failure.reason.code"> · კოდი {{ failure.reason.code }}</span></p>
    </div>
    <p v-if="payment.issue && !context?.failure">{{ payment.issue }}</p>
    <p v-if="context?.bank_order_created && ['pending', 'authorized'].includes(payment.status)">ბანკში გადახდის ჩანაწერი შექმნილია; წარმატებული ჩამოჭრა ჯერ არ დადასტურებულა.</p>

    <div v-if="context?.later_success" class="border-l-2 border-accent-primary pl-3">
      <p class="font-semibold text-text-primary">მოგვიანებით გადახდა დადასტურდა</p>
      <p>{{ operationsDate(context.later_success.confirmed_at) }} · {{ operationsMoney(context.later_success.amount, context.later_success.currency) }}</p>
      <p>შეკვეთა {{ context.later_success.order_number }}</p>
      <p v-if="context.later_success.settlement_label">შეკვეთის მიმდინარე გადახდა: {{ context.later_success.settlement_label }}</p>
      <p v-if="context.checkout?.service && context.later_success.checkout?.service && context.checkout.service !== context.later_success.checkout.service" class="mt-1">მიტანა: {{ context.checkout.service_label }} → {{ context.later_success.checkout.service_label }}</p>
    </div>

    <details v-if="history.length" class="border-t border-border-default pt-2">
      <summary class="cursor-pointer rounded-sm font-semibold text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-primary">მცდელობების ისტორია ({{ history.length }})</summary>
      <ol class="mt-3 space-y-3">
        <li v-for="attempt in history" :key="attempt.id" class="border-l border-border-default pl-3">
          <p class="font-medium text-text-primary">#{{ attempt.id }} · {{ attempt.status_label }}</p>
          <p>{{ operationsDate(attempt.created_at) }} · {{ operationsMoney(attempt.amount, attempt.currency) }}</p>
          <p v-if="attempt.checkout">{{ attempt.checkout.service_label }} · პროდუქტები {{ operationsMoney(attempt.checkout.subtotal, attempt.currency) }} + მიტანა {{ operationsMoney(attempt.checkout.delivery, attempt.currency) }}</p>
          <p v-if="failures.length > 1 && attempt.failure">{{ attempt.failure.label }}<span v-if="attempt.failure.code"> · კოდი {{ attempt.failure.code }}</span></p>
          <p v-if="attempt.confirmed_at">დადასტურდა {{ operationsDate(attempt.confirmed_at) }}<span v-if="attempt.order_number"> · {{ attempt.order_number }}</span></p>
          <p v-if="attempt.settlement_label">შეკვეთის მიმდინარე გადახდა: {{ attempt.settlement_label }}</p>
        </li>
      </ol>
      <p v-for="failure in failures" :key="failure.reason.kind + (failure.reason.code || '')" class="mt-3 text-text-muted">{{ failure.reason.detail }}</p>
      <p class="mt-3 text-text-muted">შენახული მცდელობები იმავე ჩექაუთიდან, იგივე პროდუქტებით, რაოდენობითა და ფასით, 24-საათიან მონაკვეთში; ყველა კლიკი აქ არ აღირიცხება. მიტანის ცვლილება ბანკის უარყოფის მიზეზს არ ადგენს.</p>
      <p v-if="context?.history_limited" class="mt-3 text-text-muted">ისტორია შეზღუდულია: ნაჩვენებია მხოლოდ ნაპოვნი ჩანაწერების ნაწილი. სხვა მცდელობები ან შემდგომი წარმატება შეიძლება ამ სიაში არ ჩანდეს.</p>
      <p v-if="payment.checked_at" class="mt-3 text-text-muted">ბოლო შენახული გადამოწმება: {{ operationsDate(payment.checked_at) }}</p>
    </details>
    <template v-else>
      <p v-for="failure in failures" :key="failure.reason.kind + (failure.reason.code || '')" class="text-text-muted">{{ failure.reason.detail }}</p>
      <p v-if="context" class="text-text-muted">დაწყება: {{ operationsDate(payment.created_at) }}</p>
      <div v-if="context?.checkout"><p>{{ context.checkout.service_label }}</p><p>პროდუქტები {{ operationsMoney(context.checkout.subtotal, payment.currency) }} + მიტანა {{ operationsMoney(context.checkout.delivery, payment.currency) }}</p></div>
      <p v-if="context" class="text-text-muted">დაკავშირებული მცდელობების შესადარებელი მონაცემები არ არის შენახული.</p>
      <p v-if="payment.checked_at" class="text-text-muted">ბოლო შენახული გადამოწმება: {{ operationsDate(payment.checked_at) }}</p>
      <p v-else-if="!context" class="text-text-muted">გადამოწმების დრო არ არის შენახული.</p>
    </template>
  </div>
</template>
