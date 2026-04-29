<script setup lang="ts">
import { ArrowRightIcon } from "@heroicons/vue/20/solid";
import { Swiper, SwiperSlide } from "swiper/vue";
import "swiper/css";
import type { Swiper as SwiperInstance } from "swiper";

import type { SmartComponentData } from "~/types/page";
import type { CatalogCategoryItem } from "~/types/catalog";
import { useCatalogApi } from "~/composables/catalog/useCatalogApi";
import CategoryShortcutCard from "./parts/CategoryShortcutCard.vue";

const props = defineProps<{
  data?: SmartComponentData;
}>();

const { getCatalogCategories } = useCatalogApi();

const categoriesResponse = ref<CatalogCategoryItem[]>([]);
const categoriesPending = ref(false);
const categoriesError = ref<unknown>(null);
const swiperInstance = ref<SwiperInstance | null>(null);
const activeDotIndex = ref(0);
const dotCount = ref(1);

const sectionTitle = computed(() => {
  const title = String(props.data?.title || "").trim();
  if (!title || title.includes("Auto[[Mate]]") || title.includes("პრობლემ")) {
    return "კატეგორიები";
  }

  return title;
});

const sectionButtonText = computed(
  () => String(props.data?.buttonText || "").trim() || "ყველა კატეგორია",
);
const sectionSubtitle = computed(() => String(props.data?.subtitle || "").trim());

const categories = computed(() => categoriesResponse.value);

const showDots = computed(() => dotCount.value > 1);

const handleSwiperInit = (swiper: SwiperInstance) => {
  swiperInstance.value = swiper;
  updateSwiperDots(swiper);
};

const handleSwiperChange = (swiper: SwiperInstance) => {
  updateSwiperDots(swiper);
};

const updateSwiperDots = (swiper: SwiperInstance) => {
  const snaps = Array.isArray(swiper.snapGrid) ? swiper.snapGrid.length : 1;
  dotCount.value = Math.max(1, snaps);
  activeDotIndex.value = Math.min(
    Math.max(swiper.snapIndex ?? swiper.activeIndex ?? 0, 0),
    dotCount.value - 1,
  );
};

const goToDot = (index: number) => {
  swiperInstance.value?.slideTo(index);
};

const loadCategories = async () => {
  categoriesPending.value = true;
  categoriesError.value = null;

  const request = await getCatalogCategories();

  categoriesPending.value = false;

  if (request.error.value) {
    categoriesError.value = request.error.value;
    return;
  }

  categoriesResponse.value = request.data.value ?? [];
};

await loadCategories();
</script>

<template>
  <section
    class="overflow-hidden border-b border-border-default bg-bg-primary py-8 md:py-10 lg:py-12"
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

      <div
        v-if="categoriesPending"
        class="rounded-lg border border-border-default bg-surface p-4 text-center text-[14px] font-medium leading-5 text-text-secondary"
      >
        კატეგორიები იტვირთება...
      </div>

      <div
        v-else-if="categoriesError"
        class="rounded-lg border border-error/35 bg-surface p-4 text-center text-[14px] font-medium leading-5 text-text-secondary"
      >
        კატეგორიების ჩატვირთვა ვერ მოხერხდა.
      </div>

      <div
        v-else-if="!categories.length"
        class="rounded-lg border border-dashed border-border-default bg-surface p-4 text-center text-[14px] font-medium leading-5 text-text-muted"
      >
        კატეგორიები ჯერ არ არის დამატებული.
      </div>

      <div v-else>
        <div class="category-shortcuts-slider-shell">
          <ClientOnly>
            <Swiper
              :slides-per-view="2"
              :space-between="10"
              :watch-overflow="true"
              @swiper="handleSwiperInit"
              @slide-change="handleSwiperChange"
              @resize="handleSwiperChange"
              :breakpoints="{
                480: { slidesPerView: 2.35, spaceBetween: 10 },
                640: { slidesPerView: 3.35, spaceBetween: 12 },
                900: { slidesPerView: 4.35, spaceBetween: 12 },
                1200: { slidesPerView: 6, spaceBetween: 14 },
                1536: { slidesPerView: 7, spaceBetween: 14 },
              }"
            >
              <SwiperSlide v-for="category in categories" :key="category.id">
                <CategoryShortcutCard :category="category" />
              </SwiperSlide>
            </Swiper>

            <template #fallback>
              <div class="flex gap-3 overflow-hidden">
                <div
                  v-for="category in categories.slice(0, 8)"
                  :key="category.id"
                  class="w-[42%] shrink-0 sm:w-[23%] lg:w-[13%]"
                >
                  <CategoryShortcutCard :category="category" />
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
            :aria-label="`კატეგორიების სლაიდი ${dotIndex}`"
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
    </div>
  </section>
</template>

<style scoped>
.category-shortcuts-slider-shell {
  clip-path: inset(-32px 0 -32px -100vw);
}

.swiper {
  overflow: visible;
}
</style>
