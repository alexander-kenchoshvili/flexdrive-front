<script setup lang="ts">
import {
  ArrowRightOnRectangleIcon,
  ClipboardDocumentListIcon,
  HeartIcon,
  UserCircleIcon,
} from "@heroicons/vue/24/outline";
import BaseButton from "~/components/common/BaseButton.vue";

type ProfileSectionKey = "info" | "orders" | "wishlist";

const props = withDefaults(
  defineProps<{
    activeSection: ProfileSectionKey;
    compactMobile?: boolean;
  }>(),
  {
    compactMobile: false,
  },
);

const globalStore = useGlobalStore();
const { logout } = useAuth();

const navigationItems = [
  {
    key: "info" as const,
    label: "ანგარიშის ინფორმაცია",
    shortLabel: "ანგარიში",
    to: "/profile",
    icon: UserCircleIcon,
  },
  {
    key: "orders" as const,
    label: "ჩემი შეკვეთები",
    shortLabel: "შეკვეთები",
    to: "/profile/orders",
    icon: ClipboardDocumentListIcon,
  },
  {
    key: "wishlist" as const,
    label: "სურვილების სია",
    shortLabel: "სურვილები",
    to: "/wishlist",
    icon: HeartIcon,
  },
];

const displayName = computed(() => {
  if (!globalStore.authResolved) return "";

  const email = String(globalStore.currentUser?.email || "").trim();
  const username = String(globalStore.currentUser?.username || "").trim();

  if (email) return email;
  if (username) return username;
  return "FlexDrive";
});

const displayInitial = computed(() =>
  displayName.value.charAt(0).toUpperCase() || "A",
);

const handleLogout = async () => {
  await logout();
};
</script>

<template>
  <section
    :class="[
      'w-full min-w-0 border border-border-default bg-surface shadow-[0_24px_60px_-38px_var(--shadow-color)]',
      compactMobile ? 'rounded-[22px] p-2.5 sm:rounded-[28px] sm:p-5' : 'rounded-[28px] p-5',
    ]"
  >
    <div
      :class="[
        'rounded-[22px] border border-border-default bg-surface-2 shadow-[0_20px_40px_-36px_var(--shadow-color)]',
        compactMobile ? 'hidden p-3 sm:block sm:p-4' : 'p-4',
      ]"
    >
      <div class="flex items-center gap-3">
        <span
          class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-accent-primary/25 bg-accent-primary/10 text-lg font-extrabold text-accent-primary"
        >
          {{ displayInitial }}
        </span>

        <div class="min-w-0 flex-1">
          <p
            class="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-primary"
          >
            პირადი სივრცე
          </p>

          <p
            v-if="globalStore.authResolved"
            class="mt-1 truncate text-sm font-semibold text-text-primary"
          >
            {{ displayName }}
          </p>
          <div
            v-else
            class="mt-2 h-4 w-full animate-pulse rounded-full bg-surface"
          />
        </div>
      </div>
    </div>

    <div
      v-if="compactMobile"
      class="flex items-center gap-2 rounded-[16px] border border-border-default bg-surface-2 px-2.5 py-2 shadow-[0_16px_34px_-32px_var(--shadow-color)] sm:hidden"
    >
      <span
        class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] border border-accent-primary/25 bg-accent-primary/10 text-sm font-extrabold text-accent-primary"
      >
        {{ displayInitial }}
      </span>

      <div class="min-w-0 flex-1">
        <p
          class="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-primary"
        >
          პირადი სივრცე
        </p>
        <p
          v-if="globalStore.authResolved"
          class="mt-0.5 truncate text-xs font-semibold text-text-primary"
        >
          {{ displayName }}
        </p>
        <div
          v-else
          class="mt-1.5 h-3 w-full animate-pulse rounded-full bg-surface"
        />
      </div>

      <button
        type="button"
        class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[13px] border border-border-default bg-surface px-2 text-xs font-semibold text-text-secondary transition-colors duration-200 hover:border-accent-primary/30 hover:text-text-primary"
        aria-label="გასვლა"
        @click="handleLogout"
      >
        <ArrowRightOnRectangleIcon class="h-4 w-4" aria-hidden="true" />
        <span>გასვლა</span>
      </button>
    </div>

    <nav
      :class="
        compactMobile
          ? 'mt-2 grid grid-cols-3 gap-1.5 sm:mt-4 sm:block sm:space-y-2'
          : 'mt-4 space-y-2'
      "
      aria-label="Profile navigation"
    >
      <NuxtLink
        v-for="item in navigationItems"
        :key="item.key"
        :to="item.to"
        :aria-current="item.key === props.activeSection ? 'page' : undefined"
        :class="[
          'flex min-w-0 items-center border font-semibold transition-colors duration-200',
          compactMobile
            ? 'justify-center gap-1.5 rounded-[14px] px-1.5 py-2 text-[11px] leading-4 sm:justify-start sm:gap-3 sm:rounded-[18px] sm:px-4 sm:py-3 sm:text-sm'
            : 'gap-3 rounded-[18px] px-4 py-3 text-sm',
          item.key === props.activeSection
            ? 'border-accent-primary/30 bg-accent-primary/10 text-accent-primary'
            : 'border-border-default bg-transparent text-text-secondary hover:border-accent-primary/30 hover:bg-surface-2 hover:text-text-primary',
        ]"
      >
        <component
          :is="item.icon"
          :class="compactMobile ? 'h-4 w-4 shrink-0 sm:h-5 sm:w-5' : 'h-5 w-5 shrink-0'"
          aria-hidden="true"
        />
        <span v-if="compactMobile" class="truncate leading-4 sm:hidden">
          {{ item.shortLabel }}
        </span>
        <span :class="compactMobile ? 'hidden truncate sm:inline' : 'truncate'">
          {{ item.label }}
        </span>
      </NuxtLink>
    </nav>

    <div
      :class="
        compactMobile
          ? 'hidden border-t border-border-default sm:mt-5 sm:block sm:pt-4'
          : 'mt-5 border-t border-border-default pt-4'
      "
    >
      <BaseButton
        type="button"
        variant="secondary"
        full-width
        :class="[
          'justify-start gap-3 rounded-[18px] text-sm font-semibold',
          compactMobile ? 'px-3 py-2.5 sm:px-4 sm:py-3' : 'px-4 py-3',
        ]"
        @click="handleLogout"
      >
        <template #left>
          <ArrowRightOnRectangleIcon class="h-5 w-5" aria-hidden="true" />
        </template>
        გასვლა
      </BaseButton>
    </div>
  </section>
</template>
