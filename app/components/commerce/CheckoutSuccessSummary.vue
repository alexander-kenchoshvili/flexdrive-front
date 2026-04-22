<script setup lang="ts">
import { BanknotesIcon, CheckBadgeIcon } from "@heroicons/vue/24/outline";
import BaseButton from "~/components/common/BaseButton.vue";
import BasePicture from "~/components/common/BasePicture.vue";
import { useCatalogPlaceholderMedia } from "~/composables/catalog/useCatalogPlaceholderMedia";
import { useCommercePresentation } from "~/composables/commerce/useCommercePresentation";
import type { CommerceOrderItem, CommerceOrderSummary } from "~/types/commerce";

const props = defineProps<{
  order: CommerceOrderSummary;
}>();

const { cardPlaceholderImage } = useCatalogPlaceholderMedia();
const {
  getOrderStatusBadgeClasses,
  getOrderStatusLabel,
  getPaymentMethodLabel,
} = useCommercePresentation();

const formatMoney = (value: string | number | null | undefined) =>
  `${Number(value || 0).toFixed(2)} GEL`;

const resolveItemImage = (item: CommerceOrderItem) => {
  const asset = item.primary_image;
  if (asset?.desktop || asset?.tablet || asset?.mobile) {
    return asset;
  }
  return cardPlaceholderImage;
};

const totalQuantity = computed(() =>
  props.order.items.reduce((sum, item) => sum + item.quantity, 0),
);

const formattedCreatedAt = computed(() => {
  const date = new Date(props.order.created_at);

  if (Number.isNaN(date.getTime())) {
    return "თარიღი მიუწვდომელია";
  }

  return new Intl.DateTimeFormat("ka-GE", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
});

const miniItemMeta = (item: CommerceOrderItem) =>
  `${item.quantity} ც. · SKU: ${item.sku || "—"}`;
</script>

<template>
  <section class="space-y-8">
    <section
      class="rounded-[28px] border border-border-default bg-surface p-6 shadow-[0_24px_60px_-38px_var(--shadow-color)] md:p-8"
    >
      <div
        class="flex flex-col gap-5 md:flex-row md:items-start md:justify-between"
      >
        <div class="max-w-3xl">
          <span
            class="inline-flex h-14 w-14 items-center justify-center rounded-[18px] border border-success/30 bg-success/10 text-success"
          >
            <CheckBadgeIcon class="h-7 w-7" aria-hidden="true" />
          </span>

          <p
            class="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-accent-primary"
          >
            შეკვეთა წარმატებით გაფორმდა
          </p>

          <h1
            class="title-under-xs mt-3 text-[32px] font-extrabold leading-tight text-text-primary md:text-[42px]"
          >
            შეკვეთა მიღებულია
          </h1>

          <p
            class="subtitle-under-xs mt-4 max-w-2xl text-sm leading-7 text-text-secondary md:text-base"
          >
            შეკვეთის დეტალები ქვემოთ დაგხვდება. საჭიროების შემთხვევაში ჩვენი
            გუნდი შეკვეთას გადაამოწმებს და მიწოდების პროცესს დაგიდასტურებს.
          </p>

          <div
            :class="[
              'mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold',
              getOrderStatusBadgeClasses(order.status),
            ]"
          >
            <span class="h-2.5 w-2.5 rounded-full bg-current" />
            სტატუსი: {{ getOrderStatusLabel(order.status) }}
          </div>
        </div>

        <div
          class="rounded-[20px] border border-border-default bg-surface-2 px-5 py-4"
        >
          <p
            class="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted"
          >
            შექმნის დრო
          </p>
          <p class="mt-2 text-sm font-semibold text-text-primary">
            {{ formattedCreatedAt }}
          </p>
        </div>
      </div>
    </section>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
      <div class="space-y-4">
        <section
          class="overflow-hidden rounded-[24px] border border-border-default bg-surface shadow-[0_24px_60px_-38px_var(--shadow-color)]"
        >
          <div
            class="grid divide-y divide-border-default sm:grid-cols-3 sm:divide-x sm:divide-y-0"
          >
            <div class="px-5 py-5">
              <p
                class="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted"
              >
                შეკვეთის ნომერი
              </p>
              <p
                class="mt-3 text-xl font-extrabold text-accent-primary md:text-2xl"
              >
                {{ order.order_number }}
              </p>
            </div>

            <div class="px-5 py-5">
              <p
                class="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted"
              >
                გადახდის მეთოდი
              </p>
              <p
                class="mt-3 text-sm font-semibold text-text-primary md:text-base"
              >
                {{ getPaymentMethodLabel(order.payment_method) }}
              </p>
            </div>

            <div class="px-5 py-5">
              <p
                class="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted"
              >
                სტატუსი
              </p>
              <p
                class="mt-3 text-sm font-semibold text-text-primary md:text-base"
              >
                {{ getOrderStatusLabel(order.status) }}
              </p>
            </div>
          </div>
        </section>

        <section
          class="overflow-hidden rounded-[24px] border border-border-default bg-surface shadow-[0_24px_60px_-38px_var(--shadow-color)]"
        >
          <div class="border-b border-border-default px-6 py-5">
            <div class="flex items-center gap-3">
              <span
                class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent-primary text-sm font-extrabold text-text-invert"
              >
                1
              </span>
              <h2 class="text-base font-bold text-text-primary md:text-lg">
                მყიდველის ინფორმაცია
              </h2>
            </div>
          </div>

          <div class="px-6 py-5">
            <div class="space-y-0">
              <div
                class="flex flex-col gap-1 border-b border-border-default py-3 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
              >
                <span class="text-sm text-text-muted">სახელი და გვარი</span>
                <span
                  class="text-sm font-medium text-text-primary sm:text-right"
                >
                  {{ order.first_name }} {{ order.last_name }}
                </span>
              </div>

              <div
                class="flex flex-col gap-1 border-b border-border-default py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
              >
                <span class="text-sm text-text-muted">ტელეფონის ნომერი</span>
                <span
                  class="text-sm font-medium text-text-primary sm:text-right"
                >
                  {{ order.phone }}
                </span>
              </div>

              <div
                v-if="order.email"
                class="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
              >
                <span class="text-sm text-text-muted">ელფოსტა</span>
                <span
                  class="text-sm font-medium text-text-primary sm:text-right"
                >
                  {{ order.email }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section
          class="overflow-hidden rounded-[24px] border border-border-default bg-surface shadow-[0_24px_60px_-38px_var(--shadow-color)]"
        >
          <div class="border-b border-border-default px-6 py-5">
            <div class="flex items-center gap-3">
              <span
                class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent-primary text-sm font-extrabold text-text-invert"
              >
                2
              </span>
              <h2 class="text-base font-bold text-text-primary md:text-lg">
                მიწოდების ინფორმაცია
              </h2>
            </div>
          </div>

          <div class="px-6 py-5">
            <div class="space-y-0">
              <div
                class="flex flex-col gap-1 border-b border-border-default py-3 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
              >
                <span class="text-sm text-text-muted">ქალაქი</span>
                <span
                  class="text-sm font-medium text-text-primary sm:text-right"
                >
                  {{ order.city }}
                </span>
              </div>

              <div
                class="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
              >
                <span class="text-sm text-text-muted">მისამართი</span>
                <span
                  class="text-sm font-medium leading-6 text-text-primary sm:max-w-[70%] sm:text-right"
                >
                  {{ order.address_line }}
                </span>
              </div>
            </div>

            <div
              v-if="order.note"
              class="mt-4 rounded-[14px] border border-border-default bg-surface-2 px-4 py-4"
            >
              <p
                class="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted"
              >
                კომენტარი
              </p>
              <p class="mt-2 text-sm leading-6 text-text-secondary">
                {{ order.note }}
              </p>
            </div>
          </div>
        </section>

        <section
          class="overflow-hidden rounded-[24px] border border-border-default bg-surface shadow-[0_24px_60px_-38px_var(--shadow-color)]"
        >
          <div class="border-b border-border-default px-6 py-5">
            <div class="flex items-center gap-3">
              <span
                class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent-primary text-sm font-extrabold text-text-invert"
              >
                3
              </span>
              <h2 class="text-base font-bold text-text-primary md:text-lg">
                შეკვეთილი პროდუქტები
              </h2>
            </div>
          </div>

          <div class="px-6 py-4">
            <div class="space-y-0">
              <article
                v-for="item in order.items"
                :key="item.id"
                class="flex items-center gap-4 border-b border-border-default py-4 first:pt-0 last:border-b-0 last:pb-0"
              >
                <div
                  class="h-12 w-12 shrink-0 overflow-hidden rounded-[12px] border border-border-default bg-white/95"
                >
                  <BasePicture
                    :data="resolveItemImage(item)"
                    :alt="item.product_name"
                    class="h-full w-full"
                    preset="thumb"
                    fit="contain"
                    lazy
                  />
                </div>

                <div class="min-w-0 flex-1">
                  <p
                    class="truncate text-[13px] font-semibold text-text-primary md:text-sm"
                  >
                    {{ item.product_name }}
                  </p>
                  <p class="mt-1 text-xs text-text-muted">
                    {{ miniItemMeta(item) }}
                  </p>
                </div>

                <div class="shrink-0 text-right">
                  <p class="text-sm font-semibold text-text-primary">
                    {{ formatMoney(item.line_total) }}
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>
      </div>

      <aside class="xl:sticky xl:top-40">
        <div
          class="overflow-hidden rounded-[24px] border border-border-default bg-surface shadow-[0_24px_60px_-38px_var(--shadow-color)]"
        >
          <div class="border-b border-border-default px-6 py-5">
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-primary"
            >
              დასტური
            </p>
            <div class="mt-2 flex items-center gap-3">
              <h2
                class="text-[26px] font-extrabold leading-tight text-text-primary"
              >
                შეკვეთის დეტალები
              </h2>
              <span
                class="inline-flex shrink-0 whitespace-nowrap rounded-full border border-border-default bg-surface-2 px-3 py-1 text-xs font-semibold text-text-secondary"
              >
                {{ totalQuantity }} ც.
              </span>
            </div>
          </div>

          <div class="space-y-3 border-b border-border-default px-6 py-4">
            <article
              v-for="item in order.items"
              :key="`mini-${item.id}`"
              class="flex items-center gap-3"
            >
              <div
                class="h-10 w-10 shrink-0 overflow-hidden rounded-[10px] border border-border-default bg-white/95"
              >
                <BasePicture
                  :data="resolveItemImage(item)"
                  :alt="item.product_name"
                  class="h-full w-full"
                  preset="thumb"
                  fit="contain"
                  lazy
                />
              </div>

              <div class="min-w-0 flex-1">
                <p
                  class="truncate text-[12.5px] font-semibold text-text-primary"
                >
                  {{ item.product_name }}
                </p>
                <p class="mt-0.5 text-[11px] text-text-muted">
                  რაოდენობა: {{ item.quantity }}
                </p>
              </div>

              <p class="shrink-0 text-[13px] font-semibold text-text-primary">
                {{ formatMoney(item.line_total) }}
              </p>
            </article>
          </div>

          <div class="space-y-3 border-b border-border-default px-6 py-4">
            <div
              class="flex items-center justify-between gap-3 text-sm text-text-secondary"
            >
              <span>პროდუქტები</span>
              <span>{{ totalQuantity }} ცალი</span>
            </div>

            <div
              class="flex items-center justify-between gap-3 text-sm text-text-secondary"
            >
              <span>მიწოდება</span>
              <span class="font-semibold text-success">უფასო</span>
            </div>

            <div class="border-t border-border-default pt-3">
              <div class="flex items-center justify-between gap-3">
                <span class="text-base font-semibold text-text-primary"
                  >სულ</span
                >
                <span
                  class="text-[30px] font-extrabold leading-none text-accent-primary"
                >
                  {{ formatMoney(order.total) }}
                </span>
              </div>
            </div>
          </div>

          <div class="border-b border-border-default px-6 py-4">
            <div
              class="flex items-center gap-3 rounded-[16px] border border-border-default bg-surface-2 px-4 py-3"
            >
              <span
                class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-border-default bg-surface text-text-primary"
              >
                <BanknotesIcon class="h-5 w-5" aria-hidden="true" />
              </span>

              <div class="min-w-0">
                <p class="text-sm font-semibold text-text-primary">
                  {{ getPaymentMethodLabel(order.payment_method) }}
                </p>
                <p class="mt-1 text-xs text-text-secondary">
                  გადახდის მეთოდი შეკვეთაში დაფიქსირდა.
                </p>
              </div>
            </div>
          </div>

          <div class="space-y-3 px-6 py-5">
            <BaseButton
              as="nuxt-link"
              to="/catalog"
              variant="primary"
              class="px-6 py-3.5 text-sm upper"
              full-width
            >
              კატალოგში დაბრუნება
            </BaseButton>

            <BaseButton
              as="nuxt-link"
              to="/"
              variant="secondary"
              class="px-6 py-3.5 text-sm upper"
              full-width
            >
              მთავარზე დაბრუნება
            </BaseButton>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>
