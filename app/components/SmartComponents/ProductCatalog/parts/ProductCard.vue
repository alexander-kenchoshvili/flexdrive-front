<script setup lang="ts">
import {
  ArrowRightIcon,
  CheckCircleIcon,
  TagIcon,
  XCircleIcon,
} from "@heroicons/vue/20/solid";
import BaseButton from "~/components/common/BaseButton.vue";
import BasePicture from "~/components/common/BasePicture.vue";
import WishlistToggleButton from "~/components/commerce/WishlistToggleButton.vue";
import { useCatalogPlaceholderMedia } from "~/composables/catalog/useCatalogPlaceholderMedia";
import type { CatalogProductCardData } from "~/types/catalog";

const props = defineProps<{
  product: CatalogProductCardData;
}>();

const hasDiscount = computed(
  () =>
    typeof props.product.oldPrice === "number" &&
    props.product.oldPrice > props.product.price,
);

const { cardPlaceholderImage } = useCatalogPlaceholderMedia();
const productUrl = computed(() => `/catalog/${props.product.slug}`);
const imageAsset = computed(() => {
  const asset = props.product.image;

  if (asset?.desktop || asset?.tablet || asset?.mobile) {
    return asset;
  }

  return cardPlaceholderImage;
});

const badge = computed(() => {
  if (props.product.isNew) {
    return {
      label: "ახალი",
      class: "border-accent-primary bg-accent-primary text-text-invert",
      icon: TagIcon,
    };
  }

  if (props.product.onSale || hasDiscount.value) {
    return {
      label: "ფასდაკლება",
      class: "border-error bg-error text-text-invert",
      icon: TagIcon,
    };
  }

  return null;
});

const availability = computed(() => {
  if (props.product.inStock === false) {
    return {
      label: "არ არის მარაგში",
      class: "border-error/35 bg-surface text-error",
      icon: XCircleIcon,
    };
  }

  return {
    label: "მარაგშია",
    class: "border-success/35 bg-surface text-success",
    icon: CheckCircleIcon,
  };
});
</script>

<template>
  <article
    class="group relative flex h-full flex-col overflow-hidden rounded-lg border border-border-default bg-surface shadow-[0_18px_44px_-38px_var(--shadow-color)] transition-[border-color,box-shadow,background-color] duration-200 hover:border-accent-primary/70 hover:shadow-[0_22px_54px_-36px_var(--shadow-color)] focus-within:border-accent-primary/70"
  >
    <div class="absolute right-2.5 top-2.5 z-[3]">
      <WishlistToggleButton
        :product-id="product.id"
        size="sm"
        label="სასურველებში შენახვა"
      />
    </div>

    <NuxtLink
      :to="productUrl"
      class="relative block aspect-[16/11] overflow-hidden border-b border-border-default bg-surface-2 focus-visible:outline-none"
    >
      <div class="absolute inset-0 bg-bg-muted/35" aria-hidden="true" />

      <div class="relative z-[1] h-full w-full">
        <BasePicture
          v-if="imageAsset.desktop || imageAsset.tablet || imageAsset.mobile"
          :data="imageAsset"
          :alt="product.name"
          preset="card"
          fit="cover"
          class="h-full w-full transition-transform duration-200 group-hover:scale-[1.025]"
          lazy
        />

        <div
          v-else
          class="flex h-full w-full items-center justify-center rounded-md border border-dashed border-border-muted bg-surface px-4 text-center text-sm font-bold leading-5 text-text-secondary"
        >
          {{ product.name }}
        </div>
      </div>

      <span
        v-if="badge"
        :class="[
          'absolute left-2.5 top-2.5 z-[2] inline-flex min-h-7 items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-bold leading-[14px]',
          badge.class,
        ]"
      >
        <component :is="badge.icon" class="h-3.5 w-3.5" aria-hidden="true" />
        {{ badge.label }}
      </span>

      <span
        v-if="product.inStock === false"
        class="absolute bottom-2.5 left-2.5 z-[2] inline-flex min-h-7 items-center gap-1.5 rounded-md border border-error bg-surface px-2 py-1 text-[11px] font-bold leading-[14px] text-error shadow-[0_10px_24px_-20px_var(--shadow-color)]"
      >
        <XCircleIcon class="h-3.5 w-3.5" aria-hidden="true" />
        არ არის მარაგში
      </span>
    </NuxtLink>

    <div class="flex flex-1 flex-col p-3 sm:p-4">
      <div class="flex min-h-8 items-center justify-between gap-2">
        <p
          class="min-w-0 truncate text-[12px] font-semibold leading-[18px] text-text-muted"
        >
          {{ product.category || "ავტონაწილი" }}
        </p>

        <span
          :class="[
            'inline-flex min-h-7 shrink-0 items-center gap-1 rounded-md border px-1.5 py-1 text-[11px] font-bold leading-[14px]',
            availability.class,
          ]"
        >
          <component
            :is="availability.icon"
            class="h-3.5 w-3.5"
            aria-hidden="true"
          />
          {{ availability.label }}
        </span>
      </div>

      <h3
        class="product-card-title mt-1.5 min-h-[42px] text-[15px] font-bold leading-[21px] text-text-primary sm:text-[16px] sm:leading-[22px]"
      >
        <NuxtLink
          :to="productUrl"
          class="transition-colors duration-200 hover:text-accent-primary"
        >
          {{ product.name }}
        </NuxtLink>
      </h3>

      <p
        class="product-card-subtitle mt-1 min-h-[36px] text-[12px] font-medium leading-[18px] text-text-secondary sm:text-[13px] sm:leading-5"
      >
        {{ product.subtitle || " " }}
      </p>

      <div class="mt-3 flex items-end justify-between gap-2">
        <span
          class="min-w-0 text-[20px] font-extrabold leading-none text-accent-primary sm:text-[22px]"
        >
          {{ product.price }} GEL
        </span>
        <span
          v-if="hasDiscount && typeof product.oldPrice === 'number'"
          class="shrink-0 text-[12px] font-semibold leading-4 text-text-muted line-through sm:text-[13px]"
        >
          {{ product.oldPrice }} GEL
        </span>
      </div>

      <BaseButton
        as="nuxt-link"
        :to="productUrl"
        variant="primary"
        size="sm"
        :full-width="true"
        class="upper mt-3 !rounded-lg text-[13px] leading-5"
      >
        დეტალების ნახვა
        <template #right>
          <ArrowRightIcon class="h-4 w-4" aria-hidden="true" />
        </template>
      </BaseButton>
    </div>
  </article>
</template>

<style scoped>
.product-card-title,
.product-card-subtitle {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
}

.product-card-title {
  -webkit-line-clamp: 2;
}

.product-card-subtitle {
  -webkit-line-clamp: 2;
}
</style>
