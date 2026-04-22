<script setup lang="ts">
import {
  BanknotesIcon,
  CalendarDaysIcon,
  CubeIcon,
} from "@heroicons/vue/24/outline";
import BaseButton from "~/components/common/BaseButton.vue";
import ProfileStatusBadge from "~/components/profile/ProfileStatusBadge.vue";
import { useCommercePresentation } from "~/composables/commerce/useCommercePresentation";
import type {
  OwnedOrderListItem,
  OwnedOrdersSummary,
} from "~/types/commerce";

const props = defineProps<{
  orders: OwnedOrderListItem[];
  summary: OwnedOrdersSummary | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
}>();

const emit = defineEmits<{
  (event: "change-page", page: number): void;
}>();

const { getPaymentMethodLabel } = useCommercePresentation();

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "თარიღი მიუწვდომელია";
  }

  return new Intl.DateTimeFormat("ka-GE", {
    dateStyle: "long",
  }).format(date);
};

const formatMoney = (value: string | number) => {
  const amount = Number(value || 0);

  if (Number.isNaN(amount)) {
    return "0.00";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const getOrderUnits = (order: OwnedOrderListItem) => {
  if (typeof order.total_quantity === "number" && !Number.isNaN(order.total_quantity)) {
    return order.total_quantity;
  }

  return order.item_count;
};

const summaryCards = computed(() => [
  {
    key: "orders",
    label: "სულ შეკვეთები",
    value: String(props.summary?.total_orders ?? props.totalCount),
    helper: "პროფილის სრული ისტორია",
    icon: CubeIcon,
  },
  {
    key: "spent",
    label: "დახარჯული თანხა",
    value: `${formatMoney(props.summary?.total_spent ?? "0.00")} GEL`,
    helper: "გაუქმებულების გარეშე",
    icon: BanknotesIcon,
  },
  {
    key: "last-order",
    label: "ბოლო შეკვეთა",
    value: props.summary?.last_order_at
      ? formatDate(props.summary.last_order_at)
      : "ჯერ არა",
    helper: "ყველაზე ახალი აქტივობა",
    icon: CalendarDaysIcon,
  },
]);

const previousPage = computed(() =>
  props.currentPage > 1 ? props.currentPage - 1 : null,
);

const nextPage = computed(() =>
  props.currentPage < props.totalPages ? props.currentPage + 1 : null,
);

const goToPage = (page: number | null) => {
  if (!page || page === props.currentPage) return;
  emit("change-page", page);
};
</script>

<template>
  <section
    class="rounded-[28px] border border-border-default bg-surface p-6 shadow-[0_24px_60px_-38px_var(--shadow-color)] md:p-7"
  >
    <div
      class="flex flex-col gap-4 border-b border-border-default pb-6 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <p
          class="text-xs font-semibold uppercase tracking-[0.14em] text-accent-primary"
        >
          შეკვეთების ისტორია
        </p>
        <h2 class="mt-2 text-[28px] font-extrabold leading-tight text-text-primary">
          ჩემი შეკვეთები
        </h2>
        <p class="mt-3 text-sm leading-7 text-text-secondary">
          გადახედე უკვე შექმნილ შეკვეთებს, მიმდინარე სტატუსებს და შენს
          აქტივობას ერთ სივრცეში.
        </p>
      </div>

      <div
        class="inline-flex w-fit items-center gap-2 rounded-full border border-border-default bg-surface-2 px-4 py-2 text-sm font-semibold text-text-secondary"
      >
        <CubeIcon class="h-4 w-4 shrink-0 text-accent-primary" aria-hidden="true" />
        {{ totalCount }} შეკვეთა
      </div>
    </div>

    <div class="mt-6 grid gap-3 md:grid-cols-3">
      <article
        v-for="card in summaryCards"
        :key="card.key"
        class="rounded-[22px] border border-border-default bg-surface-2 px-4 py-4 shadow-[0_18px_44px_-38px_var(--shadow-color)]"
      >
        <div class="flex items-start gap-3">
          <span
            class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-accent-primary/20 bg-accent-primary/10 text-accent-primary"
          >
            <component :is="card.icon" class="h-5 w-5" aria-hidden="true" />
          </span>

          <div class="min-w-0">
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted"
            >
              {{ card.label }}
            </p>
            <p class="mt-2 text-lg font-extrabold leading-tight text-text-primary">
              {{ card.value }}
            </p>
            <p class="mt-2 text-xs leading-6 text-text-secondary">
              {{ card.helper }}
            </p>
          </div>
        </div>
      </article>
    </div>

    <div v-if="orders.length" class="mt-6 space-y-4">
      <article
        v-for="order in orders"
        :key="order.public_token"
        class="rounded-[22px] border border-border-default bg-surface-2 px-5 py-5 shadow-[0_20px_44px_-38px_var(--shadow-color)]"
      >
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-3">
              <p class="text-lg font-extrabold text-text-primary">
                {{ order.order_number }}
              </p>
              <ProfileStatusBadge :status="order.status" />
            </div>

            <div
              class="mt-3 flex flex-col gap-2 text-sm text-text-secondary sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
            >
              <span class="inline-flex items-center gap-2">
                <CalendarDaysIcon
                  class="h-4 w-4 shrink-0 text-text-muted"
                  aria-hidden="true"
                />
                {{ formatDate(order.created_at) }}
              </span>
              <span>{{ getOrderUnits(order) }} ცალი</span>
              <span>{{ getPaymentMethodLabel(order.payment_method) }}</span>
            </div>
          </div>

          <div
            class="flex flex-col gap-3 sm:flex-row sm:items-center lg:shrink-0"
          >
            <div class="text-left sm:text-right">
              <p
                class="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted"
              >
                ჯამი
              </p>
              <p class="mt-1 text-2xl font-extrabold leading-none text-accent-primary">
                {{ formatMoney(order.total) }} GEL
              </p>
            </div>

            <BaseButton
              as="nuxt-link"
              :to="`/profile/orders/${order.public_token}`"
              variant="accent-outline"
              class="px-5 py-3 whitespace-nowrap"
            >
              დეტალების ნახვა
            </BaseButton>
          </div>
        </div>
      </article>
    </div>

    <div
      v-else
      class="mt-6 rounded-[22px] border border-border-default bg-surface-2 px-6 py-8 text-center"
    >
      <p class="text-lg font-bold text-text-primary">შეკვეთები ჯერ არ არის</p>
      <p class="mt-3 text-sm leading-7 text-text-secondary">
        პირველი შეკვეთის შემდეგ ისტორია აქ დაგხვდება.
      </p>
      <BaseButton
        as="nuxt-link"
        to="/catalog"
        variant="primary"
        class="mt-5 px-6 py-3.5"
      >
        კატალოგში დაბრუნება
      </BaseButton>
    </div>

    <div
      v-if="orders.length && totalPages > 1"
      class="mt-6 flex flex-col gap-3 border-t border-border-default pt-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <p class="text-sm text-text-secondary">
        გვერდი {{ currentPage }} / {{ totalPages }}
      </p>

      <div class="flex items-center gap-3">
        <BaseButton
          type="button"
          variant="secondary"
          class="px-4 py-2.5"
          :disabled="!previousPage"
          @click="goToPage(previousPage)"
        >
          წინა
        </BaseButton>
        <BaseButton
          type="button"
          variant="primary"
          class="px-4 py-2.5"
          :disabled="!nextPage"
          @click="goToPage(nextPage)"
        >
          შემდეგი
        </BaseButton>
      </div>
    </div>
  </section>
</template>
