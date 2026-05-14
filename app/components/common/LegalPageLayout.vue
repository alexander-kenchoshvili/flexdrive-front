<script setup lang="ts">
import { CalendarDaysIcon } from "@heroicons/vue/24/outline";
import AppBreadcrumbs from "~/components/common/AppBreadcrumbs.vue";
import LegalDetailPanel from "~/components/common/LegalDetailPanel.vue";
import LegalOverviewCard from "~/components/common/LegalOverviewCard.vue";
import { formatGeorgianDate } from "~/composables/formatGeorgianDate";
import type { LegalPageSection } from "~/composables/useLegalPageSections";

type BreadcrumbItem = {
  label: string;
  to?: string;
};

const props = defineProps<{
  title: string;
  subtitle?: string;
  updatedAt?: string | null;
  sections: LegalPageSection[];
  breadcrumbItems: BreadcrumbItem[];
  navLabel: string;
  emptyText: string;
}>();

const formattedUpdatedAt = computed(() => formatGeorgianDate(props.updatedAt));

const scrollToSection = (event: MouseEvent, sectionId: string) => {
  if (!import.meta.client) return;

  const target = document.getElementById(sectionId);
  if (!target) return;

  event.preventDefault();
  window.history.replaceState({}, "", `#${sectionId}`);
  target.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "start",
  });
};
</script>

<template>
  <section class="bg-bg-primary py-4 sm:py-6 lg:py-8">
    <div class="container-fluid">
      <AppBreadcrumbs :items="breadcrumbItems" />

      <header
        class="mt-4 rounded-xl border border-border-default bg-surface p-4 shadow-[0_18px_48px_-40px_var(--shadow-color)] sm:mt-5 sm:p-6 lg:p-8"
      >
        <div
          class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
        >
          <div class="min-w-0 max-w-3xl">
            <h1
              class="upper text-2xl font-extrabold leading-8 text-text-primary sm:text-[32px] sm:leading-[40px] lg:text-[38px] lg:leading-[46px]"
            >
              {{ title }}
            </h1>

            <p
              v-if="subtitle"
              class="mt-3 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base sm:leading-7"
            >
              {{ subtitle }}
            </p>
          </div>

          <div
            v-if="formattedUpdatedAt"
            class="inline-flex min-h-10 w-fit items-center gap-2 rounded-lg border border-border-default bg-surface-2 px-3 py-2 text-sm font-medium text-text-secondary"
          >
            <CalendarDaysIcon
              class="h-5 w-5 shrink-0 text-accent-primary"
              aria-hidden="true"
            />
            <span>{{ formattedUpdatedAt }}</span>
          </div>
        </div>
      </header>

      <nav
        v-if="sections.length"
        class="mt-4 rounded-xl border border-border-default bg-surface p-3 shadow-[0_18px_48px_-42px_var(--shadow-color)] sm:p-4 lg:mt-5"
        :aria-label="navLabel"
      >
        <div class="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          <LegalOverviewCard
            v-for="(section, index) in sections"
            :key="section.id"
            :href="`#${section.anchorId}`"
            :index="index + 1"
            :title="section.title"
            :summary="section.summary"
            :icon-name="section.iconName"
            @navigate="scrollToSection($event, section.anchorId)"
          />
        </div>
      </nav>

      <div
        v-else
        class="mt-4 rounded-xl border border-dashed border-border-default bg-surface px-4 py-5 text-center text-sm text-text-secondary sm:px-5"
      >
        {{ emptyText }}
      </div>

      <div
        v-if="sections.length"
        class="mt-4 space-y-3 sm:mt-5 sm:space-y-4 lg:mt-6"
      >
        <LegalDetailPanel
          v-for="(section, index) in sections"
          :key="`${section.id}-${section.anchorId}`"
          :section-id="section.anchorId"
          :index="index + 1"
          :title="section.title"
          :summary="section.summary"
          :icon-name="section.iconName"
          :html="section.html"
          :variant="index % 2 === 0 ? 'base' : 'subtle'"
        />
      </div>
    </div>
  </section>
</template>
