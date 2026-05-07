<script setup lang="ts">
import SkeletonBlock from "~/components/common/skeleton/SkeletonBlock.vue";
import SkeletonText from "~/components/common/skeleton/SkeletonText.vue";
import type { CatalogProductCardData } from "~/types/catalog";
import ProductCard from "./ProductCard.vue";

type VehicleFilterLabel = {
  make?: string;
  model?: string;
  year?: string;
  engine?: string;
};

const skeletonItems = Array.from({ length: 9 }, (_, index) => index);

withDefaults(
  defineProps<{
    products?: CatalogProductCardData[];
    vehicleFilter?: VehicleFilterLabel;
    loading?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
  }>(),
  {
    products: () => [],
    vehicleFilter: () => ({}),
    loading: false,
    emptyTitle: "პროდუქტები არ მოიძებნა.",
    emptyDescription: "",
  },
);
</script>

<template>
  <div class="relative">
    <div
      v-if="!loading && !products?.length"
      class="rounded-xl border border-dashed border-border-default bg-surface p-8 text-center text-sm text-text-muted"
    >
      <p class="text-base font-semibold text-text-primary">{{ emptyTitle }}</p>
      <p v-if="emptyDescription" class="mx-auto mt-2 max-w-xl leading-6">
        {{ emptyDescription }}
      </p>
    </div>

    <div
      v-else
      class="grid grid-cols-1 gap-4 transition-opacity duration-150 min-[560px]:grid-cols-2 xl:grid-cols-3"
      :class="loading ? 'opacity-30' : 'opacity-100'"
    >
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
        :vehicle-filter="vehicleFilter"
      />
    </div>

    <div
      v-if="loading && products?.length"
      class="absolute inset-0 z-[1] grid grid-cols-1 gap-4 min-[560px]:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
      aria-label="პროდუქტები იტვირთება"
    >
      <article
        v-for="item in skeletonItems"
        :key="item"
        class="flex h-full flex-col overflow-hidden rounded-lg border border-border-default bg-surface shadow-[0_18px_44px_-38px_var(--shadow-color)]"
      >
        <SkeletonBlock class="aspect-[16/11] w-full rounded-none" radius="md" />

        <div class="flex flex-1 flex-col p-3 sm:p-4">
          <div class="flex min-h-8 items-center justify-between gap-2">
            <SkeletonText size="sm" width="w-28" tone="muted" />
            <SkeletonBlock class="h-7 w-20" radius="md" tone="muted" />
          </div>

          <div class="mt-2 space-y-2">
            <SkeletonText size="md" width="w-4/5" />
            <SkeletonText size="md" width="w-3/5" />
          </div>

          <div class="mt-3 space-y-2">
            <SkeletonText size="sm" width="w-full" tone="muted" />
            <SkeletonText size="sm" width="w-5/6" tone="muted" />
          </div>

          <div class="mt-3 space-y-2">
            <SkeletonText size="sm" width="w-3/4" tone="muted" />
            <SkeletonBlock class="h-6 w-32" radius="md" tone="muted" />
          </div>

          <div class="mt-auto pt-3">
            <SkeletonText size="lg" width="w-36" />
            <SkeletonBlock class="mt-3 h-11 w-full" radius="lg" />
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
