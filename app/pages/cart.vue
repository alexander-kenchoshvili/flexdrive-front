<script setup lang="ts">
import AppBreadcrumbs from "~/components/common/AppBreadcrumbs.vue";
import BaseButton from "~/components/common/BaseButton.vue";
import CartEmptyState from "~/components/commerce/CartEmptyState.vue";
import CartLineItem from "~/components/commerce/CartLineItem.vue";
import CartPageSkeleton from "~/components/commerce/CartPageSkeleton.vue";
import CartSummaryCard from "~/components/commerce/CartSummaryCard.vue";

type BreadcrumbItem = {
  label: string;
  to?: string;
};

definePageMeta({
  skipCmsLoader: true,
});

const globalStore = useGlobalStore();
const cartStore = useCartStore();
const isClientReady = ref(false);
const cartActionPending = ref(false);
const desktopPriceFeedbackSelector = '[data-cart-price-feedback="desktop"]';

const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
  { label: "მთავარი", to: "/" },
  { label: "კალათა" },
]);

const lineItemLabel = computed(() => `${cartStore.lineItemCount} პროდუქტი`);

const isInitialLoading = computed(
  () =>
    !isClientReady.value ||
    !globalStore.authResolved ||
    (!cartStore.initialized && !cartStore.error),
);
const hasHardLoadError = computed(
  () =>
    isClientReady.value &&
    !cartStore.loading &&
    !cartStore.initialized &&
    Boolean(cartStore.error),
);
const hasSoftError = computed(
  () =>
    isClientReady.value &&
    cartStore.initialized &&
    Boolean(cartStore.error) &&
    !cartStore.loading,
);

const retryLoad = async () => {
  try {
    await cartStore.refreshCart();
  } catch {
    // The store already normalizes the error message for rendering.
  }
};

const scrollToPriceFeedback = async () => {
  if (!import.meta.client) return;
  if (window.matchMedia("(max-width: 1023px)").matches) return;

  await nextTick();

  const target = document.querySelector<HTMLElement>(desktopPriceFeedbackSelector);
  if (!target) return;

  target.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "center",
    inline: "nearest",
  });
};

const scrollToAvailabilityAttention = async () => {
  if (!import.meta.client) return;

  const targetItemId = cartStore.firstAvailabilityAttentionItemId;
  if (!targetItemId) return;

  await nextTick();

  const target = document.querySelector<HTMLElement>(
    `[data-cart-item-id="${targetItemId}"]`,
  );
  if (!target) return;

  target.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "center",
    inline: "nearest",
  });
};

const syncAvailabilityAttentionState = async () => {
  if (!cartStore.hasAvailabilityAttention) {
    return;
  }

  try {
    await cartStore.refreshCart();
  } catch {
    // Store error is already normalized for UI rendering.
  }

  await scrollToAvailabilityAttention();
};

const confirmPrices = async () => {
  if (cartStore.mutating || cartStore.loading) {
    return;
  }

  try {
    await cartStore.confirmPrices();
  } catch {
    // Store error is already normalized for UI rendering.
  }
};

const handlePrimaryCartAction = async () => {
  if (cartStore.mutating || cartStore.loading || cartActionPending.value) {
    return;
  }

  if (cartStore.hasPriceChanges) {
    await scrollToPriceFeedback();
    await confirmPrices();
    return;
  }

  cartActionPending.value = true;

  try {
    await cartStore.refreshCart();

    if (cartStore.hasPriceChanges) {
      await scrollToPriceFeedback();
      return;
    }

    await navigateTo("/checkout");
  } catch {
    // Store error is already normalized for UI rendering.
  } finally {
    cartActionPending.value = false;
  }
};

onMounted(() => {
  isClientReady.value = true;
  void syncAvailabilityAttentionState();
});

useSeoMeta({
  title: "კალათა",
  description:
    "შეამოწმე დამატებული პროდუქტები და მოემზადე შეკვეთის გასაფორმებლად.",
});
</script>

<template>
  <main class="py-8 pb-32 md:py-10 md:pb-36 lg:pb-12">
    <div class="container-fluid">
      <div class="space-y-8">
        <AppBreadcrumbs :items="breadcrumbItems" />

        <section
          class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"
        >
          <div class="max-w-3xl">
            <h1
              class="title-under-xs text-[34px] font-extrabold upper leading-tight text-text-primary md:text-[44px]"
            >
              კალათა
            </h1>
            <p
              class="subtitle-under-xs mt-3 text-sm leading-7 text-text-secondary md:text-base"
            >
              გადაამოწმე დამატებული პროდუქტები, განსაზღვრე რაოდენობა და
              შემდეგ ეტაპზე გადასვლამდე ნახე შეკვეთის ჯამი.
            </p>
          </div>

          <div
            class="inline-flex w-fit items-center gap-2 rounded-full border border-border-default bg-surface px-4 py-2 text-sm font-semibold text-text-secondary shadow-[0_16px_40px_-34px_var(--shadow-color)]"
          >
            <span class="h-2.5 w-2.5 rounded-full bg-accent-primary" />
            {{ lineItemLabel }}
          </div>
        </section>

        <CartPageSkeleton v-if="isInitialLoading" />

        <section
          v-else-if="hasHardLoadError"
          class="rounded-[24px] border border-error/30 bg-surface p-6 text-sm text-text-secondary shadow-[0_24px_60px_-38px_var(--shadow-color)]"
        >
          <p class="text-base font-semibold text-text-primary">
            კალათის ჩატვირთვა ვერ მოხერხდა.
          </p>
          <p class="mt-2">
            {{ cartStore.error || "გთხოვ სცადო ხელახლა ან დაბრუნდე კატალოგში." }}
          </p>
          <div class="mt-4 flex flex-col gap-3 sm:flex-row">
            <BaseButton type="button" variant="primary" @click="retryLoad">
              თავიდან ცდა
            </BaseButton>
            <BaseButton as="nuxt-link" to="/catalog" variant="secondary">
              კატალოგში დაბრუნება
            </BaseButton>
          </div>
        </section>

        <CartEmptyState v-else-if="cartStore.isEmpty" />

        <section
          v-else
          class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start"
        >
          <div class="space-y-4">
            <div
              v-if="hasSoftError"
              class="rounded-[20px] border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-text-secondary"
            >
              {{ cartStore.error }}
            </div>

            <CartLineItem
              v-for="item in cartStore.items"
              :key="item.id"
              :item="item"
              :attention="cartStore.getAvailabilityAttention(item.id)"
              :disabled="cartStore.mutating"
              @increment="void cartStore.increment(item.id)"
              @decrement="void cartStore.decrement(item.id)"
              @remove="void cartStore.removeItem(item.id)"
            />
          </div>

          <div class="xl:sticky xl:top-40">
            <CartSummaryCard
              :item-count="cartStore.itemCount"
              :subtotal="cartStore.subtotal"
              :total="cartStore.total"
              :disabled="cartStore.mutating || cartStore.loading || cartActionPending"
              :primary-label="
                cartStore.hasPriceChanges
                  ? cartStore.priceConfirmationLabel
                  : 'შეკვეთის გაფორმება'
              "
              primary-as="button"
              :primary-loading="cartStore.mutating || cartActionPending"
              :price-change-message="cartStore.priceChangeMessage"
              @primary-action="void handlePrimaryCartAction()"
            />
          </div>
        </section>
      </div>
    </div>

    <div
      v-if="!isInitialLoading && !hasHardLoadError && !cartStore.isEmpty"
      class="fixed inset-x-0 bottom-0 z-30 border-t border-[#17345f] bg-[#020c1d] px-3 py-3 shadow-[0_-10px_34px_rgba(2,6,23,0.28)] md:px-6 lg:hidden"
    >
      <div
        class="mx-auto flex max-w-7xl flex-col gap-3 rounded-[20px] border border-[#17345f] bg-[#081a38] px-4 py-3 sm:flex-wrap sm:items-center"
      >
        <div
          v-if="cartStore.priceChangeMessage"
          data-cart-price-feedback="mobile"
          class="rounded-[18px] border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-text-secondary sm:basis-full"
        >
          {{ cartStore.priceChangeMessage }}
        </div>

        <div class="min-w-0 flex-1">
          <p
            class="text-xs font-medium uppercase tracking-[0.12em] text-text-muted"
          >
            შეკვეთის ჯამი
          </p>
          <p
            class="mt-1 text-2xl font-extrabold leading-none text-accent-primary"
          >
            {{ Number(cartStore.total || 0).toFixed(2) }} GEL
          </p>
        </div>

        <BaseButton
          as="button"
          variant="primary"
          class="w-full px-5 py-3 text-sm upper sm:w-auto sm:whitespace-nowrap"
          :loading="cartStore.mutating || cartActionPending"
          :disabled="cartStore.mutating || cartStore.loading || cartActionPending"
          @click="void handlePrimaryCartAction()"
        >
          {{
            cartStore.hasPriceChanges
              ? cartStore.priceConfirmationLabel
              : "შეკვეთის გაფორმება"
          }}
        </BaseButton>
      </div>
    </div>
  </main>
</template>
