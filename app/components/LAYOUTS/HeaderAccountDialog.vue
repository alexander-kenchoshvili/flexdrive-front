<script setup lang="ts">
import {
  ArrowRightIcon,
  ArrowRightOnRectangleIcon,
  ClipboardDocumentListIcon,
  HeartIcon,
  UserCircleIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline";
import BaseButton from "~/components/common/BaseButton.vue";

const props = withDefaults(
  defineProps<{
    show: boolean;
    isResolved: boolean;
    isAuthenticated: boolean;
    displayName?: string;
    displayInitial?: string;
  }>(),
  {
    displayName: "",
    displayInitial: "F",
  },
);

const emit = defineEmits<{
  (event: "close"): void;
  (event: "logout"): void;
}>();

const isLocked = useScrollLock(
  typeof window !== "undefined" ? document.body : null,
);

const accountLinks = [
  {
    label: "პირადი კაბინეტი",
    caption: "ანგარიშის ინფორმაცია",
    to: "/profile",
    icon: UserCircleIcon,
  },
  {
    label: "ჩემი შეკვეთები",
    caption: "შეკვეთების ისტორია",
    to: "/profile/orders",
    icon: ClipboardDocumentListIcon,
  },
  {
    label: "სურვილების სია",
    caption: "შენახული პროდუქტები",
    to: "/wishlist",
    icon: HeartIcon,
  },
];

const dialogTitle = computed(() =>
  props.isAuthenticated ? "ჩემი ანგარიში" : "შესვლა FlexDrive-ში",
);

const closeDialog = () => {
  emit("close");
};

watchEffect(() => {
  isLocked.value = props.show;
});

onBeforeUnmount(() => {
  isLocked.value = false;
});
</script>

<template>
  <Teleport to="body">
    <Transition name="account-dialog">
      <div
        v-if="props.show"
        class="fixed inset-0 z-[100] flex items-end justify-center bg-[rgba(2,6,23,0.52)] p-0 backdrop-blur-sm sm:items-center sm:p-4"
        @click.self="closeDialog"
      >
        <section
          id="header-account-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="header-account-dialog-title"
          class="account-dialog-panel w-full max-w-lg rounded-t-[24px] border border-border-default bg-surface p-4 shadow-[0_32px_72px_-44px_var(--shadow-color)] sm:rounded-[24px] sm:p-5"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <p
                class="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-primary"
              >
                FlexDrive
              </p>
              <h2
                id="header-account-dialog-title"
                class="mt-1 text-xl font-extrabold leading-7 text-text-primary"
              >
                {{ dialogTitle }}
              </h2>
            </div>

            <button
              type="button"
              class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-border-default bg-surface-2 text-text-secondary transition-colors duration-200 hover:border-accent-primary hover:bg-accent-soft hover:text-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
              aria-label="დახურვა"
              @click="closeDialog"
            >
              <XMarkIcon class="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div v-if="!props.isResolved" class="mt-5 space-y-3">
            <div
              v-for="index in 3"
              :key="index"
              class="h-14 animate-pulse rounded-[16px] border border-border-default bg-surface-2"
            />
          </div>

          <div v-else-if="!props.isAuthenticated" class="mt-5">
            <div
              class="rounded-[20px] border border-border-default bg-surface-2 p-4"
            >
              <div class="flex items-start gap-3">
                <span
                  class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-accent-primary/25 bg-accent-primary/10 text-accent-primary"
                >
                  <UserCircleIcon class="h-6 w-6" aria-hidden="true" />
                </span>
                <div class="min-w-0">
                  <p class="text-base font-bold text-text-primary">
                    გააგრძელე ანგარიშით
                  </p>
                  <p class="mt-1 text-sm leading-6 text-text-secondary">
                    შეკვეთები, სურვილების სია და კალათა ერთ სივრცეში იქნება.
                  </p>
                </div>
              </div>
            </div>

            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <BaseButton
                as="nuxt-link"
                to="/login"
                full-width
                class="rounded-[14px]"
                @click="closeDialog"
              >
                შესვლა
                <template #right>
                  <ArrowRightIcon class="h-4 w-4" aria-hidden="true" />
                </template>
              </BaseButton>

              <BaseButton
                as="nuxt-link"
                to="/register"
                variant="secondary"
                full-width
                class="rounded-[14px]"
                @click="closeDialog"
              >
                რეგისტრაცია
              </BaseButton>
            </div>
          </div>

          <div v-else class="mt-5">
            <div
              class="rounded-[20px] border border-border-default bg-surface-2 p-4"
            >
              <div class="flex items-center gap-3">
                <span
                  class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-accent-primary/25 bg-accent-primary/10 text-lg font-extrabold text-accent-primary"
                >
                  {{ props.displayInitial }}
                </span>

                <div class="min-w-0 flex-1">
                  <p
                    class="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-primary"
                  >
                    პირადი სივრცე
                  </p>
                  <p class="mt-1 truncate text-sm font-semibold text-text-primary">
                    {{ props.displayName }}
                  </p>
                </div>
              </div>
            </div>

            <nav class="mt-4 grid gap-2" aria-label="Account navigation">
              <NuxtLink
                v-for="item in accountLinks"
                :key="item.to"
                :to="item.to"
                class="group flex min-h-[62px] items-center gap-3 rounded-[16px] border border-border-default bg-surface px-3 text-left transition-colors duration-200 hover:border-accent-primary hover:bg-header-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
                @click="closeDialog"
              >
                <span
                  class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-surface-2 text-text-secondary transition-colors duration-200 group-hover:text-accent-primary"
                >
                  <component :is="item.icon" class="h-5 w-5" aria-hidden="true" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-bold text-text-primary">
                    {{ item.label }}
                  </span>
                  <span class="mt-0.5 block truncate text-xs text-text-muted">
                    {{ item.caption }}
                  </span>
                </span>
                <ArrowRightIcon
                  class="h-4 w-4 shrink-0 text-text-muted transition-colors duration-200 group-hover:text-accent-primary"
                  aria-hidden="true"
                />
              </NuxtLink>
            </nav>

            <div class="mt-4 border-t border-border-default pt-4">
              <BaseButton
                type="button"
                variant="secondary"
                full-width
                class="justify-start rounded-[14px]"
                @click="emit('logout')"
              >
                <template #left>
                  <ArrowRightOnRectangleIcon class="h-5 w-5" aria-hidden="true" />
                </template>
                გამოსვლა
              </BaseButton>
            </div>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.account-dialog-enter-active,
.account-dialog-leave-active {
  transition: opacity 0.22s ease;
}

.account-dialog-enter-from,
.account-dialog-leave-to {
  opacity: 0;
}

.account-dialog-enter-active .account-dialog-panel,
.account-dialog-leave-active .account-dialog-panel {
  transition:
    transform 0.24s ease,
    opacity 0.22s ease;
}

.account-dialog-enter-from .account-dialog-panel,
.account-dialog-leave-to .account-dialog-panel {
  opacity: 0;
  transform: translateY(24px);
}

@media (min-width: 640px) {
  .account-dialog-enter-from .account-dialog-panel,
  .account-dialog-leave-to .account-dialog-panel {
    transform: translateY(12px) scale(0.98);
  }
}

@media (prefers-reduced-motion: reduce) {
  .account-dialog-enter-active,
  .account-dialog-leave-active,
  .account-dialog-enter-active .account-dialog-panel,
  .account-dialog-leave-active .account-dialog-panel {
    transition: none;
  }
}
</style>
