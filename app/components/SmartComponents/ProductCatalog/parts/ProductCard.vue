<script setup lang="ts">
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
</script>

<template>
  <article
    class="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border-default bg-surface transition-all duration-200 will-change-transform hover:-translate-y-[10px] hover:border-accent-primary"
  >
    <div class="absolute right-3 top-3 z-[3]">
      <WishlistToggleButton
        :product-id="product.id"
        size="sm"
        label="სასურველებში შენახვა"
      />
    </div>

    <NuxtLink
      :to="productUrl"
      class="relative block aspect-[4/3] overflow-hidden bg-bg-secondary"
    >
      <div
        class="absolute inset-0 bg-[linear-gradient(135deg,#ff7b2c_0%,#ff9f4b_52%,#ffc968_100%)] opacity-70"
      />

      <BasePicture
        v-if="imageAsset.desktop || imageAsset.tablet || imageAsset.mobile"
        :data="imageAsset"
        :alt="product.name"
        preset="card"
        class="relative z-[1] h-full w-full transition-transform duration-300 group-hover:scale-[1.04]"
        lazy
      />

      <div
        v-else
        class="relative z-[1] flex h-full w-full items-center justify-center px-6 text-center text-xl font-semibold text-text-invert"
      >
        {{ product.name }}
      </div>

      <span
        v-if="product.isNew"
        class="absolute left-3 top-3 z-[2] rounded-md bg-accent-primary px-2 py-1 text-xs font-bold text-text-invert"
      >
        New
      </span>

      <span
        v-else-if="product.onSale || hasDiscount"
        class="absolute left-3 top-3 z-[2] rounded-md bg-error px-2 py-1 text-xs font-bold text-text-invert"
      >
        Sale
      </span>

      <div
        v-if="product.inStock === false"
        class="pointer-events-none absolute inset-x-0 bottom-0 z-[2]"
      >
        <div
          class="bg-[linear-gradient(180deg,rgba(15,23,42,0)_0%,rgba(15,23,42,0.22)_34%,rgba(15,23,42,0.9)_100%)] px-3 pb-3 pt-8"
        >
          <span
            class="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-sm"
          >
            <span
              class="h-1.5 w-1.5 rounded-full bg-warning"
              aria-hidden="true"
            />
            Out of stock
          </span>
        </div>
      </div>
    </NuxtLink>

    <div class="flex flex-1 flex-col p-2">
      <p
        v-if="product.category"
        class="text-xs uppercase tracking-wide text-text-muted"
      >
        {{ product.category }}
      </p>

      <h3
        class="card-title mt-1 text-lg font-semibold leading-7 text-text-primary"
      >
        <NuxtLink
          :to="productUrl"
          class="transition-colors duration-200 hover:text-accent-primary"
        >
          {{ product.name }}
        </NuxtLink>
      </h3>

      <p class="card-subtitle mt-1 text-sm leading-5 text-text-secondary">
        {{ product.subtitle || " " }}
      </p>

      <div class="mt-2 lg:mt-2 flex items-end gap-2">
        <span class="text-2xl font-bold text-accent-primary"
          >{{ product.price }} GEL</span
        >
        <span
          v-if="hasDiscount && typeof product.oldPrice === 'number'"
          class="text-sm text-text-muted line-through"
        >
          {{ product.oldPrice }} GEL
        </span>
      </div>

      <BaseButton
        as="nuxt-link"
        :to="productUrl"
        variant="primary"
        :full-width="true"
        class="mt-2 md:mt-4 upper"
      >
        დეტალების ნახვა
      </BaseButton>
    </div>
  </article>
</template>

<style scoped>
.card-title,
.card-subtitle {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
}

.card-title {
  -webkit-line-clamp: 2;
}

.card-subtitle {
  -webkit-line-clamp: 2;
}

@media (min-width: 560px) {
  .card-title {
    min-height: calc(1.75rem * 2);
  }

  .card-subtitle {
    min-height: calc(1.25rem * 2);
  }
}
</style>
