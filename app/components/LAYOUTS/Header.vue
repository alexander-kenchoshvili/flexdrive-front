<script setup lang="ts">
import { MoonIcon, SunIcon, UserCircleIcon } from "@heroicons/vue/24/outline";
import { useMediaQuery } from "@vueuse/core";

const route = useRoute();
const menuStore = useMenu();
const globalStore = useGlobalStore();
const cartStore = useCartStore();
const wishlistStore = useWishlistStore();
const { logout } = useAuth();
const { isDark, toggleTheme } = useTheme();

const isMobileMenuOpen = ref(false);
const isAccountDialogOpen = ref(false);
const shouldUseHorizontalLogo = useMediaQuery("(max-width: 767px)");
const desktopSearchRef = ref<{ openMobileSheet: () => Promise<void> } | null>(
  null,
);
const mobileSearchRef = ref<{ openMobileSheet: () => Promise<void> } | null>(
  null,
);

const menuItems = computed(() =>
  menuStore.menu.filter((item) => item.show_in_menu !== false),
);

const navigationMenuItems = computed(() =>
  menuItems.value.filter(
    (item) => !["/login", "/register"].includes(item.final_url),
  ),
);

const isAuthResolved = computed(() => globalStore.authResolved);
const isAuthenticated = computed(() => Boolean(globalStore.currentUser));
const showAuthenticatedAuthUi = computed(
  () => isAuthResolved.value && isAuthenticated.value,
);

const themeToggleLabel = computed(() =>
  isDark.value ? "ლაით მოუდზე გადასვლა" : "დარქ მოუდზე გადასვლა",
);

const cartItemCount = computed(() => cartStore.itemCount);
const wishlistItemCount = computed(() => wishlistStore.count);
const wishlistTarget = computed(() => "/wishlist");

const accountDisplayName = computed(() => {
  if (!globalStore.authResolved) return "";

  const email = String(globalStore.currentUser?.email || "").trim();
  const username = String(globalStore.currentUser?.username || "").trim();
  const firstName = String(globalStore.currentUser?.first_name || "").trim();
  const lastName = String(globalStore.currentUser?.last_name || "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  if (fullName) return fullName;
  if (email) return email;
  if (username) return username;
  return "FlexDrive";
});

const accountInitial = computed(
  () => accountDisplayName.value.charAt(0).toUpperCase() || "F",
);

const accountButtonLabel = computed(() => {
  if (!isAuthResolved.value) return "ანგარიშის ჩატვირთვა";
  return isAuthenticated.value
    ? "ჩემი ანგარიშის გახსნა"
    : "შესვლა ან რეგისტრაცია";
});

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

const closeAccountDialog = () => {
  isAccountDialogOpen.value = false;
};

const openAccountDialog = () => {
  if (!isAuthResolved.value) return;
  closeMobileMenu();
  isAccountDialogOpen.value = true;
};

const handleLogout = async () => {
  closeMobileMenu();
  closeAccountDialog();
  await logout();
};

const openMobileSearch = () => {
  closeMobileMenu();
  void mobileSearchRef.value?.openMobileSheet();
};

watch(
  () => route.fullPath,
  () => {
    closeMobileMenu();
    closeAccountDialog();
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
    class="sticky top-0 z-40 border-b border-header-border bg-header-bg/95 shadow-[0_10px_28px_-24px_var(--shadow-color)] backdrop-blur-xl"
  >
    <div class="container-fluid px-3 py-3 sm:px-4">
      <div class="flex min-h-[58px] items-center gap-2 sm:gap-3 lg:gap-4">
        <NuxtLink
          to="/"
          class="site-logo-link inline-flex shrink-0 items-center no-underline"
          aria-label="FlexDrive"
        >
          <FlexdriveLogoHorizontal
            v-if="shouldUseHorizontalLogo"
            variant="auto"
            class="site-logo-horizontal"
          />
          <FlexdriveLogo v-else variant="auto" class="site-logo-image" />
        </NuxtLink>

        <div class="hidden min-w-0 flex-1 md:block lg:mx-4 xl:mx-6">
          <HeaderSearch
            ref="desktopSearchRef"
            :hide-mobile-trigger="true"
            @open-mobile-search="closeMobileMenu"
          />
        </div>

        <div
          class="header-action-cluster ml-auto flex shrink-0 items-center gap-2.5 sm:gap-3 md:gap-2 lg:gap-2"
        >
          <button
            type="button"
            :aria-label="accountButtonLabel"
            :aria-expanded="isAccountDialogOpen"
            aria-controls="header-account-dialog"
            :disabled="!isAuthResolved"
            class="header-icon-button relative disabled:cursor-wait disabled:opacity-60"
            @click="openAccountDialog"
          >
            <span
              v-if="showAuthenticatedAuthUi"
              class="inline-flex h-6 w-6 items-center justify-center rounded-[8px] bg-accent-primary text-[12px] font-extrabold text-text-invert"
            >
              {{ accountInitial }}
            </span>
            <UserCircleIcon v-else class="h-5 w-5" aria-hidden="true" />
            <span
              v-if="showAuthenticatedAuthUi"
              class="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-header-bg bg-success"
              aria-hidden="true"
            />
          </button>

          <NuxtLink
            v-if="wishlistTarget"
            :to="wishlistTarget"
            aria-label="Wishlist"
            class="header-icon-button relative"
          >
            <BaseIcon name="wishlist" :size="20" />
            <span
              v-if="wishlistStore.initialized && wishlistItemCount > 0"
              class="header-count-badge"
            >
              {{ wishlistItemCount }}
            </span>
          </NuxtLink>
          <span
            v-else
            aria-hidden="true"
            class="header-icon-button relative opacity-60"
          >
            <BaseIcon name="wishlist" :size="20" />
          </span>

          <NuxtLink to="/cart" aria-label="კალათა" class="header-icon-button relative">
            <BaseIcon name="cart" :size="20" />
            <span
              v-if="cartStore.initialized && cartItemCount > 0"
              class="header-count-badge"
            >
              {{ cartItemCount }}
            </span>
          </NuxtLink>

          <button
            type="button"
            :aria-label="themeToggleLabel"
            :title="themeToggleLabel"
            :aria-pressed="isDark"
            class="header-icon-button header-theme-button"
            @click="toggleTheme"
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
            class="header-icon-button header-menu-button"
            @click="toggleMobileMenu"
          >
            <BaseIcon name="burger" :size="20" />
          </button>
        </div>
      </div>

      <div class="mt-3 md:hidden">
        <HeaderSearch
          ref="mobileSearchRef"
          :hide-mobile-trigger="false"
          @open-mobile-search="closeMobileMenu"
        />
      </div>

      <nav
        v-if="navigationMenuItems.length"
        class="mt-3 hidden border-t border-header-border/80 pt-2 lg:block"
        aria-label="მთავარი ნავიგაცია"
      >
        <ul class="flex min-h-10 items-center gap-1 overflow-x-auto">
          <li v-for="item in navigationMenuItems" :key="item.id" class="shrink-0">
            <NuxtLink
              :to="item.final_url"
              class="inline-flex min-h-10 items-center rounded-[8px] px-3 text-[14px] font-semibold text-text-secondary transition-colors duration-200 hover:bg-header-hover hover:text-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary upper"
            >
              {{ item.name }}
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </div>
  </header>

  <HeaderAccountDialog
    :show="isAccountDialogOpen"
    :is-resolved="isAuthResolved"
    :is-authenticated="isAuthenticated"
    :display-name="accountDisplayName"
    :display-initial="accountInitial"
    @close="closeAccountDialog"
    @logout="handleLogout"
  />

  <transition name="mobile-menu-fade">
    <div
      v-if="isMobileMenuOpen"
      class="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]"
      @click="closeMobileMenu"
    >
      <aside
        id="mobile-nav-drawer"
        class="absolute left-0 top-0 flex h-full w-[86%] max-w-[360px] flex-col border-r border-header-border bg-header-bg shadow-[0_24px_70px_-36px_rgba(2,6,23,0.45)]"
        @click.stop
      >
        <div
          class="flex items-center justify-between border-b border-header-border px-4 py-4"
        >
          <NuxtLink
            to="/"
            class="inline-flex shrink-0 items-center no-underline"
            aria-label="FlexDrive"
            @click="closeMobileMenu"
          >
            <FlexdriveLogo variant="auto" class="mobile-drawer-logo" />
          </NuxtLink>

          <button
            type="button"
            aria-label="მენიუს დახურვა"
            class="header-icon-button"
            @click="closeMobileMenu"
          >
            <span class="text-xl leading-none">×</span>
          </button>
        </div>

        <div class="border-b border-header-border px-4 py-4 sm:hidden">
          <button
            type="button"
            class="flex min-h-[52px] w-full items-center gap-3 rounded-[14px] border border-header-border bg-header-surface px-3 text-left text-text-secondary transition-colors duration-200 hover:border-accent-primary hover:bg-header-hover hover:text-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
            @click="openMobileSearch"
          >
            <span
              class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-surface text-current"
            >
              <BaseIcon name="search" :size="18" />
            </span>
            <span class="min-w-0">
              <span class="block text-sm font-semibold text-text-primary">
                ძებნა
              </span>
              <span class="mt-0.5 block truncate text-xs text-text-muted">
                ნაწილი, OEM, SKU ან VIN
              </span>
            </span>
          </button>
        </div>

        <div class="border-b border-header-border px-4 py-4 lg:hidden">
          <button
            type="button"
            class="flex min-h-[52px] w-full items-center justify-between gap-3 rounded-[14px] border border-header-border bg-header-surface px-3 text-left text-text-secondary transition-colors duration-200 hover:border-accent-primary hover:bg-header-hover hover:text-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
            :aria-label="themeToggleLabel"
            :aria-pressed="isDark"
            @click="toggleTheme"
          >
            <span class="flex min-w-0 items-center gap-3">
              <span
                class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-surface text-current"
              >
                <Transition name="theme-icon" mode="out-in">
                  <component
                    :is="isDark ? MoonIcon : SunIcon"
                    :key="isDark ? 'drawer-moon' : 'drawer-sun'"
                    class="h-5 w-5"
                    aria-hidden="true"
                  />
                </Transition>
              </span>
              <span class="min-w-0">
                <span class="block text-sm font-semibold text-text-primary">
                  {{ isDark ? "დარქ მოუდი" : "ლაით მოუდი" }}
                </span>
                <span class="mt-0.5 block truncate text-xs text-text-muted">
                  {{ isDark ? "ლაითზე გადასვლა" : "დარქზე გადასვლა" }}
                </span>
              </span>
            </span>
            <span
              class="relative h-6 w-11 shrink-0 rounded-full border border-border-default bg-surface-2 transition-colors duration-200"
              :class="isDark ? 'border-accent-primary bg-accent-primary/20' : ''"
              aria-hidden="true"
            >
              <span
                class="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-accent-primary transition-transform duration-200"
                :class="isDark ? 'translate-x-[22px]' : 'translate-x-1'"
              />
            </span>
          </button>
        </div>

        <nav class="flex-1 overflow-y-auto px-4 py-4" aria-label="Mobile menu">
          <ul class="flex flex-col gap-2">
            <li v-for="item in navigationMenuItems" :key="item.id">
              <NuxtLink
                :to="item.final_url"
                class="block rounded-[12px] border border-header-border px-3 py-3 text-[15px] font-semibold text-text-primary transition-colors duration-200 hover:border-accent-primary hover:bg-header-hover hover:text-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary upper"
                @click="closeMobileMenu"
              >
                {{ item.name }}
              </NuxtLink>
            </li>
            <li
              v-if="navigationMenuItems.length === 0"
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
  min-width: 142px;
}

.site-logo-image {
  display: block;
  height: 62px;
  width: 110px;
}

.site-logo-horizontal {
  display: block;
  height: 40px;
  width: 142px;
}

.mobile-drawer-logo {
  height: 60px;
  width: 106px;
}

@media (min-width: 640px) and (max-width: 767px) {
  .site-logo-link {
    min-width: 154px;
  }

  .site-logo-horizontal {
    height: 44px;
    width: 154px;
  }
}

@media (min-width: 768px) {
  .site-logo-link {
    min-width: 110px;
  }

  .site-logo-image {
    height: 62px;
    width: 110px;
  }

  .site-logo-horizontal {
    display: none;
  }
}

.header-icon-button {
  display: inline-flex;
  height: 40px;
  width: 40px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid var(--header-border);
  background: transparent;
  color: var(--text-secondary);
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease;
}

.header-icon-button:hover {
  border-color: var(--accent-primary);
  background: var(--header-hover);
  color: var(--accent-primary);
}

.header-icon-button:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 2px var(--bg-primary),
    0 0 0 4px var(--focus-ring);
}

.header-count-badge {
  position: absolute;
  right: -6px;
  top: -6px;
  display: inline-flex;
  min-width: 18px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--accent-primary);
  padding: 2px 5px;
  color: var(--text-invert);
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
}

@media (min-width: 1024px) {
  .header-menu-button {
    display: none;
  }
}

@media (max-width: 1023px) {
  .header-theme-button {
    display: none;
  }
}

@media (max-width: 399px) {
  .site-logo-image {
    height: 52px;
    width: 92px;
  }

  .site-logo-link {
    min-width: 130px;
  }

  .site-logo-horizontal {
    height: 38px;
    width: 130px;
  }

  .header-icon-button {
    height: 36px;
    width: 36px;
    border-radius: 9px;
  }
}

@media (max-width: 359px) {
  .site-logo-link {
    min-width: 118px;
  }

  .site-logo-image {
    height: 48px;
    width: 85px;
  }

  .site-logo-horizontal {
    height: 34px;
    width: 118px;
  }

  .header-icon-button {
    height: 34px;
    width: 34px;
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

@media (prefers-reduced-motion: reduce) {
  .mobile-menu-fade-enter-active,
  .mobile-menu-fade-leave-active,
  .mobile-menu-fade-enter-active aside,
  .mobile-menu-fade-leave-active aside,
  .theme-icon-enter-active,
  .theme-icon-leave-active {
    transition: none;
  }
}
</style>
