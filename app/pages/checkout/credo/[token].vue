<script setup lang="ts">
import BaseButton from "~/components/common/BaseButton.vue";
import { useCheckoutIdempotency } from "~/composables/commerce/useCheckoutIdempotency";
import { useCredoApplicationStatus } from "~/composables/commerce/useCredoApplicationStatus";
import { clearCredoApplication, isCredoToken, safeCredoRedirect } from "~/utils/credoCheckout";

definePageMeta({ skipCmsLoader: true });
useSeoMeta({ title: "კრედოს განაცხადი | FlexDrive", robots: "noindex, nofollow" });
const route = useRoute();
const store = useGlobalStore();
const cartKey = useCheckoutIdempotency("cart");
const buyNowKey = useCheckoutIdempotency("buy-now");
const token = computed(() => String(route.params.token || ""));
const { application, pending, error, refresh } = useCredoApplicationStatus(token);
const manualRefreshPending = ref(false);
const refreshStatus = async () => {
  if (pending.value || manualRefreshPending.value) return;
  manualRefreshPending.value = true;
  try {
    await refresh();
  } finally {
    manualRefreshPending.value = false;
  }
};
const redirectUrl = computed(() => safeCredoRedirect(application.value?.redirect_url));
const checkoutPath = computed(() => application.value?.source === "buy_now" ? "/buy-now/checkout" : "/checkout");
const restartCheckout = async () => {
  if (!application.value?.can_restart_checkout) return;
  (application.value.source === "cart" ? cartKey : buyNowKey).clearKey();
  await navigateTo(checkoutPath.value);
};
// Keep this page open while the bank runs in a separate tab. The documented
// widget has no return URL parameter; do not invent one or rely on browser Back.
watch(application, async (value) => {
  if (!value) return;
  if (value.can_restart_checkout || value.ready_to_ship || value.funding_completed) {
    clearCredoApplication(value.source, String(store.currentUser?.id ?? "guest"), value.application_token);
  }
  if (route.query.continue === "1") {
    // Consume older checkout links without leaving this page or resubmitting.
    await navigateTo({ path: route.path, query: {} }, { replace: true });
  }
  if ((value.ready_to_ship || value.funding_completed) && isCredoToken(value.order_public_token)) {
    await navigateTo(`/checkout/success/${value.order_public_token}`, { replace: true });
  }
});
</script>

<template>
  <main class="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
    <section class="rounded-3xl border border-border-default bg-surface p-5 text-text-primary sm:p-8">
      <h1 class="text-xl font-bold leading-8 sm:text-2xl">კრედოს განაცხადი</h1>
      <p v-if="!application && pending" class="mt-4 text-sm text-text-secondary" role="status">მდგომარეობა მოწმდება…</p>
      <p v-if="error" class="mt-4 text-sm text-error" role="alert">{{ error }}</p>
      <template v-if="application">
        <p v-if="application.checked_at || application.stage !== 'processing'" class="mt-4 text-lg font-semibold" role="status" aria-live="polite">{{ application.label }}</p>
        <p class="mt-2 text-sm text-text-secondary">საერთო თანხა მიწოდებით: {{ application.amount }} ₾</p>
        <p v-if="application.order_number" class="mt-2 text-sm">შეკვეთა №{{ application.order_number }}</p>
        <p v-if="application.funding_completed" class="mt-4 text-sm leading-6 text-text-secondary">
          კრედომ დაფინანსების დასრულება დაადასტურა.
        </p>
        <p v-else-if="application.ready_to_ship" class="mt-4 text-sm leading-6 text-text-secondary">
          ხელშეკრულება ხელმოწერილია. შეკვეთა მიღებულია და მიწოდებას მოვამზადებთ.
          ნივთის მიღების შემდეგ დაადასტურეთ ჩაბარება კრედოს გვერდზე.
        </p>
        <p v-else-if="application.can_restart_checkout" class="mt-4 text-sm leading-6 text-text-secondary">
          ამ განაცხადით შეძენა არ დასრულებულა. შეგიძლიათ დაბრუნდეთ ჩექაუთში და აირჩიოთ გადახდის მეთოდი.
        </p>
        <p v-else-if="application.stage === 'review'" class="mt-4 text-sm leading-6 text-text-secondary">
          განაცხადის მდგომარეობას ვამოწმებთ. ახალი განაცხადი არ დაიწყოთ.
          საჭიროების შემთხვევაში ჩვენი გუნდი დაგიკავშირდებათ.
        </p>
        <p v-else class="mt-4 text-sm leading-6 text-text-secondary">
          კრედოს გვერდი გაიხსნება ახალ ჩანართში. იქ გაიარეთ მოთხოვნილი ნაბიჯები და მოაწერეთ ხელი ხელშეკრულებას.
          ეს გვერდი ღია დატოვეთ და დასრულების შემდეგ დაბრუნდით ამ ჩანართზე —
          სტატუსი ავტომატურად განახლდება და შეკვეთის შექმნის შემდეგ მის დეტალებს გაჩვენებთ.
          ახალი განაცხადის დაწყება საჭირო არ არის.
        </p>
      </template>
      <div class="mt-6 flex flex-wrap gap-3">
        <BaseButton v-if="redirectUrl" as="a" :href="redirectUrl" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">გაგრძელება კრედოში — ახალი ჩანართი</BaseButton>
        <BaseButton variant="secondary" :loading="manualRefreshPending" @click="refreshStatus">სტატუსის განახლება</BaseButton>
        <BaseButton v-if="application?.order_public_token" as="nuxt-link" :to="`/checkout/success/${application.order_public_token}`" variant="secondary">შეკვეთის ნახვა</BaseButton>
        <BaseButton v-if="application?.can_restart_checkout" variant="secondary" @click="restartCheckout">ჩექაუთში დაბრუნება</BaseButton>
        <BaseButton as="nuxt-link" to="/" variant="ghost">მთავარი გვერდი</BaseButton>
      </div>
    </section>
  </main>
</template>
