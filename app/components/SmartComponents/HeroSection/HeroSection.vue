<script setup lang="ts">
import {
  CreditCardIcon,
  ReceiptPercentIcon,
  TruckIcon,
} from "@heroicons/vue/24/outline";
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
const heroImageAlt = computed(() => heroTitle.value || "FlexDrive hero image");

const trustItems = [
  {
    label: "0% ნაწილ-ნაწილ გადახდა",
    icon: ReceiptPercentIcon,
  },
  {
    label: "ონლაინ განვადება",
    icon: CreditCardIcon,
  },
  {
    label: "სწრაფი მიტანა",
    icon: TruckIcon,
  },
  {
    label: "უსაფრთხო გადახდა",
    icon: CreditCardIcon,
  },
];
</script>

<template>
  <section
    class="hero-section relative isolate w-full overflow-hidden bg-surface-2"
  >
    <BasePicture
      v-if="hasHeroImage"
      :data="heroImageData"
      :alt="heroImageAlt"
      preset="hero"
      fit="cover"
      position="center center"
      :lazy="false"
      fetchpriority="high"
      class="hero-image absolute inset-0 -z-20 h-full w-full"
    />

    <div
      v-else
      class="hero-fallback absolute inset-0 -z-20"
      aria-hidden="true"
    />

    <div class="hero-overlay absolute inset-0 -z-10" aria-hidden="true" />

    <div class="hero-inner absolute inset-0 z-0">
      <div class="hero-content-frame container-fluid flex h-full items-center">
        <div
          class="hero-copy max-w-[560px] py-8 sm:py-10 md:py-12 lg:max-w-[620px]"
        >
          <p
            class="upper mb-3 inline-flex min-h-[32px] items-center rounded-full border border-accent-primary/25 bg-surface/80 px-3 text-[14px] font-bold leading-5 text-accent-primary shadow-[0_12px_28px_-24px_var(--shadow-color)] backdrop-blur"
          >
            პრემიუმ ხარისხის ავტონაწილები
          </p>

          <h1
            v-if="heroTitle"
            class="hero-title upper text-[30px] font-extrabold leading-[38px] text-text-primary sm:text-[34px] sm:leading-[42px] lg:text-[44px] lg:leading-[52px] xl:text-[48px] xl:leading-[56px]"
          >
            {{ heroTitle }}
          </h1>

          <p
            v-if="heroSubtitle"
            class="hero-subtitle mt-3 max-w-[520px] text-[16px] font-medium leading-[24px] text-text-secondary"
          >
            {{ heroSubtitle }}
          </p>

          <div
            v-if="heroPrimaryCtaText"
            class="mt-5 flex flex-wrap items-center gap-3"
          >
            <BaseButton
              as="nuxt-link"
              to="/catalog"
              variant="primary"
              class="upper rounded-[8px] px-5 py-3 text-[14px] leading-5"
            >
              {{ heroPrimaryCtaText }}
            </BaseButton>
          </div>

          <ul
            class="mt-5 hidden max-w-[560px] gap-2 sm:grid sm:grid-cols-2"
            aria-label="FlexDrive trust benefits"
          >
            <li
              v-for="item in trustItems"
              :key="item.label"
              class="flex min-h-[48px] items-center justify-start gap-2 rounded-full border border-border-default bg-surface/75 px-3 py-2 text-left text-[12px] font-semibold leading-[18px] text-text-secondary shadow-[0_10px_24px_-24px_var(--shadow-color)] backdrop-blur"
            >
              <component
                :is="item.icon"
                class="h-4 w-4 shrink-0 text-accent-primary"
                aria-hidden="true"
              />
              <span>{{ item.label }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-fallback {
  background: linear-gradient(
    115deg,
    var(--surface) 0%,
    var(--surface-2) 48%,
    var(--accent-soft) 100%
  );
}

.hero-section {
  aspect-ratio: 375 / 570;
}

.hero-title {
  max-width: 550px;
}

.hero-subtitle {
  max-width: 520px;
}

.hero-copy {
  position: relative;
  z-index: 1;
}

.hero-overlay {
  background:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--surface) 96%, transparent) 0%,
      color-mix(in srgb, var(--surface) 86%, transparent) 34%,
      color-mix(in srgb, var(--surface) 28%, transparent) 58%,
      transparent 100%
    ),
    linear-gradient(
      0deg,
      color-mix(in srgb, var(--surface) 22%, transparent),
      transparent 42%
    );
}

@media (min-width: 768px) {
  .hero-section {
    aspect-ratio: 768 / 470;
  }
}

@media (max-width: 1239px) {
  .hero-title {
    font-size: 32px;
    line-height: 40px;
  }
}

@media (min-width: 1024px) {
  .hero-section {
    aspect-ratio: 1440 / 660;
  }

  :deep(.hero-image img) {
    object-fit: cover !important;
    object-position: 58% 38% !important;
  }
}

@media (max-width: 1023px) {
  .hero-title {
    max-width: 430px;
    font-size: 24px;
    line-height: 32px;
  }

  .hero-subtitle {
    max-width: 370px;
  }
}

@media (min-width: 1440px) {
  .hero-section {
    aspect-ratio: 1920 / 768;
  }

  .hero-title {
    max-width: 620px;
  }
}

:global(.dark) .hero-overlay {
  background:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--bg-primary) 94%, transparent) 0%,
      color-mix(in srgb, var(--bg-primary) 82%, transparent) 38%,
      color-mix(in srgb, var(--bg-primary) 38%, transparent) 62%,
      color-mix(in srgb, var(--bg-primary) 10%, transparent) 100%
    ),
    linear-gradient(
      0deg,
      color-mix(in srgb, var(--bg-primary) 28%, transparent),
      transparent 48%
    );
}

@media (max-width: 767px) {
  .hero-inner {
    align-items: flex-start;
  }

  .hero-title,
  .hero-subtitle {
    max-width: none;
  }

  .hero-content-frame {
    align-items: flex-start;
  }

  .hero-copy {
    padding-top: 28px;
    padding-bottom: 24px;
  }

  .hero-overlay {
    background:
      linear-gradient(
        155deg,
        color-mix(in srgb, var(--surface) 98%, transparent) 0%,
        color-mix(in srgb, var(--surface) 96%, transparent) 26%,
        color-mix(in srgb, var(--surface) 78%, transparent) 44%,
        color-mix(in srgb, var(--surface) 34%, transparent) 62%,
        transparent 80%
      ),
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--surface) 22%, transparent) 0%,
        transparent 26%
      );
  }

  :global(.dark) .hero-overlay {
    background:
      linear-gradient(
        155deg,
        color-mix(in srgb, var(--bg-primary) 97%, transparent) 0%,
        color-mix(in srgb, var(--bg-primary) 94%, transparent) 24%,
        color-mix(in srgb, var(--bg-primary) 82%, transparent) 42%,
        color-mix(in srgb, var(--bg-primary) 34%, transparent) 60%,
        transparent 78%
      ),
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--bg-primary) 22%, transparent) 0%,
        transparent 20%
      );
  }

  :global(.dark) .hero-subtitle {
    color: color-mix(in srgb, var(--text-primary) 92%, var(--surface));
  }
}
</style>
