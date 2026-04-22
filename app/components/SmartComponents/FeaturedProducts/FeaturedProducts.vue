<script setup lang="ts">
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
  () => (props.data?.title as string) || "გამორჩეული პროდუქტები",
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
    class="overflow-hidden border-y border-border-default bg-section-soft py-10 md:py-12"
  >
    <div class="container-fluid">
      <div class="mb-6 md:mb-8">
        <div
          class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <div class="min-w-0">
            <h2
              class="title-under-xs text-[28px] font-extrabold text-text-primary sm:text-[32px] md:text-[36px] upper"
            >
              {{ sectionTitle }}
            </h2>
            <p
              v-if="sectionSubtitle"
              class="subtitle-under-xs mt-3 max-w-2xl text-sm text-text-secondary md:text-base"
            >
              {{ sectionSubtitle }}
            </p>
          </div>

          <BaseButton
            as="nuxt-link"
            to="/catalog"
            variant="accent-outline"
            class="w-full px-5 py-3 text-sm upper lg:w-auto lg:shrink-0"
          >
            {{ sectionButtonText }}
          </BaseButton>
        </div>
      </div>

      <div
        v-if="productsPending"
        class="rounded-xl border border-border-default bg-surface p-6 text-center text-sm text-text-secondary"
      >
        პროდუქტები იტვირთება...
      </div>

      <div
        v-else-if="productsError"
        class="rounded-xl border border-error/30 bg-surface p-6 text-center text-sm text-text-secondary"
      >
        გამორჩეული პროდუქტების ჩატვირთვა ვერ მოხერხდა.
      </div>

      <div
        v-else-if="!featuredProducts.length"
        class="rounded-xl border border-dashed border-border-default bg-surface p-6 text-center text-sm text-text-muted"
      >
        ამ ეტაპზე გამორჩეული პროდუქტები არ არის.
      </div>

      <div v-else>
        <div class="hidden gap-4 xl:grid xl:grid-cols-4">
          <ProductCard
            v-for="product in featuredProducts"
            :key="product.id"
            :product="product"
          />
        </div>

        <ClientOnly>
          <div class="xl:hidden">
            <Swiper
              :slides-per-view="1.1"
              :space-between="12"
              @swiper="handleSwiperInit"
              @slide-change="handleSwiperChange"
              @progress="handleSwiperProgress"
              :breakpoints="{
                520: { slidesPerView: 1.4, spaceBetween: 14 },
                640: { slidesPerView: 1.8, spaceBetween: 16 },
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
              class="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-border-default/70"
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
