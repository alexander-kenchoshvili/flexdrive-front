<script setup lang="ts">
import type { CatalogProductCardData } from "~/types/catalog";
import ProductCard from "./ProductCard.vue";

withDefaults(
  defineProps<{
    products?: CatalogProductCardData[];
    emptyTitle?: string;
    emptyDescription?: string;
  }>(),
  {
    products: () => [],
    emptyTitle: "პროდუქტები არ მოიძებნა.",
    emptyDescription: "",
  },
);
</script>

<template>
  <div>
    <div
      v-if="!products?.length"
      class="rounded-xl border border-dashed border-border-default bg-surface p-8 text-center text-sm text-text-muted"
    >
      <p class="text-base font-semibold text-text-primary">{{ emptyTitle }}</p>
      <p v-if="emptyDescription" class="mx-auto mt-2 max-w-xl leading-6">
        {{ emptyDescription }}
      </p>
    </div>

    <div
      v-else
      class="grid grid-cols-1 gap-4 min-[560px]:grid-cols-2 xl:grid-cols-3"
    >
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
      />
    </div>
  </div>
</template>
