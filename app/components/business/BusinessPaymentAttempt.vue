<script setup lang="ts">
import { operationsDate, operationsMoney, type OperationPayment } from "~/utils/businessOperations";

defineProps<{ payment: OperationPayment }>();
</script>

<template>
  <div class="max-w-[520px] space-y-3 text-xs leading-5 text-text-secondary">
    <div v-if="payment.attempt_context?.failure">
      <p class="font-semibold text-text-primary">{{ payment.attempt_context.failure.label }}<span v-if="payment.attempt_context.failure.code"> · კოდი {{ payment.attempt_context.failure.code }}</span></p>
      <p class="mt-1 text-text-muted">{{ payment.attempt_context.failure.detail }}</p>
    </div>
    <p v-else-if="payment.issue">{{ payment.issue }}</p>
    <p v-else-if="payment.attempt_context?.bank_order_created && ['pending', 'authorized'].includes(payment.status)">
      ბანკში გადახდის ჩანაწერი შექმნილია; წარმატებული ჩამოჭრა ჯერ არ დადასტურებულა.
    </p>
    <p v-if="payment.attempt_context" class="text-text-muted">დაწყება: {{ operationsDate(payment.created_at) }}</p>
    <div v-if="payment.attempt_context?.checkout" class="border-l-2 border-border-default pl-3">
      <p class="font-medium text-text-primary">{{ payment.attempt_context.checkout.service_label }}</p>
      <p>პროდუქტები {{ operationsMoney(payment.attempt_context.checkout.subtotal, payment.currency) }} + მიტანა {{ operationsMoney(payment.attempt_context.checkout.delivery, payment.currency) }}</p>
    </div>
    <div v-if="payment.attempt_context?.later_success" class="border-l-2 border-accent-primary pl-3">
      <p class="font-semibold text-text-primary">მოგვიანებით გადახდა დადასტურდა</p>
      <p>{{ operationsDate(payment.attempt_context.later_success.confirmed_at) }} · {{ operationsMoney(payment.attempt_context.later_success.amount, payment.attempt_context.later_success.currency) }}</p>
      <p>შეკვეთა {{ payment.attempt_context.later_success.order_number }}</p>
      <p v-if="payment.attempt_context.later_success.settlement_label">შეკვეთის მიმდინარე გადახდა: {{ payment.attempt_context.later_success.settlement_label }}</p>
      <template v-if="payment.attempt_context.checkout?.service && payment.attempt_context.later_success.checkout?.service && payment.attempt_context.checkout.service !== payment.attempt_context.later_success.checkout.service">
        <p class="mt-1">მიტანის არჩევანი: {{ payment.attempt_context.checkout.service_label }} → {{ payment.attempt_context.later_success.checkout.service_label }}</p>
        <p class="mt-1 text-text-muted">მიტანის ცვლილება ბანკის უარყოფის მიზეზს არ ადგენს.</p>
      </template>
    </div>
    <details v-if="payment.attempt_context?.history.length" class="border-t border-border-default pt-2">
      <summary class="cursor-pointer rounded-sm font-semibold text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-primary">მცდელობების თანმიმდევრობა ({{ payment.attempt_context.history.length }})</summary>
      <p class="mt-2 text-text-muted">იმავე ჩექაუთიდან, იგივე პროდუქტებით, რაოდენობითა და ფასით შენახული მცდელობები, 24-საათიან მონაკვეთში. გვერდებზე გადართვები და ყველა კლიკი აქ არ აღირიცხება.</p>
      <ol class="mt-3 space-y-3">
        <li v-for="attempt in payment.attempt_context.history" :key="attempt.id" class="border-l border-border-default pl-3">
          <p class="font-medium text-text-primary">#{{ attempt.id }} · {{ attempt.status_label }}<span v-if="attempt.id === payment.id"> · ეს მცდელობა</span></p>
          <p>დაიწყო {{ operationsDate(attempt.created_at) }} · {{ operationsMoney(attempt.amount, attempt.currency) }}</p>
          <p v-if="attempt.checkout">{{ attempt.checkout.service_label }} · პროდუქტები {{ operationsMoney(attempt.checkout.subtotal, attempt.currency) }} + მიტანა {{ operationsMoney(attempt.checkout.delivery, attempt.currency) }}</p>
          <p v-if="attempt.failure">{{ attempt.failure.label }}<span v-if="attempt.failure.code"> · კოდი {{ attempt.failure.code }}</span></p>
          <p v-if="attempt.confirmed_at">დადასტურდა {{ operationsDate(attempt.confirmed_at) }}<span v-if="attempt.order_number"> · {{ attempt.order_number }}</span></p>
          <p v-if="attempt.settlement_label">შეკვეთის მიმდინარე გადახდა: {{ attempt.settlement_label }}</p>
        </li>
      </ol>
      <p v-if="payment.attempt_context.history_limited" class="mt-3 text-text-muted">ისტორია შეზღუდულია: ნაჩვენებია მხოლოდ ნაპოვნი ჩანაწერების ნაწილი. სხვა მცდელობები ან შემდგომი წარმატება შეიძლება ამ სიაში არ ჩანდეს.</p>
    </details>
    <p v-else-if="payment.attempt_context" class="text-text-muted">დაკავშირებული მცდელობების შესადარებელი მონაცემები არ არის შენახული.</p>
    <p v-if="payment.checked_at" class="text-text-muted">ბოლო შენახული გადამოწმება: {{ operationsDate(payment.checked_at) }}</p>
    <p v-else-if="!payment.attempt_context" class="text-text-muted">გადამოწმების დრო არ არის შენახული.</p>
  </div>
</template>
