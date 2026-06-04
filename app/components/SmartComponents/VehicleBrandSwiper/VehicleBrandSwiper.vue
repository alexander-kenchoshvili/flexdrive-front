<script setup lang="ts">
import { ArrowRightIcon } from "@heroicons/vue/20/solid";
import { Swiper, SwiperSlide } from "swiper/vue";
import "swiper/css";
import type { Swiper as SwiperInstance } from "swiper";

import { sanitizeText } from "~/composables/helpers";
import type { ContentItemData, SmartComponentData } from "~/types/page";
import VehicleBrandCard, {
  type VehicleBrandItem,
} from "./parts/VehicleBrandCard.vue";

const props = defineProps<{
  data?: SmartComponentData;
}>();

const swiperInstance = ref<SwiperInstance | null>(null);
const activeDotIndex = ref(0);
const dotCount = ref(1);

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const rawItems = computed<ContentItemData[]>(() => {
  const list = props.data?.contentData?.list;
  return Array.isArray(list) ? list : [];
});

const sectionTitle = computed(
  () => sanitizeText(props.data?.title) || "ნაწილები მარკის მიხედვით",
);
const sectionSubtitle = computed(
  () =>
    sanitizeText(props.data?.subtitle) ||
    "აირჩიე ავტომობილის მარკა და პირდაპირ გადადი შესაბამისი ნაწილების კატალოგში.",
);
const sectionButtonText = computed(
  () => sanitizeText(props.data?.buttonText) || "ყველა მარკის ნახვა",
);

const brands = computed<VehicleBrandItem[]>(() =>
  rawItems.value
    .map((item, index) => ({
      id: toNumber(item.id, index + 1),
      title: sanitizeText(item.title),
      slug: sanitizeText(item.slug),
      description: sanitizeText(item.description),
      position: toNumber(item.position, index + 1),
      iconSvg: sanitizeText(item.icon_svg),
    }))
    .filter((item) => item.title && item.slug)
    .sort((a, b) =>
      a.position === b.position ? a.id - b.id : a.position - b.position,
    ),
);

const showDots = computed(() => dotCount.value > 1);

const updateSwiperDots = (swiper: SwiperInstance) => {
  const snaps = Array.isArray(swiper.snapGrid) ? swiper.snapGrid.length : 1;
  dotCount.value = Math.max(1, snaps);
  activeDotIndex.value = Math.min(
    Math.max(swiper.snapIndex ?? swiper.activeIndex ?? 0, 0),
    dotCount.value - 1,
  );
};

const handleSwiperInit = (swiper: SwiperInstance) => {
  swiperInstance.value = swiper;
  updateSwiperDots(swiper);
};

const handleSwiperChange = (swiper: SwiperInstance) => {
  updateSwiperDots(swiper);
};

const goToDot = (index: number) => {
  swiperInstance.value?.slideTo(index);
};
</script>

<template>
  <section
    v-if="brands.length"
    class="overflow-hidden border-b border-border-default bg-section-soft py-8 md:py-10 lg:py-12"
  >
    <div class="container-fluid">
      <div
        class="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:mb-6"
      >
        <div class="min-w-0">
          <h2
            class="title-under-xs upper text-[22px] font-extrabold leading-[30px] text-text-primary sm:text-[26px] sm:leading-[34px] md:text-[30px] md:leading-[38px]"
          >
            {{ sectionTitle }}
          </h2>
          <p
            v-if="sectionSubtitle"
            class="subtitle-under-xs mt-2 max-w-2xl text-[14px] font-medium leading-[22px] text-text-secondary md:text-[15px] md:leading-6"
          >
            {{ sectionSubtitle }}
          </p>
        </div>

        <BaseButton
          as="nuxt-link"
          to="/catalog"
          variant="accent-outline"
          size="sm"
          class="upper hidden shrink-0 !rounded-lg px-4 text-[13px] leading-5 sm:inline-flex"
        >
          {{ sectionButtonText }}
          <template #right>
            <ArrowRightIcon class="h-4 w-4" aria-hidden="true" />
          </template>
        </BaseButton>
      </div>

      <div class="vehicle-brand-slider-shell">
        <ClientOnly>
          <Swiper
            class="vehicle-brand-swiper"
            :slides-per-view="2.05"
            :space-between="10"
            :watch-overflow="true"
            @swiper="handleSwiperInit"
            @slide-change="handleSwiperChange"
            @resize="handleSwiperChange"
            :breakpoints="{
              480: { slidesPerView: 2.6, spaceBetween: 10 },
              640: { slidesPerView: 3.35, spaceBetween: 12 },
              900: { slidesPerView: 4.6, spaceBetween: 14 },
              1200: { slidesPerView: 6, spaceBetween: 14 },
              1536: { slidesPerView: 7, spaceBetween: 16 },
            }"
          >
            <SwiperSlide
              v-for="brand in brands"
              :key="brand.id"
              class="h-auto"
            >
              <VehicleBrandCard :brand="brand" />
            </SwiperSlide>
          </Swiper>

          <template #fallback>
            <div class="flex gap-3 overflow-hidden">
              <div
                v-for="brand in brands.slice(0, 8)"
                :key="brand.id"
                class="w-[46%] shrink-0 xs:w-[36%] sm:w-[27%] md:w-[21%] xl:w-[15%]"
              >
                <VehicleBrandCard :brand="brand" />
              </div>
            </div>
          </template>
        </ClientOnly>
      </div>

      <div v-if="showDots" class="mt-4 flex justify-center gap-2">
        <button
          v-for="dotIndex in dotCount"
          :key="dotIndex"
          type="button"
          class="h-2 rounded-full transition-[width,background-color] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
          :class="
            dotIndex - 1 === activeDotIndex
              ? 'w-6 bg-accent-primary'
              : 'w-2 bg-border-muted hover:bg-accent-primary/60'
          "
          :aria-label="`მარკების სლაიდი ${dotIndex}`"
          :aria-current="dotIndex - 1 === activeDotIndex ? 'true' : undefined"
          @click="goToDot(dotIndex - 1)"
        />
      </div>

      <BaseButton
        as="nuxt-link"
        to="/catalog"
        variant="accent-outline"
        size="sm"
        :full-width="true"
        class="upper mt-4 !rounded-lg text-[13px] leading-5 sm:hidden"
      >
        {{ sectionButtonText }}
        <template #right>
          <ArrowRightIcon class="h-4 w-4" aria-hidden="true" />
        </template>
      </BaseButton>
    </div>
  </section>
</template>

<style scoped>
.vehicle-brand-slider-shell {
  clip-path: inset(-32px 0 -32px -100vw);
}

.vehicle-brand-swiper {
  overflow: visible;
}

.vehicle-brand-swiper :deep(.swiper-slide) {
  height: auto;
}

.vehicle-brand-swiper :deep(.swiper-slide > *) {
  height: 100%;
}
</style>
