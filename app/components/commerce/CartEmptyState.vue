<script setup lang="ts">
import { ShoppingBagIcon } from "@heroicons/vue/24/outline";
import BaseButton from "~/components/common/BaseButton.vue";
</script>

<template>
  <section
    class="rounded-[28px] border border-border-default bg-surface p-8 text-center shadow-[0_24px_60px_-38px_var(--shadow-color)] md:p-12"
  >
    <div
      class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary"
    >
      <ShoppingBagIcon class="h-8 w-8" aria-hidden="true" />
    </div>

    <h2 class="title-under-xs mt-6 text-[30px] font-extrabold leading-tight text-text-primary">
      კალათა ცარიელია
    </h2>

    <p
      class="subtitle-under-xs mx-auto mt-3 max-w-2xl text-sm leading-7 text-text-secondary md:text-base"
    >
      ჯერ არცერთი პროდუქტი არ გაქვს დამატებული. დაათვალიერე კატალოგი და შეაგროვე
      სასურველი პროდუქტები.
    </p>

    <div class="mx-auto mt-8 max-w-xs">
      <BaseButton
        as="nuxt-link"
        to="/catalog"
        variant="primary"
        class="px-6 py-3.5 text-sm upper"
        full-width
      >
        კატალოგის ნახვა
      </BaseButton>
    </div>
  </section>
</template>
