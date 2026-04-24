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
const swiperProgress = ref(0);

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

const mobileProgressPercent = computed(() => {
  const progress = Number.isFinite(swiperProgress.value)
    ? swiperProgress.value
    : 0;
  return Math.min(100, Math.max(0, progress * 100));
});

const handleSwiperInit = (swiper: SwiperInstance) => {
  swiperProgress.value = swiper.progress ?? 0;
};

const handleSwiperChange = (swiper: SwiperInstance) => {
  swiperProgress.value = swiper.progress ?? 0;
};

const handleSwiperProgress = (_swiper: SwiperInstance, progress: number) => {
  swiperProgress.value = progress ?? 0;
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
          class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
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
            class="upper w-full !rounded-lg px-4 text-[13px] leading-5 lg:w-auto lg:shrink-0"
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
              @progress="handleSwiperProgress"
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

            <div
              v-if="featuredProducts.length > 1"
              class="mt-3 h-1 w-full overflow-hidden rounded-full bg-border-default/70"
              aria-hidden="true"
            >
              <span
                class="block h-full rounded-full bg-accent-primary transition-[width] duration-300 ease-out"
                :style="{ width: `${mobileProgressPercent}%` }"
              />
            </div>
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
