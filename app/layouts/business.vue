<script setup lang="ts">
import { ArrowPathIcon, ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon, SunIcon, MoonIcon, ShieldCheckIcon, HomeIcon, ChartBarIcon, BanknotesIcon, UsersIcon, MegaphoneIcon, CubeIcon, ArrowUpRightIcon } from "@heroicons/vue/24/outline";
import { useMediaQuery } from "@vueuse/core";
import { BUSINESS_SECTIONS } from "~/utils/businessRouting";

const route = useRoute();
const router = useRouter();
const { user, logout } = useBusinessAuth();
const { isDark, toggleTheme } = useTheme();
// This branch controls whether NuxtPage can render. Nuxt's useRoute waits for
// that render, so use the committed router destination to avoid a logout deadlock.
const isLogin = computed(() => router.currentRoute.value.path.replace(/\/$/, "") === "/business/login");
const current = computed(() => BUSINESS_SECTIONS.find((item) => item.path === route.path.replace(/\/$/, "")) || BUSINESS_SECTIONS[0]);
const icons = { overview: HomeIcon, sales: ChartBarIcon, finance: BanknotesIcon, users: UsersIcon, marketing: MegaphoneIcon, operations: CubeIcon };
const mobile = useMediaQuery("(max-width: 1023px)");
const menuOpen = ref(false);
const menuButton = ref<HTMLButtonElement | null>(null);
const sidebar = ref<HTMLElement | null>(null);
const signingOut = ref(false);
const logoutError = ref("");
let previousOverflow = "";
useHead({ meta: [{ name: "referrer", content: "no-referrer" }] });

const closeMenu = () => { menuOpen.value = false; if (mobile.value) menuButton.value?.focus(); };
watch(menuOpen, async (open) => {
  if (open && mobile.value) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    await nextTick();
    sidebar.value?.querySelector<HTMLButtonElement>("[data-business-menu-close]")?.focus();
  } else if (import.meta.client) { document.body.style.overflow = previousOverflow; }
});
watch(() => route.path, closeMenu);
watch(mobile, (value) => { if (!value) closeMenu(); });
onBeforeUnmount(() => { if (import.meta.client && menuOpen.value) document.body.style.overflow = previousOverflow; });

const trapMenuFocus = (event: KeyboardEvent) => {
  if (!menuOpen.value || !mobile.value || event.key !== "Tab") return;
  const items = Array.from(sidebar.value?.querySelectorAll<HTMLElement>("a[href],button:not([disabled])") || []).filter((item) => item.getClientRects().length);
  const first = items[0]; const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
};
const signOut = async () => {
  if (signingOut.value) return;
  signingOut.value = true; logoutError.value = "";
  try { await logout(); await navigateTo("/business/login", { replace: true }); }
  catch { logoutError.value = "გამოსვლა ვერ დასრულდა. სცადეთ ხელახლა."; }
  finally { signingOut.value = false; }
};
const refreshPage = () => window.location.reload();
</script>

<template>
  <div class="min-h-screen bg-bg-primary font-sans text-sm leading-relaxed text-text-primary" @keydown.esc="closeMenu">
    <template v-if="isLogin">
      <header class="mx-auto flex max-w-[1360px] items-center justify-between gap-4 px-5 py-4 md:px-6 md:py-5 lg:px-10 lg:py-7">
        <a href="/" aria-label="FlexDrive — მაღაზიაში დაბრუნება">
          <NewFlexdriveLogoHorizontal class="block h-auto w-[150px] md:w-[175px]" variant="auto" />
        </a>
        <div class="flex shrink-0 items-center gap-0.5 md:gap-1.5">
          <button class="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-transparent text-text-secondary hover:bg-surface-3" type="button" :aria-label="isDark ? 'ღია თემაზე გადართვა' : 'მუქ თემაზე გადართვა'" @click="toggleTheme">
            <component :is="isDark ? SunIcon : MoonIcon" class="h-5 w-5 shrink-0" aria-hidden="true" />
          </button>
          <a href="/" class="inline-flex min-h-[44px] items-center gap-2 p-2 text-[13px] font-semibold text-text-secondary hover:text-accent-primary">
            მაღაზია <ArrowUpRightIcon class="h-[17px] w-[17px] shrink-0" aria-hidden="true" />
          </a>
        </div>
      </header>
      <main><slot /></main>
    </template>
    <div v-else-if="user" class="grid min-h-screen grid-cols-[minmax(0,1fr)] lg:grid-cols-[248px_minmax(0,1fr)]">
      <a class="fixed -top-20 left-4 z-[60] rounded-lg bg-surface px-4 py-3 text-accent-primary focus:top-4" href="#business-main">შინაარსზე გადასვლა</a>
      <button v-if="menuOpen && mobile" class="fixed inset-0 z-20 bg-black/50 lg:hidden" type="button" aria-label="მენიუს დახურვა" tabindex="-1" @click="closeMenu" />
      <aside
        id="business-navigation"
        ref="sidebar"
        class="fixed left-0 top-0 z-30 flex h-[100dvh] w-[min(300px,calc(100vw_-_48px))] flex-col overflow-y-auto bg-footer-bg px-[18px] pb-[18px] pt-8 text-footer-text-primary transition-[transform,visibility] duration-200 motion-reduce:transition-none lg:sticky lg:visible lg:h-screen lg:w-auto lg:translate-x-0"
        :class="menuOpen ? 'visible translate-x-0' : 'invisible -translate-x-full'"
        :inert="mobile && !menuOpen"
        :role="mobile && menuOpen ? 'dialog' : undefined"
        :aria-modal="mobile && menuOpen ? true : undefined"
        aria-label="ბიზნესპანელის ნავიგაცია"
        @keydown="trapMenuFocus"
      >
        <div class="flex items-center justify-between px-3">
          <NewFlexdriveLogoHorizontal class="block h-auto w-[175px]" variant="on-dark" />
          <button type="button" data-business-menu-close class="inline-flex h-11 w-9 items-center justify-center rounded-lg bg-transparent text-footer-text-secondary hover:bg-footer-hover lg:hidden" aria-label="მენიუს დახურვა" @click="closeMenu">
            <XMarkIcon class="h-5 w-5 shrink-0" aria-hidden="true" />
          </button>
        </div>
        <div class="mx-3 mb-[38px] mt-[17px] flex items-center gap-2 text-xs leading-[18px] text-footer-text-muted"><span class="h-1.5 w-1.5 rounded-full bg-brand-primary" /> ბიზნესის პანელი</div>
        <div class="mb-3 px-3 text-[11px] font-bold text-footer-text-muted">საქმიანობა</div>
        <nav>
          <NuxtLink
            v-for="item in BUSINESS_SECTIONS"
            :key="item.key"
            :to="typeof route.query.start === 'string' && typeof route.query.end === 'string' ? { path: item.path, query: { start: route.query.start, end: route.query.end } } : item.path"
            class="mb-[5px] flex min-h-[48px] items-center gap-3 rounded-lg p-3 text-[13px] font-semibold transition-colors duration-150 hover:bg-footer-hover hover:text-footer-text-primary motion-reduce:transition-none"
            :class="current.key === item.key ? 'bg-footer-hover text-footer-text-primary shadow-[inset_3px_0_0_var(--brand-primary)]' : 'text-footer-text-secondary'"
            :aria-current="current.key === item.key ? 'page' : undefined"
          >
            <component :is="icons[item.key]" class="h-5 w-5 shrink-0" :class="current.key === item.key ? 'text-brand-primary' : ''" aria-hidden="true" />
            <span>{{ item.label }}</span>
          </NuxtLink>
        </nav>
        <div class="mt-auto pt-12">
          <a href="/" class="mb-[5px] flex min-h-[48px] items-center gap-3 rounded-lg p-3 text-[13px] font-semibold text-footer-text-secondary hover:bg-footer-hover hover:text-footer-text-primary">
            <ArrowUpRightIcon class="h-5 w-5 shrink-0" aria-hidden="true" /><span>მაღაზიაში დაბრუნება</span>
          </a>
          <div class="mt-5 flex min-w-0 items-center gap-2.5 border-t border-footer-border px-2 pt-[22px]">
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-footer-hover text-xs font-semibold text-footer-text-primary" aria-hidden="true">{{ user.username.slice(0, 2).toUpperCase() }}</span>
            <div class="min-w-0 flex-1">
              <strong class="block text-xs font-semibold [overflow-wrap:anywhere]">{{ user.username }}</strong>
              <p class="mt-[3px] text-[11px] text-footer-text-muted">ბიზნესპანელის წვდომა</p>
            </div>
            <ShieldCheckIcon class="h-[17px] w-[17px] shrink-0 text-footer-text-muted" aria-label="ავტორიზებული ანგარიში" />
          </div>
        </div>
      </aside>
      <div class="min-w-0" :inert="mobile && menuOpen">
        <header class="flex min-h-[72px] items-center justify-between gap-2 border-b border-border-default px-3 py-2.5 md:gap-4 md:px-5 md:py-3 lg:min-h-[82px] lg:px-6 lg:py-[18px] min-[1200px]:px-10">
          <div class="flex min-w-0 items-center gap-[7px] text-xs text-text-muted md:gap-3">
            <button ref="menuButton" type="button" class="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-transparent text-text-secondary hover:bg-surface-3 lg:hidden" aria-label="მენიუს გახსნა" aria-controls="business-navigation" :aria-expanded="menuOpen" @click="menuOpen = true">
              <Bars3Icon class="h-5 w-5 shrink-0" aria-hidden="true" />
            </button>
            <span class="hidden md:inline">ბიზნესის პანელი</span><span class="hidden md:inline" aria-hidden="true">/</span><strong class="font-semibold text-text-secondary">{{ current.label }}</strong>
          </div>
          <div class="flex shrink-0 items-center gap-0.5 md:gap-1.5">
            <button class="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-transparent text-text-secondary hover:bg-surface-3" type="button" aria-label="გვერდის განახლება" title="გვერდის განახლება" @click="refreshPage">
              <ArrowPathIcon class="h-5 w-5 shrink-0" aria-hidden="true" />
            </button>
            <button class="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-transparent text-text-secondary hover:bg-surface-3" type="button" :aria-label="isDark ? 'ღია თემაზე გადართვა' : 'მუქ თემაზე გადართვა'" @click="toggleTheme">
              <component :is="isDark ? SunIcon : MoonIcon" class="h-5 w-5 shrink-0" aria-hidden="true" />
            </button>
            <button type="button" class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-transparent p-2.5 text-[13px] font-semibold text-text-secondary hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60 md:border md:border-border-default md:bg-surface md:px-3" :disabled="signingOut" aria-label="ბიზნესპანელიდან გამოსვლა" @click="signOut">
              <ArrowRightOnRectangleIcon class="h-5 w-5 shrink-0" aria-hidden="true" /><span class="hidden md:inline">{{ signingOut ? 'გამოსვლა…' : 'გამოსვლა' }}</span>
            </button>
          </div>
        </header>
        <main id="business-main" class="mx-auto max-w-[1590px] px-5 py-6 outline-none md:px-6 md:pt-7 min-[1200px]:px-10 min-[1200px]:pt-8" tabindex="-1">
          <p v-if="logoutError" class="my-4 rounded-lg border border-error bg-surface px-3.5 py-3 text-[13px] leading-5 text-error" role="alert">{{ logoutError }}</p>
          <slot />
        </main>
        <footer class="mx-auto flex max-w-[1590px] flex-wrap items-start justify-between gap-3 px-5 pb-6 text-[11px] text-text-muted md:items-center md:gap-4 md:px-6 md:pt-4 min-[1200px]:px-10">
          <span>FlexDrive · პირადი ბიზნესსივრცე</span><span class="flex items-center gap-1.5"><ShieldCheckIcon class="h-[15px] w-[15px] shrink-0" aria-hidden="true" /> წვდომა დაცულია</span>
        </footer>
      </div>
    </div>
    <main v-else class="grid min-h-screen place-items-center text-text-muted" role="status">წვდომა მოწმდება…</main>
  </div>
</template>
