<script setup lang="ts">
import { businessPreset, businessToday, reportDate, reportMoney, reportNumber } from "~/utils/businessReport";
import { resolveHttpStatusCode } from "~/utils/httpError";

const results = {
  open: "გაფორმება მიმდინარეობს",
  before_bank: "ბანკამდე შეჩერდა",
  bank_pending: "ბანკის პასუხის მოლოდინშია",
  bank_issue: "გადახდა ვერ დასრულდა",
  paid: "გადახდილია",
  paid_later: "მოგვიანებით გადაიხადა",
} as const;
type Result = keyof typeof results;
type Product = { id: number; name: string; sku: string; started: number; unfinished: number; counts: Record<Result, number> };
type Step = {
  at: string; label: string; kind: "step" | "issue";
  delivery?: string | null; service?: string | null;
  checkout?: { subtotal: string; delivery: string; total: string; service_label: string } | null;
};
type CheckoutCase = {
  started_at: string; source: string; quantity: number; unit_price: string; basket_subtotal: string;
  payment_attempts: number; result: Result; label: string; reason: string | null; steps: Step[];
  steps_limited: boolean; has_checkout_steps: boolean;
};
type CheckoutReport = {
  period: { start: string; end: string }; products: Product[]; page: number; pages: number; limited: boolean;
  detail: { id: number; page: number; pages: number; cases: CheckoutCase[] } | null;
};

const route = useRoute();
const { user } = useBusinessAuth();
const today = businessToday();
const period = typeof route.query.start === "string" && typeof route.query.end === "string"
  ? { start: route.query.start, end: route.query.end }
  : businessPreset("month", today);
const form = reactive({ ...period, q: "", result: "all" as Result | "all" });
const applied = ref({ ...form });
const report = shallowRef<CheckoutReport | null>(null);
const selectedProduct = ref<number>();
const loading = ref(false);
const errorMessage = ref("");
const fetchPrivate = $fetch.create({
  baseURL: useApiBaseUrl(), credentials: "include", cache: "no-store", retry: 0,
  timeout: 12000, onResponseError() {},
});
let controller: AbortController | undefined;

const load = async (page = 1, productId?: number, casePage = 1) => {
  controller?.abort();
  const request = new AbortController();
  controller = request;
  loading.value = true;
  errorMessage.value = "";
  try {
    const response = await fetchPrivate<CheckoutReport>("/business/checkout/", {
      query: { ...applied.value, page, product_id: productId, case_page: casePage },
      signal: request.signal,
    });
    if (!request.signal.aborted) report.value = response;
  } catch (error) {
    if (request.signal.aborted) return;
    const status = resolveHttpStatusCode(error);
    if (status === 401 || status === 403) {
      user.value = null;
      await navigateTo({ path: "/business/login", query: { next: route.path, ...(status === 403 ? { reason: "denied" } : {}) } }, { replace: true });
    } else {
      errorMessage.value = status === 400 ? "შეამოწმე თარიღები და არჩეული ფილტრები." : "ანგარიში ვერ ჩაიტვირთა. სცადე განახლება.";
    }
  } finally {
    if (!request.signal.aborted) loading.value = false;
  }
};

const apply = () => {
  if (!form.start || !form.end || form.start > form.end) {
    errorMessage.value = "აირჩიე სწორი საწყისი და საბოლოო თარიღები.";
    return;
  }
  applied.value = { ...form, q: form.q.trim() };
  selectedProduct.value = undefined;
  report.value = null;
  void load();
};

const toggleProduct = (id: number) => {
  if (selectedProduct.value === id) {
    selectedProduct.value = undefined;
    return;
  }
  selectedProduct.value = id;
  void load(report.value?.page || 1, id);
};

const showPage = (page: number) => {
  selectedProduct.value = undefined;
  void load(page);
};

const formatTime = new Intl.DateTimeFormat("ka-GE", {
  timeZone: "Asia/Tbilisi", dateStyle: "short", timeStyle: "short",
});
const time = (value: string) => formatTime.format(new Date(value));
const badgeClass = (result: Result) => ({
  "border-error/30 text-error": result === "before_bank" || result === "bank_issue",
  "border-accent-primary/30 text-accent-primary": result === "paid" || result === "paid_later",
  "border-border-default text-text-secondary": result === "open" || result === "bank_pending",
});

onMounted(() => load());
onBeforeUnmount(() => controller?.abort());
</script>

<template>
  <div class="min-w-0" :aria-busy="loading">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold md:text-3xl">დაწყებული ყიდვები</h1>
        <p class="mt-2 max-w-2xl text-sm leading-7 text-text-secondary">ნახე, რომელი პროდუქტის გაფორმება დაიწყეს, რომელ ნაბიჯამდე მივიდნენ და რა შედეგი მოჰყვა გადახდას.</p>
      </div>
      <button type="button" class="min-h-[44px] rounded-lg border border-border-default px-4 font-semibold disabled:opacity-50" :disabled="loading" @click="load(report?.page, selectedProduct, report?.detail?.page)">განახლება</button>
    </header>

    <form class="mt-6 grid gap-3 rounded-xl border border-border-default bg-surface p-4 sm:grid-cols-2 xl:grid-cols-[repeat(2,minmax(0,1fr))_minmax(0,1.5fr)_minmax(0,1.5fr)_auto]" @submit.prevent="apply">
      <label class="grid gap-2 text-xs font-semibold">
        საწყისი თარიღი
        <input v-model="form.start" type="date" required :max="today" class="min-h-[44px] min-w-0 rounded-lg border border-border-default bg-bg-primary px-3 text-sm" />
      </label>
      <label class="grid gap-2 text-xs font-semibold">
        საბოლოო თარიღი
        <input v-model="form.end" type="date" required :max="today" class="min-h-[44px] min-w-0 rounded-lg border border-border-default bg-bg-primary px-3 text-sm" />
      </label>
      <label class="grid gap-2 text-xs font-semibold">
        პროდუქტი
        <input v-model="form.q" type="search" maxlength="100" placeholder="სახელი ან SKU" class="min-h-[44px] min-w-0 rounded-lg border border-border-default bg-bg-primary px-3 text-sm" />
      </label>
      <label class="grid gap-2 text-xs font-semibold">
        ეტაპი ან შედეგი
        <select v-model="form.result" class="min-h-[44px] min-w-0 rounded-lg border border-border-default bg-bg-primary px-3 text-sm">
          <option value="all">ყველა</option>
          <option v-for="(label, value) in results" :key="value" :value="value">{{ label }}</option>
        </select>
      </label>
      <button type="submit" class="min-h-[44px] self-end rounded-lg bg-accent-primary px-5 font-bold text-text-invert disabled:opacity-50" :disabled="loading">ჩვენება</button>
    </form>

    <p v-if="errorMessage" class="mt-4 rounded-lg border border-error/30 p-4 text-error" role="alert">{{ errorMessage }}</p>
    <p v-if="loading && !report" class="py-10 text-text-muted" role="status">ანგარიში იტვირთება…</p>
    <template v-if="report">
      <p class="mt-5 text-xs text-text-muted">{{ reportDate(report.period.start) }} — {{ reportDate(report.period.end) }} · თბილისის დრო</p>
      <p v-if="report.limited" class="mt-3 text-error" role="status">ამ დიაპაზონში ჩანაწერების ნაწილი ჩანს. სრული სურათისთვის შეამცირე პერიოდი.</p>
      <p v-if="!report.products.length" class="mt-4 rounded-xl border border-border-default bg-surface p-5 text-text-secondary">ამ ფილტრებით დაწყებული ყიდვები ვერ მოიძებნა.</p>

      <section v-for="product in report.products" :key="product.id" class="mt-4 overflow-hidden rounded-xl border border-border-default bg-surface">
        <button
          type="button"
          class="flex w-full flex-wrap items-start justify-between gap-3 p-4 text-left hover:bg-surface-2 md:p-5"
          :aria-expanded="selectedProduct === product.id"
          :disabled="loading"
          @click="toggleProduct(product.id)"
        >
          <span class="min-w-0 [overflow-wrap:anywhere]">
            <span class="block text-base font-bold">{{ product.name }}</span>
            <span v-if="product.sku" class="text-xs text-text-muted">{{ product.sku }}</span>
          </span>
          <span class="min-h-[24px] font-semibold text-accent-primary">{{ selectedProduct === product.id ? "დახურვა" : "ნაბიჯების ნახვა" }}</span>
        </button>
        <dl class="grid grid-cols-2 gap-4 border-t border-border-default px-4 py-4 sm:grid-cols-4 md:px-5">
          <div><dt class="text-xs text-text-muted">დაწყებული</dt><dd class="mt-1 text-lg font-bold">{{ reportNumber(product.started) }}</dd></div>
          <div><dt class="text-xs text-text-muted">დაუმთავრებელი</dt><dd class="mt-1 text-lg font-bold">{{ reportNumber(product.unfinished) }}</dd></div>
          <div><dt class="text-xs text-text-muted">მიმდინარე ან მოლოდინში</dt><dd class="mt-1 text-lg font-bold">{{ reportNumber(product.counts.open + product.counts.bank_pending) }}</dd></div>
          <div><dt class="text-xs text-text-muted">გადახდილი</dt><dd class="mt-1 text-lg font-bold">{{ reportNumber(product.counts.paid + product.counts.paid_later) }}</dd><dd v-if="product.counts.paid_later" class="text-xs text-text-muted">{{ reportNumber(product.counts.paid_later) }} მოგვიანებით</dd></div>
        </dl>

        <div v-if="selectedProduct === product.id" class="space-y-4 border-t border-border-default bg-bg-primary p-4 md:p-5">
          <p v-if="loading" role="status" class="text-text-muted">ყიდვის ნაბიჯები იტვირთება…</p>
          <template v-if="report.detail?.id === product.id">
            <article v-for="(entry, index) in report.detail.cases" :key="index" class="rounded-lg border border-border-default bg-surface p-4">
              <header class="flex flex-wrap items-start justify-between gap-2">
                <div><h3 class="font-bold">{{ time(entry.started_at) }}</h3><p class="text-xs text-text-muted">{{ entry.source }} · {{ entry.quantity }} ცალი × {{ reportMoney(entry.unit_price) }}</p></div>
                <span class="rounded-md border px-2 py-1 text-xs font-semibold" :class="badgeClass(entry.result)">{{ entry.label }}</span>
              </header>
              <p v-if="entry.reason" class="mt-3 font-semibold text-error">{{ entry.reason }}</p>
              <p v-else-if="entry.result === 'before_bank'" class="mt-3 text-text-secondary">დაფიქსირებულია ბოლო ნაბიჯი. მიზეზი დაუდგენელია.</p>
              <p class="mt-3 text-xs text-text-muted">პროდუქტების ჯამი {{ reportMoney(entry.basket_subtotal) }} · შენახული გადახდის მცდელობები {{ entry.payment_attempts }}</p>
              <p v-if="!entry.has_checkout_steps" class="mt-2 text-xs text-text-muted">ბანკამდე გავლილი ნაბიჯები ამ ყიდვაზე არ არის აღრიცხული.</p>
              <ol class="mt-4 space-y-3 border-l border-border-default pl-4">
                <li v-for="(step, stepIndex) in entry.steps" :key="stepIndex">
                  <time :datetime="step.at" class="block text-xs text-text-muted">{{ time(step.at) }}</time>
                  <p class="font-semibold" :class="step.kind === 'issue' ? 'text-error' : ''">{{ step.label }}</p>
                  <p v-if="step.delivery != null" class="text-xs text-text-secondary">{{ step.service }} · {{ reportMoney(step.delivery) }}</p>
                  <p v-if="step.checkout" class="text-xs text-text-secondary">{{ step.checkout.service_label }} · მიტანა {{ reportMoney(step.checkout.delivery) }} · სულ {{ reportMoney(step.checkout.total) }}</p>
                </li>
              </ol>
              <p v-if="entry.steps_limited" class="mt-3 text-xs text-text-muted">ნაჩვენებია ბოლო 40 ნაბიჯი.</p>
            </article>
            <div v-if="report.detail.pages > 1" class="flex flex-wrap items-center gap-3 text-xs">
              <button type="button" class="min-h-[44px] rounded-lg border border-border-default px-3 disabled:opacity-50" :disabled="loading || report.detail.page === 1" @click="load(report.page, product.id, report.detail.page - 1)">წინა</button>
              <span>ყიდვები · {{ report.detail.page }} / {{ report.detail.pages }}</span>
              <button type="button" class="min-h-[44px] rounded-lg border border-border-default px-3 disabled:opacity-50" :disabled="loading || report.detail.page === report.detail.pages" @click="load(report.page, product.id, report.detail.page + 1)">შემდეგი</button>
            </div>
          </template>
        </div>
      </section>
      <nav v-if="report.pages > 1" class="mt-5 flex flex-wrap items-center gap-3 text-xs" aria-label="პროდუქტების გვერდები">
        <button type="button" class="min-h-[44px] rounded-lg border border-border-default px-4 disabled:opacity-50" :disabled="loading || report.page === 1" @click="showPage(report.page - 1)">წინა</button>
        <span>პროდუქტები · {{ report.page }} / {{ report.pages }}</span>
        <button type="button" class="min-h-[44px] rounded-lg border border-border-default px-4 disabled:opacity-50" :disabled="loading || report.page === report.pages" @click="showPage(report.page + 1)">შემდეგი</button>
      </nav>
      <p class="mt-5 max-w-3xl text-xs leading-6 text-text-muted">ბანკამდე ნაბიჯები აღირიცხება ანალიტიკაზე თანხმობის შემდეგ. 24 საათის განმავლობაში იმავე კალათისა და პროდუქტების მცდელობები ერთად ჩანს. ერთ ყიდვაში რამდენიმე პროდუქტია შესაძლებელი, ამიტომ ის თითოეული მათგანის ქვეშ გამოჩნდება.</p>
    </template>
  </div>
</template>
