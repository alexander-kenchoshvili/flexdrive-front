<script setup lang="ts">
import type { Component } from "vue";
import type { CommerceOrderStatus, OwnedOrderDetail } from "~/types/commerce";
import {
  CalendarDaysIcon,
  CheckBadgeIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  HomeIcon,
  MapPinIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/vue/24/outline";
import BaseButton from "~/components/common/BaseButton.vue";
import BasePicture from "~/components/common/BasePicture.vue";
import { useCatalogPlaceholderMedia } from "~/composables/catalog/useCatalogPlaceholderMedia";
import ProfileStatusBadge from "~/components/profile/ProfileStatusBadge.vue";
import { useCommercePresentation } from "~/composables/commerce/useCommercePresentation";

const props = defineProps<{
  order: OwnedOrderDetail;
}>();

type TrackingCardState = "complete" | "current" | "pending";
type TrackableStatus = Exclude<CommerceOrderStatus, "cancelled">;

const {
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getTrackingSteps,
  isOrderCancelled,
} = useCommercePresentation();
const { cardPlaceholderImage } = useCatalogPlaceholderMedia();

const formatMoney = (value: string | number | null | undefined) =>
  `${Number(value || 0).toFixed(2)} GEL`;

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

const trackingSteps = computed(() => getTrackingSteps(props.order.status));
const cancelled = computed(() => isOrderCancelled(props.order.status));
const totalUnits = computed(() =>
  props.order.items.reduce((sum, item) => sum + item.quantity, 0),
);

const resolveItemImage = (item: OwnedOrderDetail["items"][number]) => {
  const asset = item.primary_image;
  if (asset?.desktop || asset?.tablet || asset?.mobile) {
    return asset;
  }
  return cardPlaceholderImage;
};

const trackingStepMeta: Record<
  TrackableStatus,
  { icon: Component; description: string }
> = {
  new: {
    icon: ClipboardDocumentListIcon,
    description: "შეკვეთა მიღებულია და უსაფრთხოდ დაფიქსირდა სისტემაში.",
  },
  confirmed: {
    icon: CheckBadgeIcon,
    description:
      "ოპერატორმა დაადასტურა შეკვეთა და გადაამოწმა მიწოდების დეტალები.",
  },
  processing: {
    icon: WrenchScrewdriverIcon,
    description: "ნივთები მზადდება და იგეგმება გასაგზავნად.",
  },
  shipped: {
    icon: TruckIcon,
    description: "შეკვეთა გზაშია და უკვე მიემართება შენამდე.",
  },
  delivered: {
    icon: HomeIcon,
    description: "მიწოდება წარმატებით დასრულდა და შეკვეთა ჩაბარდა.",
  },
};

const getTrackingMeta = (key: string) =>
  trackingStepMeta[key as TrackableStatus];

const fallbackTrackingStep = {
  key: "new" as TrackableStatus,
  label: "ახალი",
  state: "pending" as TrackingCardState,
};

const currentTrackingStep = computed(() => {
  const current = trackingSteps.value.find((step) => step.state === "current");

  if (current) {
    return current;
  }

  return (
    [...trackingSteps.value]
      .reverse()
      .find((step) => step.state === "complete") ||
    trackingSteps.value[0] ||
    fallbackTrackingStep
  );
});

const nextTrackingStep = computed(() =>
  trackingSteps.value.find((step) => step.state === "pending"),
);

const getTrackingNodeClasses = (state: string) => {
  switch (state as TrackingCardState) {
    case "complete":
      return "border-success bg-success text-text-invert shadow-[0_14px_28px_-22px_rgba(34,197,94,0.85)]";
    case "current":
      return "border-accent-primary bg-accent-primary text-text-invert shadow-[0_14px_30px_-20px_rgba(255,123,44,0.9)]";
    default:
      return "border-border-default bg-surface text-text-muted";
  }
};

const getTrackingLabelClasses = (state: string) =>
  (state as TrackingCardState) === "pending"
    ? "text-text-muted"
    : "text-text-primary";

const getTrackingBadgeClasses = (state: string) => {
  switch (state as TrackingCardState) {
    case "complete":
      return "border-success/25 bg-success/10 text-success";
    case "current":
      return "border-accent-primary/25 bg-accent-primary/10 text-accent-primary";
    default:
      return "border-border-default bg-surface text-text-muted";
  }
};

const getTrackingConnectorClasses = (state: string) => {
  switch (state as TrackingCardState) {
    case "complete":
      return "bg-success/60";
    case "current":
      return "bg-accent-primary/60";
    default:
      return "bg-border-default";
  }
};

const getTrackingPanelClasses = (state: string) => {
  switch (state as TrackingCardState) {
    case "complete":
      return "border-success/25 bg-[linear-gradient(180deg,rgba(240,253,244,0.96)_0%,rgba(255,255,255,0.98)_100%)] dark:bg-[linear-gradient(180deg,rgba(34,197,94,0.12)_0%,rgba(15,23,42,0.92)_100%)]";
    case "current":
      return "border-accent-primary/30 bg-[linear-gradient(180deg,rgba(255,244,236,0.96)_0%,rgba(255,255,255,0.98)_100%)] dark:bg-[linear-gradient(180deg,rgba(255,123,44,0.12)_0%,rgba(15,23,42,0.92)_100%)]";
    default:
      return "border-border-default bg-surface-2";
  }
};

const getTrackingPanelIconClasses = (state: string) => {
  switch (state as TrackingCardState) {
    case "complete":
      return "border-success/25 bg-success/10 text-success";
    case "current":
      return "border-accent-primary/25 bg-accent-primary/10 text-accent-primary";
    default:
      return "border-border-default bg-surface text-text-muted";
  }
};

const getTrackingStateLabel = (state: string) => {
  switch (state as TrackingCardState) {
    case "complete":
      return "დასრულდა";
    case "current":
      return "მიმდინარე";
    default:
      return "მოლოდინში";
  }
};
</script>

<template>
  <section class="space-y-4">
    <section
      class="rounded-[28px] border border-border-default bg-surface p-6 shadow-[0_24px_60px_-38px_var(--shadow-color)] md:p-7"
    >
      <div
        class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
      >
        <div class="max-w-3xl">
          <p
            class="text-xs font-semibold uppercase tracking-[0.14em] text-accent-primary"
          >
            შეკვეთის დეტალი
          </p>
          <h2
            class="mt-2 text-[28px] font-extrabold leading-tight text-text-primary"
          >
            {{ order.order_number }}
          </h2>
          <div
            class="mt-4 flex flex-col gap-2 text-sm text-text-secondary sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
          >
            <span class="inline-flex items-center gap-2">
              <CalendarDaysIcon
                class="h-4 w-4 shrink-0 text-text-muted"
                aria-hidden="true"
              />
              {{ formattedCreatedAt }}
            </span>
            <span>{{ getPaymentMethodLabel(order.payment_method) }}</span>
          </div>
        </div>

        <div
          class="flex flex-col items-start gap-3 sm:flex-row sm:items-center"
        >
          <ProfileStatusBadge :status="order.status" />
          <BaseButton
            as="nuxt-link"
            to="/profile/orders"
            variant="secondary"
            class="px-5 py-3"
          >
            შეკვეთების სიაში დაბრუნება
          </BaseButton>
        </div>
      </div>
    </section>

    <section class="grid gap-4 lg:grid-cols-3">
      <article
        class="rounded-[22px] border border-border-default bg-surface p-5 shadow-[0_20px_44px_-38px_var(--shadow-color)]"
      >
        <p
          class="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted"
        >
          გადახდის მეთოდი
        </p>
        <p class="mt-2 text-base font-semibold text-text-primary">
          {{ getPaymentMethodLabel(order.payment_method) }}
        </p>
      </article>

      <article
        class="rounded-[22px] border border-border-default bg-surface p-5 shadow-[0_20px_44px_-38px_var(--shadow-color)]"
      >
        <p
          class="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted"
        >
          მიმდინარე სტატუსი
        </p>
        <p class="mt-2 text-base font-semibold text-text-primary">
          {{ getOrderStatusLabel(order.status) }}
        </p>
      </article>

      <article
        class="rounded-[22px] border border-border-default bg-surface p-5 shadow-[0_20px_44px_-38px_var(--shadow-color)]"
      >
        <p
          class="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted"
        >
          სულ
        </p>
        <p
          class="mt-2 text-[28px] font-extrabold leading-none text-accent-primary"
        >
          {{ formatMoney(order.total) }}
        </p>
      </article>
    </section>

    <section
      v-if="cancelled"
      class="rounded-[24px] border border-error/30 bg-error/10 p-5 text-sm leading-7 text-text-secondary"
    >
      <p class="text-base font-semibold text-text-primary">
        შეკვეთა გაუქმებულია
      </p>
      <p class="mt-2">
        შეკვეთის დამუშავება შეწყდა. დამატებითი დაზუსტებისთვის დაგვიკავშირდი ან
        დაელოდე ოპერატორის უკუკავშირს.
      </p>
    </section>

    <section
      v-else
      class="rounded-[28px] border border-border-default bg-surface p-6 shadow-[0_24px_60px_-38px_var(--shadow-color)] md:p-7"
    >
      <div class="flex items-center gap-3">
        <span
          class="inline-flex h-10 w-10 items-center justify-center rounded-[16px] border border-accent-primary/25 bg-accent-primary/10 text-accent-primary"
        >
          <TruckIcon class="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p
            class="text-xs font-semibold uppercase tracking-[0.14em] text-accent-primary"
          >
            მიმდინარე სტატუსი
          </p>
          <h3 class="mt-1 text-xl font-bold text-text-primary">შეკვეთის გზა</h3>
        </div>
      </div>

      <p class="mt-4 text-sm leading-7 text-text-secondary">
        შეკვეთის გზა ნაჩვენებია კომპაქტურ მარშრუტად. დასრულებული ეტაპები რჩება
        უკან, აქტიური ნაბიჯი კი გამოყოფილია ცალკე ფოკუსად.
      </p>

      <div
        class="mt-6 rounded-[24px] border border-border-default bg-surface-2 px-4 py-5 md:px-5"
      >
        <div class="space-y-4">
          <article
            v-for="step in trackingSteps"
            :key="`stack-${step.key}`"
            class="flex items-start gap-3"
          >
            <span
              :class="[
                'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border',
                getTrackingNodeClasses(step.state),
              ]"
            >
              <component
                :is="getTrackingMeta(step.key).icon"
                class="h-5 w-5"
                aria-hidden="true"
              />
            </span>

            <div class="min-w-0 flex-1 pt-1">
              <div class="flex items-center justify-between gap-3">
                <p
                  :class="[
                    'text-sm font-semibold',
                    getTrackingLabelClasses(step.state),
                  ]"
                >
                  {{ step.label }}
                </p>
                <span
                  :class="[
                    'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                    getTrackingBadgeClasses(step.state),
                  ]"
                >
                  {{ getTrackingStateLabel(step.state) }}
                </span>
              </div>
              <p class="mt-2 text-xs leading-6 text-text-secondary">
                {{ getTrackingMeta(step.key).description }}
              </p>
            </div>
          </article>
        </div>
      </div>

      <article
        :class="[
          'mt-5 rounded-[22px] border px-5 py-5 shadow-[0_18px_44px_-36px_var(--shadow-color)]',
          getTrackingPanelClasses(currentTrackingStep.state),
        ]"
      >
        <div
          class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
        >
          <div class="flex items-start gap-3">
            <span
              :class="[
                'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border',
                getTrackingPanelIconClasses(currentTrackingStep.state),
              ]"
            >
              <component
                :is="getTrackingMeta(currentTrackingStep.key).icon"
                class="h-5 w-5"
                aria-hidden="true"
              />
            </span>

            <div class="min-w-0">
              <p
                class="text-xs font-semibold uppercase tracking-[0.14em] text-accent-primary"
              >
                აქტიური ეტაპი
              </p>
              <h4 class="mt-2 text-lg font-bold text-text-primary">
                {{ currentTrackingStep.label }}
              </h4>
              <p class="mt-2 max-w-2xl text-sm leading-7 text-text-secondary">
                {{ getTrackingMeta(currentTrackingStep.key).description }}
              </p>
            </div>
          </div>

          <div class="flex flex-col gap-2 lg:items-end">
            <span
              :class="[
                'inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-semibold',
                getTrackingBadgeClasses(currentTrackingStep.state),
              ]"
            >
              {{ getTrackingStateLabel(currentTrackingStep.state) }}
            </span>
            <p v-if="nextTrackingStep" class="text-sm text-text-secondary">
              შემდეგი ეტაპი:
              <span class="font-semibold text-text-primary">{{
                nextTrackingStep.label
              }}</span>
            </p>
            <p v-else class="text-sm text-text-secondary">
              შეკვეთის მარშრუტი სრულად დასრულებულია.
            </p>
          </div>
        </div>
      </article>
    </section>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
      <section
        class="rounded-[28px] border border-border-default bg-surface p-6 shadow-[0_24px_60px_-38px_var(--shadow-color)] md:p-7"
      >
        <div class="flex items-center gap-3">
          <span
            class="inline-flex h-10 w-10 items-center justify-center rounded-[16px] border border-border-default bg-surface-2 text-text-primary"
          >
            <MapPinIcon class="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p
              class="text-xs font-semibold uppercase tracking-[0.14em] text-accent-primary"
            >
              მიწოდება
            </p>
            <h3 class="mt-1 text-xl font-bold text-text-primary">
              საკონტაქტო და მისამართის დეტალები
            </h3>
          </div>
        </div>

        <div class="mt-6 grid gap-4 md:grid-cols-2">
          <article
            class="rounded-[20px] border border-border-default bg-surface-2 px-4 py-4"
          >
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted"
            >
              მყიდველი
            </p>
            <p class="mt-2 text-base font-semibold text-text-primary">
              {{ order.first_name }} {{ order.last_name }}
            </p>
          </article>

          <article
            class="rounded-[20px] border border-border-default bg-surface-2 px-4 py-4"
          >
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted"
            >
              ტელეფონი
            </p>
            <p class="mt-2 text-base font-semibold text-text-primary">
              {{ order.phone }}
            </p>
          </article>

          <article
            v-if="order.email"
            class="rounded-[20px] border border-border-default bg-surface-2 px-4 py-4 md:col-span-2"
          >
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted"
            >
              ელფოსტა
            </p>
            <p class="mt-2 text-base font-semibold text-text-primary">
              {{ order.email }}
            </p>
          </article>

          <article
            class="rounded-[20px] border border-border-default bg-surface-2 px-4 py-4"
          >
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted"
            >
              ქალაქი
            </p>
            <p class="mt-2 text-base font-semibold text-text-primary">
              {{ order.city }}
            </p>
          </article>

          <article
            class="rounded-[20px] border border-border-default bg-surface-2 px-4 py-4 md:col-span-2"
          >
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted"
            >
              მისამართი
            </p>
            <p class="mt-2 text-base font-semibold leading-7 text-text-primary">
              {{ order.address_line }}
            </p>
          </article>

          <article
            v-if="order.note"
            class="rounded-[20px] border border-border-default bg-surface-2 px-4 py-4 md:col-span-2"
          >
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted"
            >
              კომენტარი
            </p>
            <p class="mt-2 text-sm leading-7 text-text-secondary">
              {{ order.note }}
            </p>
          </article>
        </div>
      </section>

      <aside class="space-y-4 xl:sticky xl:top-40">
        <section
          class="rounded-[28px] border border-border-default bg-surface p-6 shadow-[0_24px_60px_-38px_var(--shadow-color)] md:p-7"
        >
          <div class="flex items-center gap-3">
            <span
              class="inline-flex h-10 w-10 items-center justify-center rounded-[16px] border border-border-default bg-surface-2 text-text-primary"
            >
              <CubeIcon class="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p
                class="text-xs font-semibold uppercase tracking-[0.14em] text-accent-primary"
              >
                პროდუქტები
              </p>
              <h3 class="mt-1 text-xl font-bold text-text-primary">
                შეკვეთილი ნივთები
              </h3>
            </div>
          </div>

          <div class="mt-6 space-y-3">
            <article
              v-for="item in order.items"
              :key="item.id"
              class="rounded-[20px] border border-border-default bg-surface-2 px-4 py-4"
            >
              <div class="flex items-start gap-3">
                <div
                  class="h-11 w-11 shrink-0 overflow-hidden rounded-[14px] border border-border-default bg-white/95"
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
                  <p class="text-sm font-semibold text-text-primary">
                    {{ item.product_name }}
                  </p>
                  <p class="mt-1 text-xs text-text-muted">
                    {{ item.quantity }} ც. · SKU: {{ item.sku || "—" }}
                  </p>
                </div>

                <p class="shrink-0 text-sm font-semibold text-text-primary">
                  {{ formatMoney(item.line_total) }}
                </p>
              </div>
            </article>
          </div>
        </section>

        <section
          class="rounded-[28px] border border-border-default bg-surface p-6 shadow-[0_24px_60px_-38px_var(--shadow-color)] md:p-7"
        >
          <div class="space-y-3">
            <div
              class="flex items-center justify-between text-sm text-text-secondary"
            >
              <span>პროდუქტები</span>
              <span>{{ totalUnits }} ცალი</span>
            </div>
            <div
              class="flex items-center justify-between text-sm text-text-secondary"
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
        </section>
      </aside>
    </div>
  </section>
</template>
