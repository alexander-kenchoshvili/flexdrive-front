<script setup lang="ts">
import {
  ClockIcon,
  ShoppingCartIcon,
  TagIcon,
  TrashIcon,
} from "@heroicons/vue/24/outline";
import BaseButton from "~/components/common/BaseButton.vue";
import BasePicture from "~/components/common/BasePicture.vue";
import WishlistToggleButton from "~/components/commerce/WishlistToggleButton.vue";
import { useCatalogPlaceholderMedia } from "~/composables/catalog/useCatalogPlaceholderMedia";
import type { WishlistItem } from "~/types/commerce";

const props = withDefaults(
  defineProps<{
    item: WishlistItem;
    addPending?: boolean;
    removePending?: boolean;
  }>(),
  {
    addPending: false,
    removePending: false,
  },
);

const emit = defineEmits<{
  addToCart: [];
  remove: [];
}>();

const { cardPlaceholderImage } = useCatalogPlaceholderMedia();

const resolveImage = () => {
  const asset = props.item.primary_image;
  if (asset?.desktop || asset?.tablet || asset?.mobile) {
    return asset;
  }
  return cardPlaceholderImage;
};

const imageAsset = computed(resolveImage);
const productUrl = computed(() => `/catalog/${props.item.slug}`);

const formatMoney = (value: string | number | null | undefined) =>
  `${Number(value || 0).toFixed(2)} GEL`;

const hasDiscount = computed(() => {
  const oldPrice = Number(props.item.old_price || 0);
  const currentPrice = Number(props.item.price || 0);
  return oldPrice > currentPrice;
});

const savedAtLabel = computed(() => {
  if (!props.item.saved_at) return null;

  const parsedDate = new Date(props.item.saved_at);
  if (Number.isNaN(parsedDate.getTime())) return null;

  return new Intl.DateTimeFormat("ka-GE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
});

const availability = computed(() => {
  if (!props.item.in_stock) {
    return {
      label: "მარაგი ამოიწურა",
      className: "border-border-default bg-surface text-text-muted",
    };
  }

  if (props.item.stock_qty <= 3) {
    return {
      label: "მცირე მარაგი",
      className: "border-warning/25 bg-warning/10 text-warning",
    };
  }

  return {
    label: "მარაგშია",
    className: "border-success/25 bg-success/10 text-success",
  };
});
</script>

<template>
  <article
    :class="[
      'group flex h-full flex-col overflow-hidden rounded-[24px] border border-border-default bg-surface shadow-[0_24px_60px_-38px_var(--shadow-color)] transition-colors duration-200',
      item.in_stock ? 'hover:border-accent-primary/40' : '',
    ]"
  >
    <div class="relative overflow-hidden border-b border-border-default">
      <div class="absolute left-4 top-4 z-[2] flex flex-wrap gap-2">
        <span
          v-if="item.is_new"
          class="inline-flex rounded-full bg-accent-primary px-2.5 py-1 text-[11px] font-bold text-text-invert"
        >
          ახალი
        </span>

        <span
          v-else-if="item.on_sale || hasDiscount"
          class="inline-flex rounded-full bg-error px-2.5 py-1 text-[11px] font-bold text-text-invert"
        >
          ფასდაკლება
        </span>
      </div>

      <div class="absolute right-4 top-4 z-[2]">
        <WishlistToggleButton
          :product-id="item.product_id"
          size="sm"
          label="სასურველებიდან წაშლა"
        />
      </div>

      <NuxtLink
        :to="productUrl"
        class="relative block aspect-[4/3] overflow-hidden bg-[linear-gradient(135deg,rgba(255,123,44,0.16)_0%,rgba(255,159,75,0.08)_52%,rgba(255,201,104,0.16)_100%)]"
      >
        <BasePicture
          :data="imageAsset"
          :alt="item.name"
          preset="card"
          class="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]"
          lazy
        />

        <div
          v-if="!item.in_stock"
          class="absolute inset-0 flex items-center justify-center bg-surface/72 backdrop-blur-[2px]"
        >
          <span
            class="inline-flex rounded-full border border-border-default bg-surface px-4 py-2 text-xs font-semibold text-text-secondary"
          >
            მარაგი ამოიწურა
          </span>
        </div>
      </NuxtLink>
    </div>

    <div class="flex flex-1 flex-col p-5 md:p-6">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <p
            v-if="item.category?.name"
            class="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-primary"
          >
            {{ item.category.name }}
          </p>

          <NuxtLink
            :to="productUrl"
            class="wishlist-title mt-2 block text-[22px] font-extrabold leading-tight text-text-primary transition-colors duration-200 hover:text-accent-primary"
          >
            {{ item.name }}
          </NuxtLink>
        </div>
      </div>

      <p
        v-if="item.short_description"
        class="wishlist-description mt-3 text-sm leading-7 text-text-secondary"
      >
        {{ item.short_description }}
      </p>

      <div class="mt-4 flex flex-wrap items-center gap-3">
        <span
          class="text-[28px] font-extrabold leading-none text-accent-primary"
        >
          {{ formatMoney(item.price) }}
        </span>

        <span
          v-if="hasDiscount && item.old_price"
          class="text-sm text-text-muted line-through"
        >
          {{ formatMoney(item.old_price) }}
        </span>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-2.5">
        <span
          :class="[
            'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
            availability.className,
          ]"
        >
          {{ availability.label }}
        </span>

        <span
          v-if="savedAtLabel"
          class="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-surface-2 px-3 py-1 text-xs font-medium text-text-secondary"
        >
          <ClockIcon class="h-3.5 w-3.5" aria-hidden="true" />
          {{ savedAtLabel }}
        </span>

        <span
          v-if="item.on_sale || hasDiscount"
          class="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-surface-2 px-3 py-1 text-xs font-medium text-text-secondary"
        >
          <TagIcon class="h-3.5 w-3.5" aria-hidden="true" />
          მიმდინარე ფასი
        </span>
      </div>

      <div class="mt-auto flex flex-col gap-3 pt-6">
        <BaseButton
          type="button"
          variant="primary"
          :loading="addPending"
          :disabled="!item.in_stock || addPending || removePending"
          full-width
          @click="emit('addToCart')"
        >
          <template #left>
            <ShoppingCartIcon class="h-4 w-4" aria-hidden="true" />
          </template>
          {{ item.in_stock ? "კალათაში დამატება" : "მარაგში არ არის" }}
        </BaseButton>

        <BaseButton
          type="button"
          variant="secondary"
          :loading="removePending"
          :disabled="addPending || removePending"
          full-width
          @click="emit('remove')"
        >
          <template #left>
            <TrashIcon class="h-4 w-4" aria-hidden="true" />
          </template>
          წაშლა
        </BaseButton>
      </div>
    </div>
  </article>
</template>

<style scoped>
.wishlist-title,
.wishlist-description {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
}

.wishlist-title {
  -webkit-line-clamp: 2;
}

.wishlist-description {
  -webkit-line-clamp: 3;
}
</style>
