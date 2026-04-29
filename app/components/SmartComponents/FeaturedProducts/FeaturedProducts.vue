<script setup lang="ts">
import { ArrowRightIcon } from "@heroicons/vue/20/solid";
import { Swiper, SwiperSlide } from "swiper/vue";
import "swiper/css";
import type { Swiper as SwiperInstance } from "swiper";

import type { SmartComponentData } from "~/types/page";
import type {
  CatalogListResponse,
  CatalogProductCardData,
} from "~/types/catalog";
import { useCatalogApi } from "~/composables/catalog/useCatalogApi";
import ProductCard from "../ProductCatalog/parts/ProductCard.vue";

const props = defineProps<{
  data?: SmartComponentData;
}>();

const { getCatalogProducts } = useCatalogApi();

const productsResponse = ref<CatalogListResponse | null>(null);
const productsPending = ref(false);
const productsError = ref<unknown>(null);
const swiperInstance = ref<SwiperInstance | null>(null);
const activeDotIndex = ref(0);
const dotCount = ref(1);

const sectionTitle = computed(
  () => (props.data?.title as string) || "გამორჩეული ავტონაწილები",
);
const sectionSubtitle = computed(() => (props.data?.subtitle as string) || "");
const sectionButtonText = computed(
  () => (props.data?.buttonText as string) || "ყველა პროდუქტის ნახვა",
);

const featuredProducts = computed<CatalogProductCardData[]>(() => {
  const items = productsResponse.value?.results ?? [];
  return items.map((item) => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    subtitle: item.short_description,
    category: item.category?.name,
    price: Number(item.price),
    oldPrice: item.old_price ? Number(item.old_price) : null,
    image: item.primary_image,
    isNew: item.is_new,
    inStock: item.in_stock,
    onSale: item.on_sale,
  }));
});

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

const loadFeaturedProducts = async () => {
  productsPending.value = true;
  productsError.value = null;

  const request = await getCatalogProducts({
    is_featured: true,
    in_stock: true,
    page_size: 4,
  });

  productsPending.value = false;

  if (request.error.value) {
    productsError.value = request.error.value;
    return;
  }

  productsResponse.value = request.data.value ?? null;
};

await loadFeaturedProducts();
</script>

<template>
  <section
    class="overflow-hidden border-y border-border-default bg-bg-primary py-8 md:py-10 lg:py-12"
  >
    <div class="container-fluid">
      <div class="mb-5 md:mb-7">
        <div
          class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
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
            class="upper hidden !rounded-lg px-4 text-[13px] leading-5 sm:inline-flex sm:w-auto sm:shrink-0"
          >
            {{ sectionButtonText }}
            <template #right>
              <ArrowRightIcon class="h-4 w-4" aria-hidden="true" />
            </template>
          </BaseButton>
        </div>
      </div>

      <div
        v-if="productsPending"
        class="rounded-lg border border-border-default bg-surface p-4 text-center text-[14px] font-medium leading-5 text-text-secondary"
      >
        პროდუქტები იტვირთება...
      </div>

      <div
        v-else-if="productsError"
        class="rounded-lg border border-error/35 bg-surface p-4 text-center text-[14px] font-medium leading-5 text-text-secondary"
      >
        გამორჩეული პროდუქტების ჩატვირთვა ვერ მოხერხდა.
      </div>

      <div
        v-else-if="!featuredProducts.length"
        class="rounded-lg border border-dashed border-border-default bg-surface p-4 text-center text-[14px] font-medium leading-5 text-text-muted"
      >
        ამ ეტაპზე გამორჩეული პროდუქტები არ არის.
      </div>

      <div v-else>
        <div class="hidden gap-3 xl:grid xl:grid-cols-4 2xl:gap-4">
          <ProductCard
            v-for="product in featuredProducts"
            :key="product.id"
            :product="product"
          />
        </div>

        <ClientOnly>
          <div class="xl:hidden">
            <Swiper
              :slides-per-view="1.08"
              :space-between="12"
              :watch-overflow="true"
              @swiper="handleSwiperInit"
              @slide-change="handleSwiperChange"
              @resize="handleSwiperChange"
              :breakpoints="{
                480: { slidesPerView: 1.35, spaceBetween: 12 },
                640: { slidesPerView: 2.05, spaceBetween: 14 },
                900: { slidesPerView: 3.05, spaceBetween: 16 },
              }"
            >
              <SwiperSlide
                v-for="product in featuredProducts"
                :key="product.id"
              >
                <ProductCard :product="product" />
              </SwiperSlide>
            </Swiper>

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
                :aria-label="`გამორჩეული პროდუქტების სლაიდი ${dotIndex}`"
                :aria-current="
                  dotIndex - 1 === activeDotIndex ? 'true' : undefined
                "
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
        </ClientOnly>
      </div>
    </div>
  </section>
</template>

<style scoped>
.swiper {
  overflow: visible;
}
</style>
