<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";

const props = defineProps<{
  currentPage: number;
  totalPages: number;
  pageTo: (page: number) => RouteLocationRaw;
  variant: "catalog" | "blog-list";
}>();
const emit = defineEmits<{ navigate: [] }>();

const pageCount = computed(() => Math.max(1, Math.floor(props.totalPages)));
const activePage = computed(() => Math.min(pageCount.value, Math.max(1, props.currentPage)));
const pageWindow = (size: number) => {
  const start = Math.max(1, Math.min(activePage.value - Math.floor(size / 2), pageCount.value - size + 1));
  return Array.from({ length: Math.min(size, pageCount.value) }, (_, index) => start + index);
};
const items = computed(() => {
  const desktop = pageWindow(5);
  const mobile = pageWindow(3);
  const result: { page: number; label: string; kind: string; mobileHidden: boolean; rel?: string }[] = [];
  if (desktop[0]! > 1) result.push({ page: 1, label: "პირველი", kind: "edge", mobileHidden: true });
  if (activePage.value > 1) result.push({ page: activePage.value - 1, label: "‹", kind: "nav", mobileHidden: false, rel: "prev" });
  for (const page of desktop) result.push({ page, label: String(page), kind: "number", mobileHidden: !mobile.includes(page) });
  if (activePage.value < pageCount.value) result.push({ page: activePage.value + 1, label: "›", kind: "nav", mobileHidden: false, rel: "next" });
  if (desktop.at(-1)! < pageCount.value) result.push({ page: pageCount.value, label: "ბოლო", kind: "edge", mobileHidden: true });
  return result;
});

const handleNavigate = async (event: MouseEvent, navigate: (event?: MouseEvent) => unknown) => {
  const ordinaryClick = !event.defaultPrevented && event.button === 0 &&
    !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
  const failure = await navigate(event);
  if (ordinaryClick && !failure) emit("navigate");
};
const labelFor = (item: { page: number; rel?: string }) => {
  if (item.rel === "prev") return "წინა გვერდი";
  if (item.rel === "next") return "შემდეგი გვერდი";
  return `გვერდი ${item.page}`;
};
</script>

<template>
  <nav v-if="pageCount > 1" aria-label="გვერდების ნავიგაცია">
    <ul :class="`${variant}-pagination`">
      <li v-for="item in items" :key="`${item.kind}-${item.rel || item.page}`" :class="{ 'pagination-desktop-only': item.mobileHidden }">
        <span
          v-if="item.kind === 'number' && item.page === activePage"
          class="pagination-control"
          :class="[`${variant}-paginate-button`, `${variant}-paginate-number`, `${variant}-paginate-active`]"
          aria-current="page"
          :aria-label="`მიმდინარე გვერდი ${item.page}`"
        >{{ item.label }}</span>
        <NuxtLink v-else v-slot="{ href, navigate }" :to="pageTo(item.page)" :prefetch="false" custom>
          <a
            :href="href"
            :rel="item.rel"
            :aria-label="labelFor(item)"
            class="pagination-control"
            :class="[`${variant}-paginate-button`, `${variant}-paginate-${item.kind}`]"
            @click="handleNavigate($event, navigate)"
          >{{ item.label }}</a>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
ul { list-style: none; margin: 0; padding: 0; }
.pagination-control { display: inline-flex; align-items: center; justify-content: center; text-decoration: none; }
a:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
@media (max-width: 640px) {
  .pagination-desktop-only { display: none; }
}
</style>
