<script setup lang="ts">
import { Swiper, SwiperSlide } from "swiper/vue";
import "swiper/css";
import BaseButton from "~/components/common/BaseButton.vue";
import { useBlogApi } from "~/composables/blog/useBlogApi";
import { sanitizeText } from "~/composables/helpers";
import type { BlogListItem } from "~/types/blog";
import type { SmartComponentData } from "~/types/page";
import BlogCard from "./parts/BlogCard.vue";
import BlogGridSkeleton from "./parts/BlogGridSkeleton.vue";

const props = defineProps<{
  data?: SmartComponentData;
}>();

const { getBlogPosts } = useBlogApi();
const {
  data: blogResponse,
  pending,
  error,
  refresh,
} = await getBlogPosts({
  placement: "home",
  page: 1,
});

const sectionTitle = computed(
  () => sanitizeText(props.data?.title) || "სასარგებლო სტატიები",
);
const sectionSubtitle = computed(
  () =>
    sanitizeText(props.data?.subtitle) ||
    "იხილეთ ექსპერტული რჩევები და გზამკვლევები ავტონაწილებზე, ავტომობილის მოვლასა და სწორ არჩევანზე.",
);
const ctaLabel = computed(
  () => sanitizeText(props.data?.buttonText) || "ყველა სტატია",
);

const posts = computed<BlogListItem[]>(() => {
  const items = blogResponse.value?.results;
  return Array.isArray(items) ? items.slice(0, 4) : [];
});
</script>

<template>
  <section class="border-y border-border-default bg-section-soft py-10 md:py-12">
    <div class="container-fluid">
      <div class="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2
            class="title-under-xs upper text-[26px] font-extrabold leading-[1.15] text-text-primary sm:text-[30px] md:text-[34px]"
          >
            {{ sectionTitle }}
          </h2>
          <p class="subtitle-under-xs mt-3 max-w-2xl text-sm leading-6 text-text-secondary md:text-base">
            {{ sectionSubtitle }}
          </p>
        </div>

        <BaseButton
          as="nuxt-link"
          to="/blogs"
          variant="accent-outline"
          size="md"
          class="upper w-full sm:w-auto"
        >
          {{ ctaLabel }}
        </BaseButton>
      </div>

      <BlogGridSkeleton v-if="pending" variant="section" />

      <div
        v-else-if="error"
        class="mt-10 rounded-[20px] border border-error/25 bg-surface p-6"
      >
        <p class="text-base font-semibold text-text-primary">
          ბლოგების ჩატვირთვა ვერ მოხერხდა.
        </p>
        <p class="mt-2 text-sm leading-6 text-text-secondary">
          სცადე თავიდან ან გადაამოწმე API კავშირი.
        </p>
        <BaseButton
          type="button"
          variant="accent-outline"
          size="sm"
          class="mt-4"
          @click="refresh"
        >
          თავიდან ცდა
        </BaseButton>
      </div>

      <div
        v-else-if="!posts.length"
        class="mt-10 rounded-[20px] border border-dashed border-border-default bg-surface p-6 text-sm text-text-secondary"
      >
        სტატიები ჯერ არ დამატებულა.
      </div>

      <Swiper
        v-else
        class="mt-8"
        :slides-per-view="1.12"
        :space-between="12"
        :watch-overflow="true"
        :breakpoints="{
          640: { slidesPerView: 2, spaceBetween: 14 },
          900: { slidesPerView: 3, spaceBetween: 16 },
          1200: { slidesPerView: 4, spaceBetween: 16 },
        }"
      >
        <SwiperSlide v-for="post in posts" :key="post.id" class="h-auto">
          <BlogCard :post="post" />
        </SwiperSlide>
      </Swiper>
    </div>
  </section>
</template>
