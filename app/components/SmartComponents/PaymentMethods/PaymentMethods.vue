<script setup lang="ts">
import { CalendarDaysIcon } from "@heroicons/vue/24/outline";
import AppBreadcrumbs from "~/components/common/AppBreadcrumbs.vue";
import LegalDetailPanel from "~/components/common/LegalDetailPanel.vue";
import LegalOverviewCard from "~/components/common/LegalOverviewCard.vue";
import { formatGeorgianDate } from "~/composables/formatGeorgianDate";
import { sanitizeText } from "~/composables/helpers";
import type { ContentItemData, SmartComponentRenderData } from "~/types/page";

type PaymentMethodsData = SmartComponentRenderData & {
  updated_at?: string | null;
};

type PaymentMethodsSection = {
  id: number;
  anchorId: string;
  title: string;
  summary: string;
  html: string;
  iconSvg: string;
  position: number;
};

const props = defineProps<{
  data?: PaymentMethodsData;
}>();

const sectionTitle = computed(
  () => sanitizeText(props.data?.title) || "გადახდის მეთოდები",
);
const sectionSubtitle = computed(() => sanitizeText(props.data?.subtitle));

const rawItems = computed<ContentItemData[]>(() => {
  const list = props.data?.contentData?.list;
  return Array.isArray(list) ? list : [];
});

const sections = computed<PaymentMethodsSection[]>(() =>
  rawItems.value
    .map((item, index) => {
      const position = Number(item.position ?? index + 1);

      return {
        id: Number(item.id ?? index + 1),
        anchorId: `payment-methods-section-${position}`,
        title: sanitizeText(item.title),
        summary: sanitizeText(item.description),
        html: item.editor?.trim() || "",
        iconSvg: sanitizeText(item.icon_svg),
        position,
      };
    })
    .filter((item) => item.title || item.summary || item.html || item.iconSvg)
    .sort((a, b) =>
      a.position === b.position ? a.id - b.id : a.position - b.position,
    ),
);

const formattedUpdatedAt = computed(() => {
  return formatGeorgianDate(props.data?.updated_at);
});

const breadcrumbItems = computed(() => [
  { label: "მთავარი", to: "/" },
  { label: sectionTitle.value },
]);

let activeScrollAnimationFrame: number | null = null;

const stopActiveScrollAnimation = () => {
  if (!import.meta.client || activeScrollAnimationFrame === null) return;

  window.cancelAnimationFrame(activeScrollAnimationFrame);
  activeScrollAnimationFrame = null;
};

const easeInOutCubic = (progress: number) => {
  if (progress < 0.5) {
    return 4 * progress * progress * progress;
  }

  return 1 - Math.pow(-2 * progress + 2, 3) / 2;
};

const animateScrollTo = (targetTop: number, duration = 780) => {
  if (!import.meta.client) return;

  stopActiveScrollAnimation();

  const startTop = window.scrollY;
  const distance = targetTop - startTop;

  if (Math.abs(distance) < 1) {
    window.scrollTo({ top: targetTop });
    return;
  }

  const startTime = window.performance.now();

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeInOutCubic(progress);

    window.scrollTo({
      top: startTop + distance * easedProgress,
    });

    if (progress < 1) {
      activeScrollAnimationFrame = window.requestAnimationFrame(step);
      return;
    }

    activeScrollAnimationFrame = null;
  };

  activeScrollAnimationFrame = window.requestAnimationFrame(step);
};

const scrollToSection = (event: MouseEvent, anchorId: string) => {
  if (!import.meta.client) return;

  const target = document.getElementById(anchorId);
  if (!target) return;

  event.preventDefault();

  const scrollMarginTop = Number.parseFloat(
    window.getComputedStyle(target).scrollMarginTop || "0",
  );
  const targetTop = Math.max(
    0,
    window.scrollY + target.getBoundingClientRect().top - scrollMarginTop,
  );

  window.history.replaceState({}, "", `#${anchorId}`);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    stopActiveScrollAnimation();
    window.scrollTo({ top: targetTop });
    return;
  }

  animateScrollTo(targetTop);
};

onBeforeUnmount(() => {
  stopActiveScrollAnimation();
});
</script>

<template>
  <section class="relative overflow-hidden py-8 md:py-10 lg:py-12">
    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-[440px] bg-[radial-gradient(circle_at_top,rgba(255,107,53,0.18),transparent_58%),linear-gradient(180deg,var(--section-warm)_0%,transparent_100%)]"
      aria-hidden="true"
    />

    <div class="container-fluid relative">
      <AppBreadcrumbs :items="breadcrumbItems" />

      <div
        class="mt-6 overflow-hidden rounded-[28px] border border-border-default bg-surface shadow-[0_24px_60px_-38px_var(--shadow-color)]"
      >
        <div
          class="relative overflow-hidden border-b border-border-default bg-[linear-gradient(135deg,rgba(255,107,53,0.12),rgba(255,255,255,0)),linear-gradient(180deg,var(--section-warm)_0%,var(--surface)_88%)] px-5 py-8 md:px-8 md:py-10 lg:px-10 lg:py-12"
        >
          <div
            class="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-[rgba(255,107,53,0.12)] blur-3xl"
            aria-hidden="true"
          />

          <div
            class="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
          >
            <div class="max-w-3xl">
              <h1
                class="title-under-xs text-[30px] font-extrabold leading-[1.12] text-text-primary md:text-[38px] lg:text-[46px]"
              >
                {{ sectionTitle }}
              </h1>

              <p
                v-if="sectionSubtitle"
                class="subtitle-under-xs mt-4 max-w-2xl text-sm leading-7 text-text-secondary md:text-base"
              >
                {{ sectionSubtitle }}
              </p>
            </div>

            <div
              v-if="formattedUpdatedAt"
              class="inline-flex min-h-11 items-center gap-3 self-start rounded-full border border-border-default bg-surface px-4 py-2.5 text-sm text-text-secondary"
            >
              <CalendarDaysIcon
                class="h-5 w-5 shrink-0 text-accent-primary"
                aria-hidden="true"
              />
              <span>{{ formattedUpdatedAt }}</span>
            </div>
          </div>
        </div>

        <div class="px-5 py-6 md:px-8 md:py-8 lg:px-10">
          <div
            v-if="sections.length"
            class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            <LegalOverviewCard
              v-for="(section, index) in sections"
              :key="section.id"
              :href="`#${section.anchorId}`"
              :index="index + 1"
              :title="section.title"
              :summary="section.summary"
              :icon-svg="section.iconSvg"
              @navigate="scrollToSection($event, section.anchorId)"
            />
          </div>

          <div
            v-else
            class="rounded-[20px] border border-dashed border-border-default bg-surface-2 px-5 py-6 text-center text-sm text-text-secondary"
          >
            გადახდის მეთოდების სექციები ჯერ არ არის დამატებული.
          </div>
        </div>
      </div>

      <div v-if="sections.length" class="mt-8 space-y-5 lg:mt-10">
        <LegalDetailPanel
          v-for="(section, index) in sections"
          :key="`${section.id}-${section.anchorId}`"
          :section-id="section.anchorId"
          :index="index + 1"
          :title="section.title"
          :summary="section.summary"
          :icon-svg="section.iconSvg"
          :html="section.html"
          :variant="index % 2 === 0 ? 'base' : 'subtle'"
        />
      </div>
    </div>
  </section>
</template>
