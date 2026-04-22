<script setup lang="ts">
import { sanitizeText } from "~/composables/helpers";
import type { HeroSectionData } from "~/types/page";

const props = defineProps<{
  data: HeroSectionData;
}>();

const heroTitle = computed(() => sanitizeText(props.data?.title));
const heroSubtitle = computed(() => sanitizeText(props.data?.subtitle));
const heroPrimaryCtaText = computed(() => sanitizeText(props.data?.buttonText));

const heroImageData = computed(() => props.data?.image || null);

const hasHeroImage = computed(() =>
  Boolean(
    heroImageData.value?.desktop ||
    heroImageData.value?.tablet ||
    heroImageData.value?.mobile,
  ),
);
const heroImageAlt = computed(() => heroTitle.value || "AutoMate hero image");
</script>

<template>
  <section class="w-full">
    <div class="container-fluid">
      <div
        class="grid grid-cols-1 items-center gap-6 py-8 min-[480px]:py-10 sm:gap-8 sm:py-12 md:py-16 lg:grid-cols-2 lg:gap-12 lg:py-20 xl:py-24"
      >
        <div>
          <h1
            v-if="heroTitle"
            class="title-under-xs mb-3 text-[24px] font-extrabold leading-[1.3] text-text-primary min-[480px]:text-[28px] sm:text-[32px] md:text-[36px] lg:text-[42px] xl:text-[48px] upper"
          >
            {{ heroTitle }}
          </h1>

          <p
            v-if="heroSubtitle"
            class="subtitle-under-xs mb-6 text-[15px] leading-[1.6] text-text-secondary min-[480px]:text-[16px] md:text-[17px] lg:text-[18px] xl:text-[20px]"
          >
            {{ heroSubtitle }}
          </p>

          <div v-if="heroPrimaryCtaText" class="flex flex-wrap gap-3">
            <BaseButton
              as="nuxt-link"
              to="/catalog"
              variant="primary"
              class="px-[18px] py-[10px] text-[14px] leading-[1.2] upper"
            >
              {{ heroPrimaryCtaText }}
            </BaseButton>
          </div>
        </div>

        <div
          class="relative overflow-hidden rounded-xl border border-border-default bg-gradient-to-br from-[#fff5f0] to-[#ffe6db] dark:from-[#1e293b] dark:to-[#2d3748] pt-[60%] md:pt-[50%] lg:pt-[91.7%] xl:pt-[62.7%] 2xl:pt-[61.845%]"
        >
          <BasePicture
            v-if="hasHeroImage"
            :data="heroImageData"
            :alt="heroImageAlt"
            preset="hero"
            fit="cover"
            :lazy="false"
            fetchpriority="high"
            class="absolute inset-0 h-full w-full top-0 left-0"
          />

          <div
            v-else
            class="flex h-full w-full items-center justify-center px-4 text-center text-[14px] text-text-muted"
          >
            Hero image
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
