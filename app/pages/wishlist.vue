<script setup lang="ts">
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  HeartIcon,
} from "@heroicons/vue/24/outline";
import BaseButton from "~/components/common/BaseButton.vue";
import ProfileShell from "~/components/profile/ProfileShell.vue";
import WishlistProductCard from "~/components/commerce/WishlistProductCard.vue";
import type { WishlistItem } from "~/types/commerce";

definePageMeta({
  skipCmsLoader: true,
});

const globalStore = useGlobalStore();
const wishlistStore = useWishlistStore();
const cartStore = useCartStore();
const isClientReady = ref(false);
const isAuthenticated = computed(() => Boolean(globalStore.currentUser));

const activeCartProductId = ref<number | null>(null);
const cartFeedback = ref<string | null>(null);
const cartFeedbackTone = ref<"success" | "error" | null>(null);

const shouldLoadWishlist = computed(
  () => isClientReady.value && globalStore.authResolved,
);

const {
  pending,
  error,
  refresh,
} = useAsyncData("wishlist-page", () => wishlistStore.refreshWishlist(), {
  server: false,
  immediate: false,
});

const items = computed(() => wishlistStore.items);
const inStockCount = computed(() => items.value.filter((item) => item.in_stock).length);
const unavailableCount = computed(() => items.value.length - inStockCount.value);

const isInitialLoading = computed(
  () => !shouldLoadWishlist.value || (pending.value && !wishlistStore.initialized),
);
const hasHardLoadError = computed(
  () =>
    !isInitialLoading.value &&
    !wishlistStore.initialized &&
    Boolean(error.value || wishlistStore.error),
);

const clearCartFeedback = () => {
  cartFeedback.value = null;
  cartFeedbackTone.value = null;
};

watch(
  shouldLoadWishlist,
  (canLoadWishlist) => {
    if (!canLoadWishlist) {
      return;
    }

    void refresh();
  },
  { immediate: true },
);

const retryLoad = async () => {
  clearCartFeedback();

  try {
    await refresh();
  } catch {
    // Store-level error is enough for rendering.
  }
};

onMounted(() => {
  isClientReady.value = true;
});

const handleAddToCart = async (item: WishlistItem) => {
  if (!item.in_stock || activeCartProductId.value === item.product_id) {
    return;
  }

  activeCartProductId.value = item.product_id;
  clearCartFeedback();

  try {
    await cartStore.addItem(item.product_id, 1);
    cartFeedback.value = `${item.name} წარმატებით დაემატა კალათაში.`;
    cartFeedbackTone.value = "success";
  } catch {
    await Promise.allSettled([cartStore.refreshCart(), refresh()]);
    cartFeedback.value =
      cartStore.error ||
      "პროდუქტის კალათაში დამატება ვერ მოხერხდა. გთხოვ სცადო ხელახლა.";
    cartFeedbackTone.value = "error";
  } finally {
    activeCartProductId.value = null;
  }
};

const handleRemove = async (productId: number) => {
  clearCartFeedback();

  try {
    await wishlistStore.removeItem(productId);
  } catch {
    // Store-level error is enough for rendering.
  }
};

useNoindexPage({
  title: "სასურველები",
  description:
    "გადაავლე თვალი შენახულ პროდუქტებს და დაამატე კალათაში მაშინ, როცა შესაძენად მზად იქნები.",
});
</script>

<template>
  <ProfileShell
    active-section="wishlist"
    title="სურვილები"
    :hide-sidebar-when-guest="!isAuthenticated"
    compact-mobile
    eyebrow=""
    subtitle="აქ ინახება შენ მიერ მონიშნული პროდუქტები. გადაავლე თვალი, შეადარე მიმდინარე ფასებს და მზადყოფნისას პირდაპირ კალათაში დაამატე."
  >
    <div class="space-y-4 sm:space-y-8">
        <section
          class="flex flex-col gap-3 rounded-[24px] border border-border-default bg-surface p-3 shadow-[0_24px_60px_-38px_var(--shadow-color)] sm:gap-4 sm:p-5 md:p-6 lg:flex-row lg:items-center lg:justify-between"
        >
          <div class="flex flex-wrap items-center gap-2 sm:gap-3">
            <div
              class="inline-flex items-center gap-2 rounded-full border border-border-default bg-surface-2 px-3 py-1.5 text-sm font-semibold text-text-secondary sm:px-4 sm:py-2"
            >
              <span class="h-2.5 w-2.5 rounded-full bg-accent-primary" />
              სულ შენახული:
              <span class="text-text-primary">{{ items.length }}</span>
            </div>

            <div
              class="inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/10 px-3 py-1.5 text-sm font-semibold text-success sm:px-4 sm:py-2"
            >
              <span class="h-2.5 w-2.5 rounded-full bg-success" />
              მარაგშია:
              <span>{{ inStockCount }}</span>
            </div>

            <div
              class="inline-flex items-center gap-2 rounded-full border border-border-default bg-surface-2 px-3 py-1.5 text-sm font-semibold text-text-secondary sm:px-4 sm:py-2"
            >
              <span class="h-2.5 w-2.5 rounded-full bg-border-default" />
              მიუწვდომელია:
              <span class="text-text-primary">{{ unavailableCount }}</span>
            </div>
          </div>

          <BaseButton
            as="nuxt-link"
            to="/catalog"
            variant="secondary"
            class="whitespace-nowrap px-4 py-2.5 sm:px-5 sm:py-3"
          >
            <template #left>
              <ArrowLeftIcon class="h-4 w-4" aria-hidden="true" />
            </template>
            კატალოგში დაბრუნება
          </BaseButton>
        </section>

        <section
          v-if="cartFeedback"
          :class="[
            'rounded-[20px] border px-3 py-2 text-sm sm:px-4 sm:py-3',
            cartFeedbackTone === 'success'
              ? 'border-success/25 bg-success/10 text-success'
              : 'border-error/25 bg-error/10 text-error',
          ]"
        >
          {{ cartFeedback }}
        </section>

        <section
          v-if="wishlistStore.error && wishlistStore.initialized"
          class="rounded-[20px] border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-text-secondary sm:px-4 sm:py-3"
        >
          {{ wishlistStore.error }}
        </section>

        <section
          v-if="isInitialLoading"
          class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
        >
          <div
            v-for="index in 6"
            :key="index"
            class="overflow-hidden rounded-[24px] border border-border-default bg-surface shadow-[0_24px_60px_-38px_var(--shadow-color)]"
          >
            <div class="aspect-[4/3] animate-pulse bg-surface-2" />
            <div class="space-y-3 p-3 sm:space-y-4 sm:p-5 md:p-6">
              <div class="h-3 w-24 animate-pulse rounded-full bg-surface-2" />
              <div class="h-7 w-3/4 animate-pulse rounded-full bg-surface-2" />
              <div class="space-y-2">
                <div class="h-4 w-full animate-pulse rounded-full bg-surface-2" />
                <div class="h-4 w-5/6 animate-pulse rounded-full bg-surface-2" />
              </div>
              <div class="h-10 w-40 animate-pulse rounded-full bg-surface-2" />
              <div class="grid gap-2 sm:gap-3">
                <div class="h-11 animate-pulse rounded-md bg-surface-2" />
                <div class="h-11 animate-pulse rounded-md bg-surface-2" />
              </div>
            </div>
          </div>
        </section>

        <section
          v-else-if="hasHardLoadError"
          class="rounded-[24px] border border-error/30 bg-surface p-4 text-sm text-text-secondary shadow-[0_24px_60px_-38px_var(--shadow-color)] sm:p-6"
        >
          <p class="text-base font-semibold text-text-primary">
            სასურველების ჩატვირთვა ვერ მოხერხდა.
          </p>
          <p class="mt-2">
            {{
              wishlistStore.error ||
              "გთხოვ სცადო ხელახლა ან მოგვიანებით დაბრუნდე ამ გვერდზე."
            }}
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

        <section
          v-else-if="items.length"
          class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
        >
          <WishlistProductCard
            v-for="item in items"
            :key="item.product_id"
            :item="item"
            :add-pending="activeCartProductId === item.product_id"
            :remove-pending="wishlistStore.isMutatingProduct(item.product_id)"
            @add-to-cart="void handleAddToCart(item)"
            @remove="void handleRemove(item.product_id)"
          />
        </section>

        <section
          v-else
          class="rounded-[28px] border border-border-default bg-surface px-4 py-6 text-center shadow-[0_24px_60px_-38px_var(--shadow-color)] sm:px-6 sm:py-10 md:px-8 md:py-14"
        >
          <div
            class="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-border-default bg-surface-2 text-accent-primary"
          >
            <HeartIcon class="h-11 w-11" aria-hidden="true" />
          </div>

          <h2 class="title-under-xs mt-5 text-[28px] font-extrabold leading-tight text-text-primary sm:mt-8">
            სასურველები ცარიელია
          </h2>

          <p class="subtitle-under-xs mx-auto mt-3 max-w-xl text-sm leading-7 text-text-secondary sm:mt-4 md:text-base">
            ჯერ არაფერი შეგინახავს. კატალოგში დაბრუნდი და გულის აიკონზე დაჭერით
            სასურველი პროდუქტები შეინახე, რომ შემდეგ უფრო მარტივად მიუბრუნდე.
          </p>

          <div class="mt-5 flex justify-center sm:mt-8">
            <BaseButton
              as="nuxt-link"
              to="/catalog"
              variant="primary"
              class="px-6 py-3.5"
            >
              <template #left>
                <ArrowLeftIcon class="h-4 w-4" aria-hidden="true" />
              </template>
              კატალოგში დაბრუნება
            </BaseButton>
          </div>
        </section>

        <section
          class="rounded-[24px] border border-border-default bg-surface-2/80 p-3 sm:p-6 md:p-7"
        >
          <div class="flex items-start gap-3">
            <span
              class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-border-default bg-surface text-text-secondary"
            >
              <ExclamationTriangleIcon class="h-5 w-5" aria-hidden="true" />
            </span>

            <div class="min-w-0">
              <p class="text-base font-semibold text-text-primary">
                რას ნიშნავს სასურველები
              </p>
              <p class="mt-2 text-sm leading-7 text-text-secondary">
                სასურველებში შენახვა არ აკავებს მარაგს და არ აფიქსირებს ფასს.
                აქ ყოველთვის მიმდინარე მონაცემებია ნაჩვენები, ამიტომ გაყიდვამდე
                ან კალათაში დამატებამდე ფასი და ხელმისაწვდომობა შეიძლება
                შეიცვალოს.
              </p>
            </div>
          </div>
        </section>
    </div>
  </ProfileShell>
</template>
