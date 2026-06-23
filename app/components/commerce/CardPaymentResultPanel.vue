<script setup lang="ts">
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  ReceiptRefundIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from "@heroicons/vue/24/outline";
import BaseButton from "~/components/common/BaseButton.vue";
import type { CommerceCardPayment } from "~/types/commerce";

type ResultHint = "success" | "fail";
type VisualState =
  | "loading"
  | "waiting"
  | "paid"
  | "paid_review"
  | "failed"
  | "cancelled"
  | "verification"
  | "refund_pending"
  | "refunded"
  | "error";

const props = withDefaults(
  defineProps<{
    payment?: CommerceCardPayment | null;
    hint: ResultHint;
    initialLoading?: boolean;
    refreshing?: boolean;
    loadError?: boolean;
    automaticChecksComplete?: boolean;
    lastCheckedAt?: string;
    recoveryLabel?: string;
  }>(),
  {
    payment: null,
    initialLoading: false,
    refreshing: false,
    loadError: false,
    automaticChecksComplete: false,
    lastCheckedAt: "",
    recoveryLabel: "შეკვეთაზე დაბრუნება",
  },
);

defineEmits<{
  refresh: [];
  continuePayment: [];
  recover: [];
}>();

const visualState = computed<VisualState>(() => {
  if (props.initialLoading && !props.payment) return "loading";
  if (props.loadError && !props.payment) return "error";

  switch (props.payment?.result) {
    case "paid":
      return props.payment.order_public_token ? "paid" : "paid_review";
    case "failed":
      return "failed";
    case "cancelled":
      return "cancelled";
    case "verification_pending":
      return "verification";
    case "refund_pending":
      return "refund_pending";
    case "refunded":
      return "refunded";
    case "pending":
    case "authorized":
    default:
      return "waiting";
  }
});

const stateContent = computed(() => {
  const waitingDescription =
    props.hint === "fail"
      ? "ბანკის გვერდიდან დაბრუნდი, თუმცა საბოლოო პასუხი ჯერ არ მიგვიღია. სტატუსს უსაფრთხოდ ვამოწმებთ."
      : "ბანკის პასუხს ველოდებით. გვერდი ავტომატურად განახლდება და შეკვეთა მხოლოდ დადასტურებული გადახდის შემდეგ შეიქმნება.";

  const content = {
    loading: {
      eyebrow: "გადახდის შემოწმება",
      title: "სტატუსს ვამოწმებთ",
      description:
        "FlexDrive ბანკისგან მიღებულ საბოლოო პასუხს ამოწმებს. გვერდის დახურვა საჭირო არ არის.",
      icon: ClockIcon,
      tone: "waiting",
    },
    waiting: {
      eyebrow: "ბანკის პასუხი მოლოდინშია",
      title: "გადახდა ჯერ დასადასტურებელია",
      description: waitingDescription,
      icon: ClockIcon,
      tone: "waiting",
    },
    paid: {
      eyebrow: "გადახდა დადასტურებულია",
      title: "ყველაფერი მზად არის",
      description:
        "თანხა წარმატებით გადაიხადე. შეკვეთის დეტალების გვერდზე ავტომატურად გადაგიყვანთ.",
      icon: CheckCircleIcon,
      tone: "success",
    },
    paid_review: {
      eyebrow: "გადახდა მიღებულია",
      title: "შეკვეთას დამატებით ვამოწმებთ",
      description:
        "თანხა დადასტურდა, თუმცა შეკვეთის უსაფრთხოდ შექმნას დამატებითი შემოწმება სჭირდება. ახალი გადახდა აღარ დაიწყო — საჭიროების შემთხვევაში თანხის დაბრუნება იმავე ბარათზე დაიწყება.",
      icon: ExclamationTriangleIcon,
      tone: "warning",
    },
    failed: {
      eyebrow: "გადახდა ვერ შესრულდა",
      title: "თანხა არ ჩამოჭრილა",
      description:
        "გადახდა ბანკმა ვერ დაადასტურა. შეგიძლია დაბრუნდე შეკვეთაზე და თავიდან სცადო ან აირჩიო ნაღდი ანგარიშსწორება.",
      icon: XCircleIcon,
      tone: "error",
    },
    cancelled: {
      eyebrow: "გადახდა შეწყდა",
      title: "ოპერაცია გაუქმებულია",
      description:
        "გადახდა არ დასრულებულა და თანხა არ ჩამოჭრილა. შეკვეთის მონაცემები შეგიძლია კვლავ გამოიყენო.",
      icon: XCircleIcon,
      tone: "error",
    },
    verification: {
      eyebrow: "დამატებითი შემოწმება",
      title: "ბანკის საბოლოო პასუხს ვაზუსტებთ",
      description:
        "გადახდის ფანჯრის დრო დასრულდა, მაგრამ საბოლოო შედეგის გამოცნობა უსაფრთხო არ არის. ხელახლა გადავამოწმებთ ბანკის სტატუსს.",
      icon: ExclamationTriangleIcon,
      tone: "warning",
    },
    refund_pending: {
      eyebrow: "დაბრუნება მუშავდება",
      title: "თანხის დაბრუნება დაწყებულია",
      description:
        "ბანკმა დაბრუნების მოთხოვნა მიიღო. საბოლოო სტატუსს ბანკის დადასტურების შემდეგ გაჩვენებთ.",
      icon: ReceiptRefundIcon,
      tone: "warning",
    },
    refunded: {
      eyebrow: "დაბრუნება დასრულებულია",
      title: "თანხა დაბრუნებულია",
      description:
        "ბანკმა თანხის სრული დაბრუნება დაადასტურა. შეკვეთის სტატუსი დეტალების გვერდზეც განახლებულია.",
      icon: ReceiptRefundIcon,
      tone: "success",
    },
    error: {
      eyebrow: "კავშირის დროებითი პრობლემა",
      title: "სტატუსი ვერ გადავამოწმეთ",
      description:
        "გადახდის შედეგი არ შეგვიცვლია. სცადე სტატუსის ხელახლა შემოწმება — თანხის მდგომარეობას გამოცნობით არ ვადგენთ.",
      icon: ExclamationTriangleIcon,
      tone: "error",
    },
  } as const;

  return content[visualState.value];
});

const toneClasses = computed(() => {
  const tones = {
    waiting: {
      icon: "border-accent-primary/30 bg-accent-primary/10 text-accent-primary",
      badge: "border-accent-primary/30 bg-accent-primary/10 text-accent-primary",
      rail: "bg-accent-primary",
    },
    success: {
      icon: "border-success/30 bg-success/10 text-success",
      badge: "border-success/30 bg-success/10 text-success",
      rail: "bg-success",
    },
    warning: {
      icon: "border-warning/30 bg-warning/10 text-warning",
      badge: "border-warning/30 bg-warning/10 text-warning",
      rail: "bg-warning",
    },
    error: {
      icon: "border-error/30 bg-error/10 text-error",
      badge: "border-error/30 bg-error/10 text-error",
      rail: "bg-error",
    },
  };

  return tones[stateContent.value.tone];
});

const isWaiting = computed(() =>
  ["loading", "waiting", "paid_review", "verification", "refund_pending"].includes(
    visualState.value,
  ),
);
const canContinuePayment = computed(
  () => visualState.value === "waiting" && Boolean(props.payment?.redirect_url),
);
const canRecover = computed(() =>
  ["failed", "cancelled", "error"].includes(visualState.value),
);
const canOpenOrder = computed(
  () =>
    ["paid", "refund_pending", "refunded"].includes(visualState.value) &&
    Boolean(props.payment?.order_public_token),
);

const formattedAmount = computed(() =>
  props.payment
    ? `${Number(props.payment.amount || 0).toFixed(2)} ${props.payment.currency}`
    : "—",
);

const shortReference = computed(() => {
  const token = String(props.payment?.payment_token || "");
  return token ? token.slice(-8).toUpperCase() : "—";
});

const confirmationStepLabel = computed(() => {
  if (visualState.value === "paid") return "დადასტურებულია";
  if (visualState.value === "paid_review") return "შემოწმებაშია";
  if (["failed", "cancelled"].includes(visualState.value)) return "არ შესრულდა";
  if (visualState.value === "refunded") return "დაბრუნებულია";
  return "მოლოდინშია";
});
</script>

<template>
  <section class="mx-auto w-full max-w-[1040px]">
    <div
      class="overflow-hidden rounded-[24px] border border-border-default bg-surface shadow-[0_28px_70px_-48px_var(--shadow-color)] md:rounded-[30px]"
    >
      <div :class="['h-1.5 w-full', toneClasses.rail]" />

      <div class="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div class="min-w-0 p-4 sm:p-6 md:p-8 lg:p-10">
          <div class="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start">
            <div
              :class="[
                'payment-status-icon inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] border sm:h-[72px] sm:w-[72px] sm:rounded-[22px]',
                toneClasses.icon,
                isWaiting ? 'payment-status-icon--active' : '',
              ]"
            >
              <component
                :is="stateContent.icon"
                class="h-8 w-8 sm:h-9 sm:w-9"
                aria-hidden="true"
              />
            </div>

            <div class="min-w-0 flex-1">
              <span
                :class="[
                  'inline-flex rounded-full border px-3 py-1 text-[11px] font-bold upper tracking-[0.08em]',
                  toneClasses.badge,
                ]"
              >
                {{ stateContent.eyebrow }}
              </span>

              <h1
                class="payment-result-title title-under-xs mt-3 break-words text-[28px] font-extrabold leading-[1.2] text-text-primary sm:text-[34px] md:text-[40px]"
              >
                {{ stateContent.title }}
              </h1>

              <p
                class="subtitle-under-xs mt-3 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base sm:leading-7"
              >
                {{ stateContent.description }}
              </p>

              <p
                v-if="automaticChecksComplete && isWaiting"
                class="mt-4 rounded-[16px] border border-border-default bg-surface-2 px-3 py-2.5 text-xs leading-5 text-text-secondary"
              >
                ავტომატური შემოწმება დასრულდა. სტატუსი კვლავ შეგიძლია ხელით
                განაახლო — ახალი გადახდის დაწყება ჯერ არ სცადო.
              </p>
            </div>
          </div>

          <div class="mt-7 border-t border-border-default pt-6 sm:mt-9 sm:pt-7">
            <p class="text-xs font-bold upper tracking-[0.1em] text-text-muted">
              ოპერაციის გზა
            </p>

            <ol class="mt-4 grid gap-3 sm:grid-cols-3">
              <li
                class="min-w-0 rounded-[18px] border border-success/25 bg-success/10 p-3.5"
              >
                <span class="text-[11px] font-bold text-success">01</span>
                <p class="mt-2 text-sm font-bold text-text-primary">
                  შეკვეთის მომზადება
                </p>
                <p class="mt-1 text-xs leading-5 text-text-secondary">
                  მონაცემები და მარაგი გადამოწმებულია.
                </p>
              </li>

              <li
                class="min-w-0 rounded-[18px] border border-success/25 bg-success/10 p-3.5"
              >
                <span class="text-[11px] font-bold text-success">02</span>
                <p class="mt-2 text-sm font-bold text-text-primary">
                  დაცული საბანკო გვერდი
                </p>
                <p class="mt-1 text-xs leading-5 text-text-secondary">
                  ბარათის მონაცემები FlexDrive-ში არ ინახება.
                </p>
              </li>

              <li
                :class="[
                  'min-w-0 rounded-[18px] border p-3.5',
                  toneClasses.icon,
                ]"
              >
                <span class="text-[11px] font-bold">03</span>
                <p class="mt-2 text-sm font-bold text-text-primary">
                  საბოლოო დადასტურება
                </p>
                <p class="mt-1 text-xs font-semibold leading-5">
                  {{ confirmationStepLabel }}
                </p>
              </li>
            </ol>
          </div>

          <div class="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <BaseButton
              v-if="canContinuePayment"
              type="button"
              variant="primary"
              class="min-h-11"
              @click="$emit('continuePayment')"
            >
              გადახდის გაგრძელება
              <ArrowTopRightOnSquareIcon
                class="ml-2 h-4 w-4"
                aria-hidden="true"
              />
            </BaseButton>

            <BaseButton
              v-if="isWaiting || loadError"
              type="button"
              variant="secondary"
              class="min-h-11"
              :disabled="refreshing"
              @click="$emit('refresh')"
            >
              <ArrowPathIcon
                :class="['mr-2 h-4 w-4', refreshing ? 'animate-spin' : '']"
                aria-hidden="true"
              />
              {{ refreshing ? "ვამოწმებთ..." : "სტატუსის განახლება" }}
            </BaseButton>

            <BaseButton
              v-if="canOpenOrder"
              as="nuxt-link"
              :to="`/checkout/success/${payment?.order_public_token}`"
              variant="primary"
              class="min-h-11"
            >
              შეკვეთის დეტალები
            </BaseButton>

            <BaseButton
              v-if="canRecover"
              type="button"
              variant="primary"
              class="min-h-11"
              @click="$emit('recover')"
            >
              {{ recoveryLabel }}
            </BaseButton>

            <BaseButton
              as="nuxt-link"
              to="/catalog"
              variant="ghost"
              class="min-h-11"
            >
              კატალოგში დაბრუნება
            </BaseButton>
          </div>
        </div>

        <aside
          class="min-w-0 border-t border-border-default bg-surface-2 p-4 sm:p-6 lg:border-l lg:border-t-0 lg:p-7"
        >
          <div class="flex items-center gap-3">
            <span
              class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-border-default bg-surface text-text-primary"
            >
              <ShieldCheckIcon class="h-5 w-5" aria-hidden="true" />
            </span>
            <div class="min-w-0">
              <p class="text-sm font-bold text-text-primary">
                უსაფრთხო შემოწმება
              </p>
              <p class="mt-0.5 text-xs leading-5 text-text-secondary">
                სტატუსი იკითხება FlexDrive-დან, არა redirect ტექსტიდან.
              </p>
            </div>
          </div>

          <dl class="mt-6 divide-y divide-border-default">
            <div class="flex items-center justify-between gap-4 py-3 first:pt-0">
              <dt class="text-xs font-semibold text-text-muted">თანხა</dt>
              <dd class="text-right text-base font-extrabold text-text-primary">
                {{ formattedAmount }}
              </dd>
            </div>
            <div class="flex items-center justify-between gap-4 py-3">
              <dt class="text-xs font-semibold text-text-muted">მეთოდი</dt>
              <dd class="inline-flex items-center gap-2 text-right text-sm font-bold text-text-primary">
                <CreditCardIcon class="h-4 w-4" aria-hidden="true" />
                ბარათი
              </dd>
            </div>
            <div class="flex items-center justify-between gap-4 py-3">
              <dt class="text-xs font-semibold text-text-muted">
                ოპერაციის კოდი
              </dt>
              <dd class="font-mono text-sm font-bold text-text-primary">
                {{ shortReference }}
              </dd>
            </div>
            <div class="flex items-center justify-between gap-4 py-3 last:pb-0">
              <dt class="text-xs font-semibold text-text-muted">
                ბოლო შემოწმება
              </dt>
              <dd class="text-right text-xs font-semibold text-text-secondary">
                {{ lastCheckedAt || "მიმდინარეობს" }}
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  </section>
</template>

<style scoped>
@keyframes payment-status-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 color-mix(in oklch, var(--accent-primary) 22%, transparent);
  }
  50% {
    box-shadow: 0 0 0 10px transparent;
  }
}

.payment-status-icon--active {
  animation: payment-status-pulse 1.8s ease-in-out infinite;
}

@media (max-width: 359px) {
  .payment-result-title {
    font-size: 22px;
    line-height: 30px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .payment-status-icon--active {
    animation: none;
  }
}
</style>
