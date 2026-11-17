<script setup lang="ts">
import type { FunnelReport } from "~/utils/businessDecisions";
import { decisionReady } from "~/utils/businessDecisions";
import { reportNumber } from "~/utils/businessReport";
import { metaUpdated } from "~/utils/businessMarketing";
const props = defineProps<{ funnel: FunnelReport }>();
const selected = ref("all");
const path = computed(() => props.funnel.paths?.[selected.value] ?? (selected.value === "all" ? props.funnel : undefined));
const percent = (users: number | null) => {
  const first = path.value?.steps?.[0]?.users;
  return users !== null && first ? Math.round(users / first * 100) : null;
};
</script>

<template>
  <section class="mt-6" aria-label="შეძენის თანმიმდევრული ეტაპები">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h3 class="font-bold">რომელ ეტაპზე ჩერდება მომხმარებელი</h3>
      <label class="text-xs font-semibold">ყიდვის გზა
        <select v-model="selected" class="ml-2 min-h-[44px] max-w-full rounded-lg border border-border-default bg-surface px-3 py-2">
          <option value="all">ყველა გზა</option><option value="cart">კალათით</option><option value="buy_now">ახლავე ყიდვით</option>
        </select>
      </label>
    </div>
    <p class="mt-2 text-xs leading-6 text-text-muted">ითვლება მომხმარებელი, რომელმაც ეტაპები ამ რიგით გაიარა, პროდუქტის ნახვიდან დაწყებული. „ყველა გზა“ კალათის გამოყენებას არ მოითხოვს. ცალკეული გზები გადახდის გვერდით განირჩევა. ერთმა ადამიანმა ორივე გზა შეიძლება გამოიყენოს; მათ რიცხვებს არ ვუმატებთ.</p>
    <p class="mt-2 text-xs leading-6 text-text-muted">შუალედური მოქმედებები და რამდენიმე ვიზიტი დასაშვებია არჩეულ პერიოდში. ეს ყველა შეკვეთის რაოდენობა და ერთი ადამიანის სრული ისტორია არ არის.</p>
    <p v-if="funnel.fetched_at" class="mt-2 text-xs text-text-muted">მიღებულია: {{ metaUpdated(funnel.fetched_at) }} <strong v-if="funnel.status === 'stale'" class="text-error">· ძველი პასუხი</strong></p>
    <template v-if="decisionReady(path) && path?.steps">
      <ol class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2" :class="path.steps.length === 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3'">
        <li v-for="(step, index) in path.steps" :key="step.event" class="min-w-0 rounded-lg border border-border-default p-4">
          <h4 class="text-xs font-semibold leading-5">{{ index + 1 }}. {{ step.label }}</h4>
          <p class="mt-2 text-2xl font-bold tabular-nums">{{ reportNumber(step.users) }}</p>
          <div v-if="percent(step.users) !== null" class="my-3 h-2 overflow-hidden rounded bg-surface-2" aria-hidden="true"><div class="h-full bg-accent-primary" :style="{ width: `${percent(step.users)}%` }" /></div>
          <p class="mt-3 text-xs leading-5 text-text-muted">{{ step.users === null ? 'Google-მა ამ ეტაპის რაოდენობა არ დააბრუნა' : percent(step.users) !== null ? `${percent(step.users)}% პირველი ეტაპიდან` : 'შედარებისთვის მონაცემები ჯერ არ არის' }}</p>
          <p v-if="step.lost !== null" class="mt-2 text-xs leading-5">შემდეგ ეტაპზე არ გადასულა: {{ reportNumber(step.lost) }}</p>
        </li>
      </ol>
      <p v-for="warning in path.warnings" :key="warning" class="mt-3 text-xs leading-5 text-text-muted">{{ warning }}</p>
    </template>
    <p v-else role="status" class="mt-3 text-sm leading-6 text-text-muted">{{ path?.message || funnel.message || 'ამ გზის ანგარიში მიუწვდომელია. ეს ნულოვან შედეგს არ ნიშნავს.' }}</p>
  </section>
</template>
