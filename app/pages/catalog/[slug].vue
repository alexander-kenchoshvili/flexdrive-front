<script setup lang="ts">
import {
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
} from "@heroicons/vue/24/outline";
import { storeToRefs } from "pinia";
import AppBreadcrumbs from "~/components/common/AppBreadcrumbs.vue";
import BaseButton from "~/components/common/BaseButton.vue";
import BasePicture from "~/components/common/BasePicture.vue";
import ProductDetailSkeleton from "~/components/catalog/ProductDetailSkeleton.vue";
import WishlistToggleButton from "~/components/commerce/WishlistToggleButton.vue";
import ProductCard from "~/components/SmartComponents/ProductCatalog/parts/ProductCard.vue";
import { useIndexingPolicy } from "~/composables/useIndexingPolicy";
import { useCatalogApi } from "~/composables/catalog/useCatalogApi";
import { normalizeApiErrorMessage } from "~/composables/commerce/errorUtils";
import { useCatalogPlaceholderMedia } from "~/composables/catalog/useCatalogPlaceholderMedia";
import { sanitizeText } from "~/composables/helpers";
import { useBuyNowStore } from "~/stores/useBuyNowStore";
import { buildCatalogCategoryPath } from "~/utils/routePaths";
import {
  buildBreadcrumbStructuredData,
  buildProductStructuredData,
} from "~/utils/structuredData";
import type { ComponentPublicInstance } from "vue";
import type {
  CatalogProductCardData,
  CatalogProductDetail,
  CatalogProductImage,
} from "~/types/catalog";

type BreadcrumbItem = {
  label: string;
  to?: string;
};

definePageMeta({
  skipCmsLoader: true,
  key: (route) => route.fullPath,
});

const route = useRoute();
const config = useRuntimeConfig();
const globalStore = useGlobalStore();
const siteSettingsStore = useSiteSettings();
const { settings } = storeToRefs(siteSettingsStore);
const cartStore = useCartStore();
const buyNowStore = useBuyNowStore();
const { getCatalogProduct } = useCatalogApi();
const { galleryPlaceholderImages, cardPlaceholderImage } =
  useCatalogPlaceholderMedia();

const product = ref<CatalogProductDetail | null>(null);
const pending = ref(true);
const loadError = ref<unknown>(null);
const addToCartPending = ref(false);
const buyNowPending = ref(false);
const cartFeedback = ref<string | null>(null);
const cartFeedbackTone = ref<"success" | "error" | null>(null);
const buyNowFeedback = ref<string | null>(null);
const buyNowFeedbackTone = ref<"warning" | "error" | null>(null);
const selectedQuantity = ref(1);
const activeTab = ref<"description" | "specs">("description");
const selectedImageIndex = ref(0);
const thumbnailStripRef = ref<HTMLDivElement | null>(null);
const thumbnailButtonRefs = ref<HTMLButtonElement[]>([]);

const slug = computed(() => String(route.params.slug || ""));

const normalizeUrl = (value: string) => value.replace(/\/+$/, "");
const toAbsoluteUrl = (siteUrl: string, pathOrUrl: string) => {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const normalizedSiteUrl = normalizeUrl(siteUrl);
  const normalizedPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${normalizedSiteUrl}${normalizedPath}`;
};

const resolveStatusCode = (error: unknown): number | null => {
  const normalized = error as
    | { statusCode?: number; status?: number; response?: { status?: number } }
    | null
    | undefined;

  return (
    normalized?.statusCode ??
    normalized?.status ??
    normalized?.response?.status ??
    null
  );
};

const loadProduct = async () => {
  pending.value = true;
  loadError.value = null;
  product.value = null;
  cartFeedback.value = null;
  cartFeedbackTone.value = null;
  buyNowFeedback.value = null;
  buyNowFeedbackTone.value = null;
  addToCartPending.value = false;
  buyNowPending.value = false;
  selectedQuantity.value = 1;

  globalStore.setCurrentMenu("catalog");

  const request = await getCatalogProduct(slug.value);

  if (request.error.value) {
    loadError.value = request.error.value;
    pending.value = false;
    return;
  }

  product.value = request.data.value ?? null;
  pending.value = false;
};

await loadProduct();

if (!product.value && resolveStatusCode(loadError.value) === 404) {
  throw createError({
    statusCode: 404,
    statusMessage: "პროდუქტი ვერ მოიძებნა",
  });
}

if (!product.value && !loadError.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "პროდუქტი ვერ მოიძებნა",
  });
}

const productTitle = computed(
  () => sanitizeText(product.value?.name) || "პროდუქტი",
);
const productCategory = computed(
  () => sanitizeText(product.value?.category?.name) || "კატალოგი",
);
const productLead = computed(() =>
  sanitizeText(product.value?.short_description),
);
const productDescription = computed(() =>
  sanitizeText(product.value?.description),
);
const productSku = computed(() => sanitizeText(product.value?.sku));

const priceValue = computed(() => Number(product.value?.price || 0));
const oldPriceValue = computed(() =>
  product.value?.old_price ? Number(product.value.old_price) : null,
);
const hasDiscount = computed(
  () =>
    typeof oldPriceValue.value === "number" &&
    oldPriceValue.value > priceValue.value,
);
const maxSelectableQuantity = computed(() =>
  Math.max(1, Number(product.value?.stock_qty || 1)),
);
const quantityAlreadyInCart = computed(() => {
  if (!product.value) return 0;

  const productId = product.value.id;

  return (
    cartStore.items.find((item) => item.product_id === productId)?.quantity || 0
  );
});
const remainingAddableQuantity = computed(() =>
  Math.max(0, maxSelectableQuantity.value - quantityAlreadyInCart.value),
);
const hasRemainingStockForCart = computed(
  () => Boolean(product.value?.in_stock) && remainingAddableQuantity.value > 0,
);
const hasStockForBuyNow = computed(() => Boolean(product.value?.in_stock));
const canAddSelectedQuantityToCart = computed(
  () =>
    hasRemainingStockForCart.value &&
    selectedQuantity.value <= remainingAddableQuantity.value,
);
const canDecreaseQuantity = computed(
  () => Boolean(product.value?.in_stock) && selectedQuantity.value > 1,
);
const canIncreaseQuantity = computed(
  () =>
    Boolean(product.value?.in_stock) &&
    selectedQuantity.value < maxSelectableQuantity.value,
);
const discountPercent = computed(() => {
  if (!hasDiscount.value || !oldPriceValue.value) return null;
  return Math.round(
    ((oldPriceValue.value - priceValue.value) / oldPriceValue.value) * 100,
  );
});
const showCartNextStep = computed(
  () => cartFeedbackTone.value === "success" && cartStore.itemCount > 0,
);
const formattedCartTotal = computed(() => {
  const amount = Number(cartStore.total || 0);
  return Number.isNaN(amount) ? "0.00" : amount.toFixed(2);
});

const galleryImages = computed<CatalogProductImage[]>(() => {
  const realImages = (product.value?.images || []).filter((image) =>
    Boolean(image.image?.desktop || image.image?.tablet || image.image?.mobile),
  );

  if (realImages.length) {
    return realImages;
  }

  return galleryPlaceholderImages.map((image, index) => ({
    ...image,
    alt_text: `${productTitle.value} ${index + 1}`,
  }));
});

const setThumbnailButtonRef = (
  element: Element | ComponentPublicInstance | null,
  index: number,
) => {
  if (!(element instanceof HTMLButtonElement)) {
    return;
  }

  thumbnailButtonRefs.value[index] = element;
};

const scrollThumbnailIntoView = async (
  index = selectedImageIndex.value,
  behavior: ScrollBehavior = "smooth",
) => {
  if (!import.meta.client) return;

  await nextTick();

  const strip = thumbnailStripRef.value;
  const target = thumbnailButtonRefs.value[index];

  if (!strip || !target) return;

  const targetLeft =
    target.offsetLeft - (strip.clientWidth - target.clientWidth) / 2;
  const maxLeft = Math.max(0, strip.scrollWidth - strip.clientWidth);
  const nextLeft = Math.min(Math.max(targetLeft, 0), maxLeft);

  strip.scrollTo({
    left: nextLeft,
    behavior,
  });
};

const handleThumbnailSelect = (index: number) => {
  selectedImageIndex.value = index;
};

watch(
  galleryImages,
  () => {
    thumbnailButtonRefs.value = [];
    selectedImageIndex.value = 0;
  },
  { immediate: true },
);

watch(
  maxSelectableQuantity,
  (nextMaxQuantity) => {
    if (nextMaxQuantity <= 0) {
      selectedQuantity.value = 1;
      return;
    }

    if (selectedQuantity.value > nextMaxQuantity) {
      selectedQuantity.value = nextMaxQuantity;
    }
  },
  { immediate: true },
);

const activeImage = computed(
  () => galleryImages.value[selectedImageIndex.value] || null,
);

watch(
  selectedImageIndex,
  (nextIndex, previousIndex) => {
    void scrollThumbnailIntoView(
      nextIndex,
      previousIndex == null ? "auto" : "smooth",
    );
  },
  { flush: "post" },
);

const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = [
    { label: "მთავარი", to: "/" },
    { label: "კატალოგი", to: "/catalog" },
  ];

  if (product.value?.category?.id) {
    items.push({
      label: productCategory.value,
      to: buildCatalogCategoryPath(product.value.category.slug),
    });
  }

  items.push({ label: productTitle.value });
  return items;
});

const relatedProducts = computed<CatalogProductCardData[]>(() =>
  (product.value?.related_products || []).map((item) => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    subtitle: item.short_description,
    category: item.category?.name,
    price: Number(item.price),
    oldPrice: item.old_price ? Number(item.old_price) : null,
    image: item.primary_image,
    isNew: item.is_new,
    inStock: item.in_stock,
    onSale: item.on_sale,
  })),
);

const primarySeoImage = computed(
  () =>
    product.value?.seo?.image ||
    activeImage.value?.image?.desktop ||
    activeImage.value?.image?.tablet ||
    activeImage.value?.image?.mobile ||
    settings.value?.default_seo_image ||
    String(config.public.defaultSeoImage || "") ||
    cardPlaceholderImage.desktop ||
    undefined,
);
const productSeoTitle = computed(
  () => sanitizeText(product.value?.seo?.title) || productTitle.value,
);
const productSeoDescription = computed(
  () =>
    sanitizeText(product.value?.seo?.description) ||
    productLead.value ||
    productDescription.value ||
    undefined,
);
const siteUrl = computed(() =>
  normalizeUrl(String(config.public.siteUrl || "https://localhost:3000")),
);
const productCanonicalPath = computed(
  () => product.value?.seo?.canonical || `/catalog/${slug.value}`,
);
const productCanonicalUrl = computed(() =>
  toAbsoluteUrl(siteUrl.value, productCanonicalPath.value),
);
const productSeoImage = computed(() => {
  const image = primarySeoImage.value;
  if (!image) return undefined;
  return toAbsoluteUrl(siteUrl.value, image);
});
const { robots: productRobots } = useIndexingPolicy({
  pageNoindex: computed(() => Boolean(product.value?.seo?.noindex)),
});
const siteName = computed(
  () => settings.value?.site_name || String(config.public.siteName || "FlexDrive"),
);
const breadcrumbSchema = computed(() =>
  buildBreadcrumbStructuredData({
    items: breadcrumbItems.value,
    siteUrl: siteUrl.value,
    currentPath: productCanonicalPath.value,
  }),
);
const productSchema = computed(() => {
  if (!product.value) {
    return null;
  }

  return buildProductStructuredData({
    siteUrl: siteUrl.value,
    url: productCanonicalPath.value,
    name: productSeoTitle.value,
    description: productSeoDescription.value,
    image: productSeoImage.value,
    sku: productSku.value || undefined,
    price: priceValue.value,
    currency: "GEL",
    inStock: Boolean(product.value.in_stock),
    brandName: siteName.value,
    category: productCategory.value,
  });
});

useHead(() => ({
  link: [{ rel: "canonical", href: productCanonicalUrl.value }],
  script: [
    ...(breadcrumbSchema.value
      ? [
          {
            key: "product-breadcrumb-schema",
            type: "application/ld+json",
            children: JSON.stringify(breadcrumbSchema.value),
          },
        ]
      : []),
    ...(productSchema.value
      ? [
          {
            key: "product-schema",
            type: "application/ld+json",
            children: JSON.stringify(productSchema.value),
          },
        ]
      : []),
  ],
}));

useSeoMeta({
  title: () => productSeoTitle.value,
  description: () => productSeoDescription.value,
  robots: () => productRobots.value,
  ogUrl: () => productCanonicalUrl.value,
  ogTitle: () => productSeoTitle.value,
  ogDescription: () => productSeoDescription.value,
  ogImage: () => productSeoImage.value,
  twitterTitle: () => productSeoTitle.value,
  twitterDescription: () => productSeoDescription.value,
  twitterImage: () => productSeoImage.value,
});

const retryLoad = async () => {
  await loadProduct();
};

const setSelectedQuantity = (nextQuantity: number) => {
  const maxQuantityForSelection =
    maxSelectableQuantity.value > 0 ? maxSelectableQuantity.value : 1;

  selectedQuantity.value = Math.min(
    maxQuantityForSelection,
    Math.max(1, Math.floor(nextQuantity) || 1),
  );
  cartFeedback.value = null;
  cartFeedbackTone.value = null;
  buyNowFeedback.value = null;
  buyNowFeedbackTone.value = null;
};

const incrementQuantity = () => {
  if (!canIncreaseQuantity.value) return;
  setSelectedQuantity(selectedQuantity.value + 1);
};

const decrementQuantity = () => {
  if (!canDecreaseQuantity.value) return;
  setSelectedQuantity(selectedQuantity.value - 1);
};

const handleAddToCart = async () => {
  if (!product.value || !product.value.in_stock) return;

  if (remainingAddableQuantity.value <= 0) {
    cartFeedback.value =
      "ამ პროდუქტის მაქსიმალური რაოდენობა უკვე გაქვს კალათაში.";
    cartFeedbackTone.value = "error";
    return;
  }

  if (selectedQuantity.value > remainingAddableQuantity.value) {
    cartFeedback.value = `კალათაში დამატებით შეგიძლია მაქსიმუმ ${remainingAddableQuantity.value} ცალი.`;
    cartFeedbackTone.value = "error";
    return;
  }

  addToCartPending.value = true;
  cartFeedback.value = null;
  cartFeedbackTone.value = null;

  try {
    await cartStore.addItem(product.value.id, selectedQuantity.value);
    cartFeedback.value = `${selectedQuantity.value} ცალი წარმატებით დაემატა კალათაში.`;
    cartFeedbackTone.value = "success";
  } catch {
    await Promise.allSettled([cartStore.refreshCart(), loadProduct()]);
    cartFeedback.value =
      cartStore.error || "პროდუქტის კალათაში დამატება ვერ მოხერხდა.";
    cartFeedbackTone.value = "error";
  } finally {
    addToCartPending.value = false;
  }
};

const handleBuyNow = async () => {
  if (!product.value || !hasStockForBuyNow.value) return;

  buyNowPending.value = true;
  buyNowFeedback.value = null;
  buyNowFeedbackTone.value = null;

  try {
    await buyNowStore.start(product.value.id, selectedQuantity.value, {
      returnToProduct: route.fullPath,
    });
    await navigateTo(
      `/buy-now/checkout?return_to=${encodeURIComponent(route.fullPath)}`,
    );
  } catch (error) {
    buyNowFeedback.value = normalizeApiErrorMessage(
      error,
      "სწრაფი ყიდვის დაწყება ვერ მოხერხდა. გთხოვ, სცადო ხელახლა.",
    );
    buyNowFeedbackTone.value = "error";
  } finally {
    buyNowPending.value = false;
  }
};
</script>

<template>
  <section class="py-8 pb-28 md:py-10 md:pb-32 lg:pb-12">
    <div class="container-fluid">
      <ProductDetailSkeleton v-if="pending" />

      <div
        v-else-if="loadError || !product"
        class="rounded-[24px] border border-error/30 bg-surface p-6 text-sm text-text-secondary shadow-[0_24px_60px_-38px_var(--shadow-color)]"
      >
        <p class="text-base font-semibold text-text-primary">
          პროდუქტის ჩატვირთვა ვერ მოხერხდა.
        </p>
        <p class="mt-2">სცადე თავიდან ან დაბრუნდი კატალოგში.</p>
        <div class="mt-4 flex flex-col gap-3 sm:flex-row">
          <BaseButton type="button" variant="primary" @click="retryLoad">
            თავიდან ცდა
          </BaseButton>
          <BaseButton as="nuxt-link" to="/catalog" variant="secondary">
            კატალოგში დაბრუნება
          </BaseButton>
        </div>
      </div>

      <div v-else class="space-y-10">
        <AppBreadcrumbs :items="breadcrumbItems" />

        <div class="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <div class="min-w-0 lg:sticky lg:top-36 lg:self-start">
            <div
              class="min-w-0 overflow-hidden rounded-[24px] border border-border-default bg-surface shadow-[0_24px_60px_-38px_var(--shadow-color)]"
            >
              <div
                class="relative aspect-square overflow-hidden bg-[linear-gradient(135deg,#ff7b2c_0%,#ff9f4b_52%,#ffc968_100%)]"
              >
                <BasePicture
                  v-if="activeImage"
                  :data="activeImage.image"
                  :alt="activeImage.alt_text || productTitle"
                  preset="detail"
                  class="h-full w-full"
                />

                <div
                  v-else
                  class="flex h-full w-full items-center justify-center px-8 text-center text-2xl font-bold text-text-invert"
                >
                  {{ productTitle }}
                </div>

                <span
                  v-if="product.is_new"
                  class="absolute left-4 top-4 rounded-md bg-accent-primary px-3 py-1 text-xs font-bold text-text-invert"
                >
                  New
                </span>

                <span
                  v-else-if="hasDiscount"
                  class="absolute left-4 top-4 rounded-md bg-error px-3 py-1 text-xs font-bold text-text-invert"
                >
                  Sale
                </span>
              </div>

              <div
                v-if="galleryImages.length > 1"
                ref="thumbnailStripRef"
                class="product-gallery-thumbnail-strip flex w-full min-w-0 gap-3 overflow-x-auto overflow-y-hidden border-t border-border-default p-4 scroll-smooth snap-x snap-mandatory"
              >
                <button
                  v-for="(image, index) in galleryImages"
                  :key="image.id || `${image.alt_text}-${index}`"
                  type="button"
                  :ref="(element) => setThumbnailButtonRef(element, index)"
                  :class="[
                    'w-[72px] shrink-0 snap-start overflow-hidden rounded-[16px] border bg-surface-2 transition-colors duration-200 sm:w-20',
                    index === selectedImageIndex
                      ? 'border-accent-primary'
                      : 'border-border-default hover:border-accent-primary/50',
                  ]"
                  @click="handleThumbnailSelect(index)"
                >
                  <div class="aspect-square">
                    <BasePicture
                      :data="image.image"
                      :alt="image.alt_text || `${productTitle} ${index + 1}`"
                      preset="thumb"
                      class="h-full w-full"
                      fit="contain"
                      lazy
                    />
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <div
              class="rounded-[24px] border border-border-default bg-surface p-6 shadow-[0_24px_60px_-38px_var(--shadow-color)] md:p-7"
            >
              <p
                class="text-xs font-semibold uppercase tracking-[0.12em] text-accent-primary"
              >
                {{ productCategory }}
              </p>

              <h1
                class="title-under-xs mt-3 text-[30px] font-extrabold leading-tight text-text-primary md:text-[38px]"
              >
                {{ productTitle }}
              </h1>

              <p
                v-if="productLead"
                class="subtitle-under-xs mt-4 text-sm leading-7 text-text-secondary md:text-base"
              >
                {{ productLead }}
              </p>

              <div class="mt-5 flex flex-wrap items-center gap-3">
                <span
                  :class="[
                    'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                    product.in_stock
                      ? 'border-success/30 bg-success/10 text-success'
                      : 'border-warning/30 bg-warning/10 text-warning',
                  ]"
                >
                  {{ product.in_stock ? "მარაგშია" : "მარაგში არ არის" }}
                </span>

                <span
                  v-if="productSku"
                  class="inline-flex rounded-full border border-border-default bg-surface-2 px-3 py-1 text-xs font-medium text-text-secondary"
                >
                  SKU: {{ productSku }}
                </span>

                <WishlistToggleButton
                  :product-id="product.id"
                  label="სასურველებში შენახვა"
                />
              </div>

              <div
                class="mt-6 rounded-[20px] border border-border-default bg-surface-2 p-5"
              >
                <div class="flex flex-wrap items-end gap-3">
                  <span
                    class="text-[34px] font-extrabold leading-none text-accent-primary"
                  >
                    {{ priceValue.toFixed(2) }} GEL
                  </span>

                  <span
                    v-if="hasDiscount && typeof oldPriceValue === 'number'"
                    class="text-base text-text-muted line-through"
                  >
                    {{ oldPriceValue.toFixed(2) }} GEL
                  </span>

                  <span
                    v-if="discountPercent"
                    class="inline-flex rounded-md bg-success/10 px-2.5 py-1 text-xs font-bold text-success"
                  >
                    -{{ discountPercent }}%
                  </span>
                </div>

                <p class="mt-3 text-sm text-text-secondary">
                  დაამატე პროდუქტი კალათაში ან დაგვიკავშირდი, თუ დამატებითი
                  კონსულტაცია გჭირდება.
                </p>
              </div>

              <div
                v-if="showCartNextStep"
                class="mt-6 rounded-[18px] border border-accent-primary/20 bg-accent-primary/5 p-4"
              >
                <div class="flex items-start gap-3">
                  <span
                    class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-accent-primary/25 bg-accent-primary/10 text-accent-primary"
                  >
                    <ShoppingCartIcon class="h-5 w-5" aria-hidden="true" />
                  </span>

                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-bold text-text-primary">
                      შემდეგი ნაბიჯი მზად არის
                    </p>
                    <p class="mt-1 text-sm leading-6 text-text-secondary">
                      კალათაშია {{ cartStore.itemCount }} ცალი • ჯამი
                      {{ formattedCartTotal }} GEL
                    </p>

                    <div class="mt-3">
                      <BaseButton
                        as="nuxt-link"
                        to="/cart"
                        variant="primary"
                        class="px-5 py-3 text-sm upper"
                        full-width
                      >
                        ყიდვის გაგრძელება
                      </BaseButton>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-6 flex flex-col gap-2">
                <p
                  class="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted"
                >
                  რაოდენობა
                </p>

                <div
                  class="inline-flex w-fit items-center rounded-full border border-border-default bg-surface-2 p-1"
                >
                  <button
                    type="button"
                    :disabled="!canDecreaseQuantity"
                    class="inline-flex h-11 w-11 items-center justify-center rounded-full text-text-primary transition-colors duration-200 hover:bg-surface hover:text-accent-primary disabled:cursor-not-allowed disabled:opacity-40"
                    @click="decrementQuantity"
                  >
                    <MinusIcon class="h-5 w-5" aria-hidden="true" />
                  </button>

                  <span
                    class="inline-flex min-w-[52px] items-center justify-center px-3 text-lg font-bold text-text-primary"
                  >
                    {{ selectedQuantity }}
                  </span>

                  <button
                    type="button"
                    :disabled="!canIncreaseQuantity"
                    class="inline-flex h-11 w-11 items-center justify-center rounded-full text-text-primary transition-colors duration-200 hover:bg-surface hover:text-accent-primary disabled:cursor-not-allowed disabled:opacity-40"
                    @click="incrementQuantity"
                  >
                    <PlusIcon class="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                <p
                  v-if="remainingAddableQuantity < 1"
                  class="text-sm text-warning"
                >
                  ამ პროდუქტის მთელი ხელმისაწვდომი რაოდენობა უკვე გაქვს კალათაში.
                </p>

                <p
                  v-else-if="quantityAlreadyInCart > 0"
                  class="text-sm text-text-secondary"
                >
                  კალათაში უკვე გაქვს {{ quantityAlreadyInCart }} ცალი. დამატებით
                  შეგიძლია მაქსიმუმ {{ remainingAddableQuantity }} ცალი.
                </p>

                <p class="text-sm text-text-secondary">
                  სწრაფი ყიდვა იყენებს მიმდინარე მარაგს და შეგიძლია შეიძინო
                  მაქსიმუმ {{ maxSelectableQuantity }} ცალი.
                </p>
              </div>

              <div class="mt-6 space-y-3">
                <BaseButton
                  type="button"
                  variant="primary"
                  class="px-6 py-3.5 text-sm upper"
                  :loading="buyNowPending"
                  :disabled="!hasStockForBuyNow"
                  full-width
                  @click="handleBuyNow"
                >
                  {{ product.in_stock ? "ახლავე ყიდვა" : "მარაგში არ არის" }}
                </BaseButton>

                <BaseButton
                  type="button"
                  variant="secondary"
                  class="px-6 py-3.5 text-sm upper"
                  :loading="addToCartPending"
                  :disabled="!canAddSelectedQuantityToCart"
                  full-width
                  @click="handleAddToCart"
                >
                  {{ product.in_stock ? "კალათაში დამატება" : "მარაგში არ არის" }}
                </BaseButton>
              </div>

              <p
                v-if="buyNowFeedback"
                :class="[
                  'mt-4 rounded-[16px] border px-4 py-3 text-sm',
                  buyNowFeedbackTone === 'warning'
                    ? 'border-warning/25 bg-warning/10 text-text-secondary'
                    : 'border-error/25 bg-error/10 text-error',
                ]"
              >
                {{ buyNowFeedback }}
              </p>

              <p
                v-if="cartFeedback"
                :class="[
                  'rounded-[16px] border px-4 py-3 text-sm',
                  cartFeedbackTone === 'success'
                    ? 'border-success/25 bg-success/10 text-success'
                    : 'border-error/25 bg-error/10 text-error',
                ]"
              >
                {{ cartFeedback }}
              </p>

              <div
                v-if="false && showCartNextStep"
                class="mt-4 rounded-[18px] border border-accent-primary/20 bg-accent-primary/5 p-4"
              >
                <div class="flex items-start gap-3">
                  <span
                    class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-accent-primary/25 bg-accent-primary/10 text-accent-primary"
                  >
                    <ShoppingCartIcon class="h-5 w-5" aria-hidden="true" />
                  </span>

                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-bold text-text-primary">
                      შემდეგი ნაბიჯი მზად არის
                    </p>
                    <p class="mt-1 text-sm leading-6 text-text-secondary">
                      კალათაშია {{ cartStore.itemCount }} ცალი • ჯამი
                      {{ formattedCartTotal }} GEL
                    </p>

                    <div class="mt-3">
                      <BaseButton
                        as="nuxt-link"
                        to="/cart"
                        variant="primary"
                        class="px-5 py-3 text-sm upper"
                        full-width
                      >
                        ყიდვის გაგრძელება
                      </BaseButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              class="grid gap-3 rounded-[24px] border border-border-default bg-surface p-4 shadow-[0_24px_60px_-38px_var(--shadow-color)] sm:grid-cols-2"
            >
              <NuxtLink
                to="/delivery"
                class="rounded-[18px] border border-border-default bg-surface-2 px-4 py-4 transition-colors duration-200 hover:border-accent-primary hover:bg-surface"
              >
                <p class="text-sm font-bold text-text-primary">მიწოდება</p>
                <p class="mt-1 text-xs leading-6 text-text-secondary">
                  წესები და ვადები
                </p>
              </NuxtLink>

              <NuxtLink
                to="/returns"
                class="rounded-[18px] border border-border-default bg-surface-2 px-4 py-4 transition-colors duration-200 hover:border-accent-primary hover:bg-surface"
              >
                <p class="text-sm font-bold text-text-primary">დაბრუნება</p>
                <p class="mt-1 text-xs leading-6 text-text-secondary">
                  პირობები და პროცესი
                </p>
              </NuxtLink>
            </div>

            <div
              class="rounded-[24px] border border-border-default bg-surface p-6 shadow-[0_24px_60px_-38px_var(--shadow-color)] md:p-7"
            >
              <div
                class="flex flex-wrap gap-2 border-b border-border-default pb-4"
              >
                <button
                  type="button"
                  :class="[
                    'rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200',
                    activeTab === 'description'
                      ? 'border-accent-primary bg-accent-primary text-text-invert'
                      : 'border-border-default bg-surface text-text-secondary hover:border-accent-primary hover:text-accent-primary',
                  ]"
                  @click="activeTab = 'description'"
                >
                  აღწერა
                </button>

                <button
                  type="button"
                  :class="[
                    'rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200',
                    activeTab === 'specs'
                      ? 'border-accent-primary bg-accent-primary text-text-invert'
                      : 'border-border-default bg-surface text-text-secondary hover:border-accent-primary hover:text-accent-primary',
                  ]"
                  @click="activeTab = 'specs'"
                >
                  მახასიათებლები
                </button>
              </div>

              <div v-if="activeTab === 'description'" class="pt-5">
                <p
                  v-if="productDescription"
                  class="whitespace-pre-line text-sm leading-7 text-text-secondary md:text-base"
                >
                  {{ productDescription }}
                </p>

                <p v-else class="text-sm leading-7 text-text-secondary">
                  აღწერა მალე დაემატება.
                </p>
              </div>

              <div v-else class="pt-5">
                <div
                  v-if="product.specs.length"
                  class="overflow-hidden rounded-[18px] border border-border-default"
                >
                  <div
                    v-for="spec in product.specs"
                    :key="`${spec.key}-${spec.sort_order}`"
                    class="grid grid-cols-[minmax(0,180px)_minmax(0,1fr)] gap-4 border-b border-border-default px-4 py-3 last:border-b-0"
                  >
                    <span class="text-sm font-medium text-text-muted">
                      {{ spec.key }}
                    </span>
                    <span class="text-sm font-semibold text-text-primary">
                      {{ spec.value }}
                    </span>
                  </div>
                </div>

                <p v-else class="text-sm leading-7 text-text-secondary">
                  მახასიათებლები მალე დაემატება.
                </p>
              </div>
            </div>
          </div>
        </div>

        <section
          v-if="relatedProducts.length"
          class="border-t border-border-default pt-10"
        >
          <div class="mb-6 flex flex-col gap-2">
            <h2
              class="title-under-xs text-[28px] font-extrabold text-text-primary md:text-[32px]"
            >
              მსგავსი პროდუქტები
            </h2>
            <p class="subtitle-under-xs text-sm text-text-secondary">
              იმავე კატეგორიიდან შერჩეული პროდუქტები.
            </p>
          </div>

          <div
            class="grid grid-cols-1 gap-4 min-[560px]:grid-cols-2 xl:grid-cols-4"
          >
            <ProductCard
              v-for="relatedProduct in relatedProducts"
              :key="relatedProduct.id"
              :product="relatedProduct"
            />
          </div>
        </section>
      </div>
    </div>

    <div
      v-if="product && !pending"
      class="fixed inset-x-0 bottom-0 z-30 border-t border-[#17345f] bg-[#020c1d] px-3 py-3 shadow-[0_-10px_34px_rgba(2,6,23,0.28)] md:px-6 lg:hidden"
    >
      <div
        class="mx-auto flex max-w-[1440px] flex-col gap-3 rounded-[20px] border border-[#17345f] bg-[#081a38] px-4 py-3"
      >
        <div class="min-w-0">
          <p
            class="text-xs font-medium uppercase tracking-[0.12em] text-text-muted"
          >
            {{ productTitle }}
          </p>
          <div class="mt-1 flex items-end gap-2">
            <span
              class="text-2xl font-extrabold leading-none text-accent-primary"
            >
              {{ priceValue.toFixed(2) }} GEL
            </span>
            <span
              v-if="hasDiscount && typeof oldPriceValue === 'number'"
              class="text-xs text-text-muted line-through"
            >
              {{ oldPriceValue.toFixed(2) }} GEL
            </span>
          </div>
          <p class="mt-1 text-xs font-medium text-text-secondary">
            რაოდენობა: {{ selectedQuantity }} ც.
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <BaseButton
            type="button"
            variant="primary"
            class="w-full px-5 py-3 text-sm upper"
            :loading="buyNowPending"
            :disabled="!hasStockForBuyNow"
            @click="handleBuyNow"
          >
            {{ product.in_stock ? "ახლავე ყიდვა" : "მარაგში არ არის" }}
          </BaseButton>

          <BaseButton
            type="button"
            variant="secondary"
            class="w-full px-5 py-3 text-sm upper"
            :loading="addToCartPending"
            :disabled="!canAddSelectedQuantityToCart"
            @click="handleAddToCart"
          >
            {{ product.in_stock ? "კალათაში დამატება" : "მარაგში არ არის" }}
          </BaseButton>
        </div>

        <p
          v-if="buyNowFeedback"
          :class="[
            'rounded-[16px] border px-4 py-3 text-sm',
            buyNowFeedbackTone === 'warning'
              ? 'border-warning/25 bg-warning/10 text-text-secondary'
              : 'border-error/25 bg-error/10 text-error',
          ]"
        >
          {{ buyNowFeedback }}
        </p>

        <p
          v-if="cartFeedback"
          :class="[
            'rounded-[16px] border px-4 py-3 text-sm',
            cartFeedbackTone === 'success'
              ? 'border-success/25 bg-success/10 text-success'
              : 'border-error/25 bg-error/10 text-error',
          ]"
        >
          {{ cartFeedback }}
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.product-gallery-thumbnail-strip {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.product-gallery-thumbnail-strip::-webkit-scrollbar {
  display: none;
}
</style>

