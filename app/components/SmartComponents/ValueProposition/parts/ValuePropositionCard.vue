<script setup lang="ts">
import {
  ClockIcon,
  CreditCardIcon,
  TruckIcon,
} from "@heroicons/vue/24/outline";
import type { Component } from "vue";
import BasePicture from "~/components/common/BasePicture.vue";
import type { ImageAsset } from "~/types/page";

export type ValuePropositionIcon = "time" | "payment" | "delivery";

const props = defineProps<{
  title: string;
  description: string;
  icon: ValuePropositionIcon;
  image?: ImageAsset | null;
}>();

const iconMap: Record<ValuePropositionIcon, Component> = {
  time: ClockIcon,
  payment: CreditCardIcon,
  delivery: TruckIcon,
};

const iconComponent = computed(() => iconMap[props.icon]);
const hasImage = computed(() =>
  Boolean(props.image?.desktop || props.image?.tablet || props.image?.mobile),
);
</script>

<template>
  <article
    class="group relative flex min-h-[280px] w-full min-w-0 overflow-hidden rounded-lg border border-white/10 bg-[#0d1411] text-left shadow-[0_22px_50px_-32px_rgba(0,0,0,0.7)] transition-[border-color,box-shadow] duration-200 hover:border-accent-primary/45 hover:shadow-[0_26px_62px_-34px_rgba(0,0,0,0.8)] sm:min-h-[300px] xl:min-h-[250px]"
  >
    <BasePicture
      v-if="hasImage"
      :data="image"
      :alt="title"
      preset="card"
      position="center right"
      class="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-[1.025]"
      lazy
    />

    <div
      class="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,13,11,0.96)_0%,rgba(8,13,11,0.88)_38%,rgba(8,13,11,0.5)_64%,rgba(8,13,11,0.18)_100%)]"
    />
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_14%_22%,rgba(183,221,102,0.16),transparent_28%)]" />

    <div class="relative z-[1] flex min-h-full w-full flex-col justify-between p-5 sm:p-6">
      <span
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#b7dd66]/45 bg-[#b7dd66]/10 text-[#b7dd66] shadow-[0_0_0_8px_rgba(183,221,102,0.07)] transition-colors duration-200 group-hover:border-[#b7dd66]/75 group-hover:bg-[#b7dd66]/15"
      >
        <component :is="iconComponent" class="h-5 w-5" aria-hidden="true" />
      </span>

      <span class="mt-6 block max-w-[76%] min-w-0 sm:mt-8 sm:max-w-[82%]">
        <span
          class="block text-[17px] font-extrabold leading-[25px] text-white sm:text-[18px] sm:leading-[27px]"
        >
          {{ title }}
        </span>

        <span
          v-if="description"
          class="mt-3 block text-[13px] font-semibold leading-[21px] text-white/80 sm:text-[14px] sm:leading-[22px]"
        >
          {{ description }}
        </span>

        <span class="mt-5 block h-1 w-10 rounded-full bg-[#b7dd66]" />
      </span>
    </div>
  </article>
</template>
