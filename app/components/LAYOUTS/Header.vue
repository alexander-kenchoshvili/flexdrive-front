<script setup lang="ts">
import { MoonIcon, SunIcon } from "@heroicons/vue/24/outline";

const route = useRoute();
const menuStore = useMenu();
const globalStore = useGlobalStore();
const cartStore = useCartStore();
const wishlistStore = useWishlistStore();
const { logout } = useAuth();
const { isDark, toggleTheme } = useTheme();

const isMobileMenuOpen = ref(false);
const headerSearchRef = ref<{ openMobileSheet: () => Promise<void> } | null>(
  null,
);

const menuItems = computed(() =>
  menuStore.menu.filter((item) => item.show_in_menu !== false),
);

const inlineMenuItems = computed(() =>
  menuItems.value
    .filter((item) => !["/login", "/register"].includes(item.final_url))
    .slice(0, 4),
);

const isAuthResolved = computed(() => globalStore.authResolved);
const isAuthenticated = computed(() => Boolean(globalStore.currentUser));
const showAuthenticatedAuthUi = computed(
  () => isAuthResolved.value && isAuthenticated.value,
);
const showGuestAuthUi = computed(
  () => isAuthResolved.value && !isAuthenticated.value,
);

const themeToggleLabel = computed(() =>
  isDark.value ? "Switch to light mode" : "Switch to dark mode",
);

const cartItemCount = computed(() => cartStore.itemCount);
const wishlistItemCount = computed(() => wishlistStore.count);
const wishlistTarget = computed(() => "/wishlist");

const runStoreLoad = async (loader: () => Promise<unknown>) => {
  try {
    await loader();
  } catch {
    // Store-level error state is enough for the UI.
  }
};

const ensureCommerceStateLoaded = async () => {
  await runStoreLoad(() => cartStore.ensureCartLoaded());
  await runStoreLoad(() => wishlistStore.ensureWishlistLoaded());
};

const refreshCommerceState = async () => {
  await runStoreLoad(() => cartStore.refreshCart());
  await runStoreLoad(() => wishlistStore.refreshWishlist());
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const handleLogout = async () => {
  closeMobileMenu();
  await logout();
};

const openMobileSearch = () => {
  closeMobileMenu();
  void headerSearchRef.value?.openMobileSheet();
};

watch(
  () => route.fullPath,
  () => {
    closeMobileMenu();
  },
);

watch(
  () => globalStore.currentUser?.id || null,
  async (nextUserId, previousUserId) => {
    if (nextUserId && nextUserId !== previousUserId) {
      await refreshCommerceState();
      return;
    }

    if (!nextUserId && previousUserId) {
      cartStore.reset();
      wishlistStore.reset();
      await refreshCommerceState();
    }
  },
);

watch(
  () => globalStore.authResolved,
  async (isResolved) => {
    if (!isResolved) return;
    await ensureCommerceStateLoaded();
  },
);

watch(isMobileMenuOpen, (isOpen) => {
  if (!import.meta.client) return;
  document.body.style.overflow = isOpen ? "hidden" : "";
});

onMounted(() => {
  if (!menuStore.menu.length) {
    void menuStore.fetchMenu();
  }

  if (globalStore.authResolved) {
    void ensureCommerceStateLoaded();
  }
});

onBeforeUnmount(() => {
  if (!import.meta.client) return;
  document.body.style.overflow = "";
});
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b border-header-border bg-header-bg shadow-[0_6px_18px_rgba(2,6,23,0.08)] dark:shadow-[0_8px_22px_rgba(0,0,0,0.32)]"
  >
    <div class="container-fluid px-4 py-3">
      <div class="mb-3 flex items-center gap-3">
        <NuxtLink
          to="/"
          class="site-logo-link mr-auto inline-flex items-center gap-2 no-underline sm:mr-0"
        >
          <BaseIcon
            name="logo"
            size="var(--header-logo-size)"
            class="text-accent-primary"
          />
          <span class="site-logo-text font-bold leading-none text-text-primary">
            Auto<span class="text-accent-primary">Mate</span>
          </span>
        </NuxtLink>

        <nav class="hidden items-center lg:ml-8 lg:flex xl:ml-10">
          <ul class="flex items-center gap-4">
            <li v-for="item in inlineMenuItems" :key="item.id">
              <NuxtLink
                :to="item.final_url"
                class="inline-flex min-h-9 items-center px-1 py-2 text-[14px] font-semibold text-text-secondary transition-colors duration-200 hover:text-accent-primary upper"
              >
                {{ item.name }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <div class="hidden min-w-0 flex-1 items-center gap-2 sm:flex lg:hidden">
          <template v-if="showAuthenticatedAuthUi">
            <BaseButton
              as="nuxt-link"
              to="/profile"
              variant="primary"
              class="min-w-0 flex-1 px-3 py-2 text-[13px] truncate upper"
            >
              ჩემი კაბინეტი
            </BaseButton>
            <BaseButton
              type="button"
              variant="secondary"
              class="min-w-0 flex-1 bg-transparent px-3 py-2 text-[13px] truncate hover:bg-header-hover upper"
              @click="handleLogout"
            >
              გამოსვლა
            </BaseButton>
          </template>
          <template v-else-if="showGuestAuthUi">
            <BaseButton
              as="nuxt-link"
              to="/login"
              variant="primary"
              class="min-w-0 flex-1 px-3 py-2 text-[13px] truncate upper"
            >
              შესვლა
            </BaseButton>
            <BaseButton
              as="nuxt-link"
              to="/register"
              variant="secondary"
              class="min-w-0 flex-1 bg-transparent px-3 py-2 text-[13px] truncate hover:bg-header-hover upper"
            >
              რეგისტრაცია
            </BaseButton>
          </template>
          <div v-else class="flex min-w-0 flex-1 gap-2">
            <div
              class="h-[42px] flex-1 animate-pulse rounded-md border border-header-border bg-header-hover/60"
            />
            <div
              class="h-[42px] flex-1 animate-pulse rounded-md border border-header-border bg-header-hover/60"
            />
          </div>
        </div>

        <div class="ml-auto hidden items-center gap-2 lg:flex">
          <template v-if="showAuthenticatedAuthUi">
            <BaseButton
              as="nuxt-link"
              to="/profile"
              variant="primary"
              class="px-3 py-2 text-[13px] whitespace-nowrap upper"
            >
              ჩემი კაბინეტი
            </BaseButton>
            <BaseButton
              type="button"
              variant="secondary"
              class="bg-transparent px-3 py-2 text-[13px] whitespace-nowrap hover:bg-header-hover upper"
              @click="handleLogout"
            >
              გამოსვლა
            </BaseButton>
          </template>
          <template v-else-if="showGuestAuthUi">
            <BaseButton
              as="nuxt-link"
              to="/login"
              variant="primary"
              class="px-3 py-2 text-[13px] whitespace-nowrap upper"
            >
              შესვლა
            </BaseButton>
            <BaseButton
              as="nuxt-link"
              to="/register"
              variant="secondary"
              class="bg-transparent px-3 py-2 text-[13px] whitespace-nowrap hover:bg-header-hover upper"
            >
              რეგისტრაცია
            </BaseButton>
          </template>
          <div v-else class="flex items-center gap-2">
            <div
              class="h-[42px] w-[138px] animate-pulse rounded-md border border-header-border bg-header-hover/60"
            />
            <div
              class="h-[42px] w-[122px] animate-pulse rounded-md border border-header-border bg-header-hover/60"
            />
          </div>
        </div>

        <div class="ml-auto flex items-center gap-3 lg:ml-0">
          <NuxtLink
            v-if="wishlistTarget"
            :to="wishlistTarget"
            aria-label="Wishlist"
            class="relative inline-flex h-9 w-9 items-center justify-center rounded-[6px] border border-header-border bg-transparent text-text-secondary transition-colors duration-200 hover:border-accent-primary hover:bg-header-hover hover:text-accent-primary"
          >
            <BaseIcon name="wishlist" :size="20" />
            <span
              v-if="wishlistStore.initialized && wishlistItemCount > 0"
              class="absolute -right-1.5 -top-1.5 inline-flex min-w-[18px] items-center justify-center rounded-[10px] bg-accent-primary px-[5px] py-[2px] text-[10px] font-bold leading-none text-text-invert"
            >
              {{ wishlistItemCount }}
            </span>
          </NuxtLink>
          <span
            v-else
            aria-hidden="true"
            class="relative inline-flex h-9 w-9 items-center justify-center rounded-[6px] border border-header-border bg-transparent text-text-secondary opacity-60"
          >
            <BaseIcon name="wishlist" :size="20" />
          </span>

          <NuxtLink
            to="/cart"
            aria-label="კალათა"
            class="relative inline-flex h-9 w-9 items-center justify-center rounded-[6px] border border-header-border bg-transparent text-text-secondary transition-colors duration-200 hover:border-accent-primary hover:bg-header-hover hover:text-accent-primary"
          >
            <BaseIcon name="cart" :size="20" />
            <span
              v-if="cartStore.initialized && cartItemCount > 0"
              class="absolute -right-1.5 -top-1.5 inline-flex min-w-[18px] items-center justify-center rounded-[10px] bg-accent-primary px-[5px] py-[2px] text-[10px] font-bold leading-none text-text-invert"
            >
              {{ cartItemCount }}
            </span>
          </NuxtLink>

          <button
            type="button"
            aria-label="ძებნა"
            class="inline-flex h-9 w-9 items-center justify-center rounded-[6px] border border-header-border bg-transparent text-text-secondary transition-colors duration-200 hover:border-accent-primary hover:bg-header-hover hover:text-accent-primary sm:hidden"
            @click="openMobileSearch"
          >
            <BaseIcon name="search" :size="20" />
          </button>

          <button
            type="button"
            :aria-label="themeToggleLabel"
            :title="themeToggleLabel"
            :aria-pressed="isDark"
            @click="toggleTheme"
            class="hidden h-9 w-9 items-center justify-center rounded-[6px] border border-header-border bg-transparent text-text-secondary transition-colors duration-200 hover:border-accent-primary hover:bg-header-hover hover:text-accent-primary sm:inline-flex"
          >
            <Transition name="theme-icon" mode="out-in">
              <component
                :is="isDark ? MoonIcon : SunIcon"
                :key="isDark ? 'moon' : 'sun'"
                class="h-5 w-5"
                aria-hidden="true"
              />
            </Transition>
          </button>

          <button
            type="button"
            aria-label="მენიუ"
            :aria-expanded="isMobileMenuOpen"
            aria-controls="mobile-nav-drawer"
            @click="toggleMobileMenu"
            class="inline-flex h-9 w-9 items-center justify-center rounded-[6px] border border-header-border bg-transparent text-text-secondary transition-colors duration-200 hover:border-accent-primary hover:bg-header-hover hover:text-accent-primary lg:hidden"
          >
            <BaseIcon name="burger" :size="20" />
          </button>
        </div>
      </div>

      <div class="mb-3 flex items-center gap-3 sm:hidden">
        <template v-if="showAuthenticatedAuthUi">
          <BaseButton
            as="nuxt-link"
            to="/profile"
            variant="primary"
            class="min-w-0 whitespace-nowrap px-6 py-2.5 text-[14px] upper max-[420px]:px-4 max-[420px]:text-[13px] max-[380px]:px-3 max-[380px]:text-[12px]"
            fullWidth
          >
            ჩემი კაბინეტი
          </BaseButton>
          <BaseButton
            type="button"
            variant="secondary"
            class="min-w-0 whitespace-nowrap bg-transparent px-6 py-2.5 text-[14px] hover:bg-header-hover upper max-[420px]:px-4 max-[420px]:text-[13px] max-[380px]:px-3 max-[380px]:text-[12px]"
            fullWidth
            @click="handleLogout"
          >
            გამოსვლა
          </BaseButton>
        </template>
        <template v-else-if="showGuestAuthUi">
          <BaseButton
            as="nuxt-link"
            to="/login"
            variant="primary"
            class="min-w-0 whitespace-nowrap px-6 py-2.5 text-[14px] upper max-[420px]:px-4 max-[420px]:text-[13px] max-[380px]:px-3 max-[380px]:text-[12px]"
            fullWidth
          >
            შესვლა
          </BaseButton>
          <BaseButton
            as="nuxt-link"
            to="/register"
            variant="secondary"
            class="min-w-0 whitespace-nowrap bg-transparent px-6 py-2.5 text-[14px] hover:bg-header-hover upper max-[420px]:px-4 max-[420px]:text-[13px] max-[380px]:px-3 max-[380px]:text-[12px]"
            fullWidth
          >
            რეგისტრაცია
          </BaseButton>
        </template>
        <template v-else>
          <div
            class="h-[46px] flex-1 animate-pulse rounded-md border border-header-border bg-header-hover/60"
          />
          <div
            class="h-[46px] flex-1 animate-pulse rounded-md border border-header-border bg-header-hover/60"
          />
        </template>
      </div>

      <HeaderSearch
        ref="headerSearchRef"
        :hide-mobile-trigger="true"
        @open-mobile-search="closeMobileMenu"
      />
    </div>
  </header>

  <transition name="mobile-menu-fade">
    <div
      v-if="isMobileMenuOpen"
      class="fixed inset-0 z-50 bg-black/40"
      @click="closeMobileMenu"
    >
      <aside
        id="mobile-nav-drawer"
        class="absolute left-0 top-0 h-full w-[86%] max-w-[340px] border-r border-header-border bg-header-bg shadow-[0_10px_30px_rgba(2,6,23,0.18)]"
        @click.stop
      >
        <div
          class="flex items-center justify-between border-b border-header-border px-4 py-4"
        >
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-2 no-underline"
            @click="closeMobileMenu"
          >
            <BaseIcon name="logo" :size="28" class="text-accent-primary" />
            <span class="text-[17px] font-bold leading-none text-text-primary">
              Auto<span class="text-accent-primary">Mate</span>
            </span>
          </NuxtLink>

          <div class="flex items-center gap-2">
            <button
              type="button"
              :aria-label="themeToggleLabel"
              :title="themeToggleLabel"
              :aria-pressed="isDark"
              @click="toggleTheme"
              class="inline-flex h-9 w-9 items-center justify-center rounded-[6px] border border-header-border text-text-secondary transition-colors duration-200 hover:border-accent-primary hover:bg-header-hover hover:text-accent-primary sm:hidden"
            >
              <Transition name="theme-icon" mode="out-in">
                <component
                  :is="isDark ? MoonIcon : SunIcon"
                  :key="isDark ? 'mobile-moon' : 'mobile-sun'"
                  class="h-5 w-5"
                  aria-hidden="true"
                />
              </Transition>
            </button>

            <button
              type="button"
              aria-label="მენიუს დახურვა"
              @click="closeMobileMenu"
              class="inline-flex h-9 w-9 items-center justify-center rounded-[6px] border border-header-border text-text-secondary transition-colors duration-200 hover:border-accent-primary hover:bg-header-hover hover:text-accent-primary"
            >
              <span class="text-xl leading-none">×</span>
            </button>
          </div>
        </div>

        <nav class="px-4 py-4">
          <ul class="flex flex-col gap-2">
            <li v-for="item in menuItems" :key="item.id">
              <NuxtLink
                :to="item.final_url"
                class="block rounded-md border border-header-border px-3 py-2.5 text-[15px] font-semibold text-text-primary transition-colors duration-200 hover:border-accent-primary hover:bg-header-hover hover:text-accent-primary upper"
                @click="closeMobileMenu"
              >
                {{ item.name }}
              </NuxtLink>
            </li>
            <li
              v-if="menuItems.length === 0"
              class="px-1 py-2 text-sm text-text-muted"
            >
              მენიუ ცარიელია
            </li>
          </ul>
        </nav>
      </aside>
    </div>
  </transition>
</template>

<style scoped>
.site-logo-link {
  --header-logo-size: 32px;
}

.site-logo-text {
  font-size: 18px;
}

@media (max-width: 399px) {
  .site-logo-link {
    --header-logo-size: 24px;
  }

  .site-logo-text {
    font-size: 14px;
  }
}

.mobile-menu-fade-enter-active,
.mobile-menu-fade-leave-active {
  transition: opacity 0.2s ease;
}

.mobile-menu-fade-enter-active aside,
.mobile-menu-fade-leave-active aside {
  transition: transform 0.22s ease;
}

.mobile-menu-fade-enter-from,
.mobile-menu-fade-leave-to {
  opacity: 0;
}

.mobile-menu-fade-enter-from aside,
.mobile-menu-fade-leave-to aside {
  transform: translateX(-100%);
}

.mobile-menu-fade-enter-to aside,
.mobile-menu-fade-leave-from aside {
  transform: translateX(0);
}

.theme-icon-enter-active,
.theme-icon-leave-active {
  transition:
    transform 0.22s ease,
    opacity 0.18s ease;
}

.theme-icon-enter-from {
  opacity: 0;
  transform: rotate(-80deg) scale(0.72);
}

.theme-icon-leave-to {
  opacity: 0;
  transform: rotate(80deg) scale(0.72);
}
</style>
