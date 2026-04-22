<script setup lang="ts">
import AppBreadcrumbs from "~/components/common/AppBreadcrumbs.vue";
import ProfileSidebar from "~/components/profile/ProfileSidebar.vue";

type BreadcrumbItem = {
  label: string;
  to?: string;
};

type ProfileSectionKey = "info" | "orders" | "wishlist";

const props = withDefaults(
  defineProps<{
    activeSection: ProfileSectionKey;
    title?: string;
    eyebrow?: string;
    subtitle?: string;
    hideSidebarWhenGuest?: boolean;
  }>(),
  {
    title: "პროფილი",
    eyebrow: "ანგარიში",
    subtitle:
      "აქ შეგიძლია იხილო პირადი და ძირითადი მიწოდების ინფორმაციის ისტორია.",
    hideSidebarWhenGuest: false,
  },
);

const globalStore = useGlobalStore();
const showSidebar = computed(
  () => !(props.hideSidebarWhenGuest && !globalStore.currentUser),
);

const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
  { label: "მთავარი", to: "/" },
  { label: props.title },
]);
</script>

<template>
  <main class="py-8 pb-16 md:py-10 md:pb-20">
    <div class="container-fluid">
      <div class="space-y-8">
        <AppBreadcrumbs :items="breadcrumbItems" />

        <section
          class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"
        >
          <div class="max-w-3xl">
            <p
              v-if="eyebrow"
              class="text-xs font-semibold uppercase tracking-[0.14em] text-accent-primary"
            >
              {{ eyebrow }}
            </p>
            <h1
              :class="[
                'title-under-xs text-[34px] upper font-extrabold leading-tight text-text-primary md:text-[44px]',
                eyebrow ? 'mt-3' : '',
              ]"
            >
              {{ title }}
            </h1>
            <p
              class="subtitle-under-xs mt-3 text-sm leading-7 text-text-secondary md:text-base"
            >
              {{ subtitle }}
            </p>
          </div>
        </section>

        <section
          :class="
            showSidebar
              ? 'grid gap-6 xl:grid-cols-[minmax(220px,24%)_minmax(0,1fr)] xl:items-start'
              : 'min-w-0'
          "
        >
          <aside v-if="showSidebar" class="min-w-0 xl:sticky xl:top-40">
            <ProfileSidebar :active-section="activeSection" />
          </aside>

          <div class="min-w-0">
            <slot />
          </div>
        </section>
      </div>
    </div>
  </main>
</template>
