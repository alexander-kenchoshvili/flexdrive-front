<script setup lang="ts">
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
  return Array.isArray(items) ? items : [];
});

const featuredPost = computed(() => posts.value[0] ?? null);
const regularPosts = computed(() => posts.value.slice(1, 5));
const hasPosts = computed(() => Boolean(featuredPost.value || regularPosts.value.length));
</script>

<template>
  <section class="border-y border-border-default bg-section-soft py-10 md:py-12">
    <div class="container-fluid">
      <div class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div class="max-w-2xl">
          <h2
            class="title-under-xs upper text-[28px] font-extrabold leading-[1.15] text-text-primary sm:text-[32px] md:text-[36px]"
          >
            {{ sectionTitle }}
          </h2>
          <p class="subtitle-under-xs mt-3 text-sm leading-6 text-text-secondary md:text-base">
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
        v-else-if="!hasPosts"
        class="mt-10 rounded-[20px] border border-dashed border-border-default bg-surface p-6 text-sm text-text-secondary"
      >
        სტატიები ჯერ არ დამატებულა.
      </div>

      <div
        v-else
        class="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        <BlogCard
          v-if="featuredPost"
          :post="featuredPost"
          variant="featured"
          class="lg:col-span-2"
        />

        <BlogCard
          v-for="post in regularPosts"
          :key="post.id"
          :post="post"
        />
      </div>
    </div>
  </section>
</template>
