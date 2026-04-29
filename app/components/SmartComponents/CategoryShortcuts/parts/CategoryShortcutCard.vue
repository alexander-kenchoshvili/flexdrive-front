<script setup lang="ts">
import BasePicture from "~/components/common/BasePicture.vue";
import { useCatalogPlaceholderMedia } from "~/composables/catalog/useCatalogPlaceholderMedia";
import type { CatalogCategoryItem } from "~/types/catalog";
import { buildCatalogCategoryPath } from "~/utils/routePaths";

const props = defineProps<{
  category: CatalogCategoryItem;
}>();

const { cardPlaceholderImage } = useCatalogPlaceholderMedia();

const categoryPath = computed(() => buildCatalogCategoryPath(props.category.slug));
const imageAsset = computed(() => {
  const asset = props.category.image;

  if (asset?.desktop || asset?.tablet || asset?.mobile) {
    return asset;
  }

  return cardPlaceholderImage;
});
const imageAlt = computed(
  () => props.category.image?.alt_text?.trim() || props.category.name,
);
</script>

<template>
  <NuxtLink
    :to="categoryPath"
    :aria-label="`${category.name} კატეგორია`"
    class="group flex h-full min-h-[170px] flex-col overflow-hidden rounded-lg border border-border-default bg-surface shadow-[0_16px_38px_-34px_var(--shadow-color)] transition-[border-color,box-shadow,background-color] duration-200 hover:border-accent-primary/70 hover:bg-surface-2 hover:shadow-[0_20px_46px_-34px_var(--shadow-color)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary sm:min-h-[184px]"
  >
    <span
      class="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden border-b border-border-default bg-white"
    >
      <BasePicture
        :data="imageAsset"
        :alt="imageAlt"
        preset="card"
        fit="cover"
        class="h-full w-full scale-[1.18] transition-transform duration-200 group-hover:scale-[1.22]"
        lazy
      />
    </span>

    <span class="flex min-h-[50px] items-center justify-center px-2.5 py-2">
      <span
        class="category-shortcut-title text-center text-[12px] font-extrabold leading-[17px] text-text-primary transition-colors duration-200 group-hover:text-accent-primary sm:text-[13px] sm:leading-[18px]"
      >
        {{ category.name }}
      </span>
    </span>
  </NuxtLink>
</template>

<style scoped>
.category-shortcut-title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>
