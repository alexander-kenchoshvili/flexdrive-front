<script setup lang="ts">
import { storeToRefs } from "pinia";
import { sanitizeText } from "~/composables/helpers";
import type { FooterLinkItem, FooterSocialItem } from "~/types/footer";

const footerStore = useFooter();
const { footer } = storeToRefs(footerStore);
const { openCookiePreferences } = useCookieConsent();

if (!footer.value) {
  await footerStore.fetchFooter();
}

const brandDescription = computed(
  () => sanitizeText(footer.value?.brand?.description),
);

const sortLinks = (links: FooterLinkItem[] = []) =>
  [...links]
    .filter((link) => sanitizeText(link.label) && sanitizeText(link.url))
    .sort((a, b) => a.footer_order - b.footer_order || a.id - b.id);

const navigationLinks = computed(() =>
  sortLinks(footer.value?.groups?.navigation || []),
);

const helpLinks = computed(() =>
  sortLinks(footer.value?.groups?.help || []),
);

const legalLinks = computed(() =>
  sortLinks(footer.value?.groups?.legal || []),
);

const toPhoneHref = (value: string) => `tel:${value.replace(/[^\d+]/g, "")}`;

const contactItems = computed(() => {
  const email = sanitizeText(footer.value?.contact?.email);
  const phone = sanitizeText(footer.value?.contact?.phone);
  const workingHours = sanitizeText(footer.value?.contact?.working_hours);
  const city = sanitizeText(footer.value?.contact?.city);

  return [
    email
      ? {
          key: "email",
          icon: "mail",
          label: email,
          href: `mailto:${email}`,
        }
      : null,
    phone
      ? {
          key: "phone",
          icon: "phone",
          label: phone,
          href: toPhoneHref(phone),
        }
      : null,
    workingHours
      ? {
          key: "working-hours",
          icon: "clock",
          label: workingHours,
          href: "",
        }
      : null,
    city
      ? {
          key: "city",
          icon: "map-pin",
          label: city,
          href: "",
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    icon: string;
    label: string;
    href: string;
  }>;
});

const socialIconMap: Record<string, string> = {
  email: "mail",
  instagram: "instagram",
  facebook: "facebook",
  linkedin: "linkedin",
};

const socials = computed(() =>
  (footer.value?.socials || [])
    .map((item) => ({
      ...item,
      label: sanitizeText(item.label),
      url: sanitizeText(item.url),
      icon: socialIconMap[item.type?.toLowerCase?.() || ""] || "mail",
    }))
    .filter((item) => item.type?.toLowerCase() !== "email" && item.label && item.url),
);

const copyrightText = computed(
  () => sanitizeText(footer.value?.copyright_text),
);

const isExternalUrl = (url: string) =>
  /^(https?:\/\/|mailto:|tel:)/i.test(url.trim());

const isHttpUrl = (url: string) => /^https?:\/\//i.test(url.trim());

const resolveSocialRel = (item: FooterSocialItem) =>
  isHttpUrl(item.url) ? "noopener noreferrer" : undefined;

const resolveSocialTarget = (item: FooterSocialItem) =>
  isHttpUrl(item.url) ? "_blank" : undefined;
</script>

<template>
  <footer class="bg-footer-bg text-footer-text-primary">
    <div class="container-fluid">
      <div
        class="grid gap-10 py-12 sm:grid-cols-2 sm:gap-x-12 sm:gap-y-10 xl:grid-cols-[1.2fr_0.9fr_0.9fr_1fr] xl:gap-x-14 xl:py-16"
      >
        <section aria-labelledby="footer-brand-heading">
          <h2 id="footer-brand-heading" class="sr-only">FlexDrive Footer</h2>

          <NuxtLink
            to="/"
            class="inline-flex items-center rounded-xl transition-opacity duration-200 hover:opacity-90"
            aria-label="FlexDrive"
          >
            <NewFlexdriveLogoHorizontal variant="on-dark" class="h-12 w-auto" />
          </NuxtLink>

          <p
            v-if="brandDescription"
            class="mt-5 text-[14px] leading-7 text-footer-text-secondary xl:max-w-[280px]"
          >
            {{ brandDescription }}
          </p>
        </section>

        <nav
          v-if="navigationLinks.length"
          aria-labelledby="footer-navigation-heading"
        >
          <h3
            id="footer-navigation-heading"
            class="text-base font-bold upper tracking-[0.2em] text-footer-text-muted"
          >
            ნავიგაცია
          </h3>

          <ul class="mt-5 flex flex-col gap-3.5">
            <li v-for="link in navigationLinks" :key="link.id">
              <a
                v-if="isExternalUrl(link.url)"
                :href="link.url"
                :target="isHttpUrl(link.url) ? '_blank' : undefined"
                :rel="isHttpUrl(link.url) ? 'noopener noreferrer' : undefined"
                class="inline-flex text-[14px] leading-6 text-footer-text-secondary transition-colors duration-200 hover:text-accent-primary"
              >
                {{ link.label }}
              </a>
              <NuxtLink
                v-else
                :to="link.url"
                class="inline-flex text-[14px] leading-6 text-footer-text-secondary transition-colors duration-200 hover:text-accent-primary"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <nav v-if="helpLinks.length" aria-labelledby="footer-help-heading">
          <h3
            id="footer-help-heading"
            class="text-base font-bold upper tracking-[0.2em] text-footer-text-muted"
          >
            მომსახურება
          </h3>

          <ul class="mt-5 flex flex-col gap-3.5">
            <li v-for="link in helpLinks" :key="link.id">
              <a
                v-if="isExternalUrl(link.url)"
                :href="link.url"
                :target="isHttpUrl(link.url) ? '_blank' : undefined"
                :rel="isHttpUrl(link.url) ? 'noopener noreferrer' : undefined"
                class="inline-flex text-[14px] leading-6 text-footer-text-secondary transition-colors duration-200 hover:text-accent-primary"
              >
                {{ link.label }}
              </a>
              <NuxtLink
                v-else
                :to="link.url"
                class="inline-flex text-[14px] leading-6 text-footer-text-secondary transition-colors duration-200 hover:text-accent-primary"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <section aria-labelledby="footer-contact-heading">
          <h3
            id="footer-contact-heading"
            class="text-base font-bold upper tracking-[0.2em] text-footer-text-muted"
          >
            კონტაქტი
          </h3>

          <ul class="mt-5 flex flex-col gap-4">
            <li
              v-for="item in contactItems"
              :key="item.key"
              class="flex items-center gap-3"
              :class="{ 'site-contact-phone': item.key === 'phone' }"
            >
              <span
                class="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-footer-border bg-footer-surface text-accent-primary"
              >
                <BaseIcon :name="item.icon" :size="15" />
              </span>

              <a
                v-if="item.href"
                :href="item.href"
                class="min-w-0 break-words text-[14px] leading-6 text-footer-text-secondary transition-colors duration-200 hover:text-accent-primary"
              >
                {{ item.label }}
              </a>
              <span
                v-else
                class="min-w-0 text-[14px] leading-6 text-footer-text-secondary"
              >
                {{ item.label }}
              </span>
            </li>
          </ul>

          <div v-if="socials.length" class="mt-5 flex flex-wrap items-center gap-3">
            <a
              v-for="item in socials"
              :key="`${item.type}-${item.label}`"
              :href="item.url"
              :target="resolveSocialTarget(item)"
              :rel="resolveSocialRel(item)"
              :aria-label="item.label"
              :title="item.label"
              class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-footer-border bg-footer-surface text-footer-text-primary transition-colors duration-200 hover:border-footer-text-muted hover:bg-footer-hover hover:text-footer-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--footer-text-secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-footer-bg"
            >
              <BaseIcon :name="item.icon" :size="24" />
            </a>
          </div>
        </section>
      </div>

      <div class="border-t border-footer-border py-5 sm:py-6">
        <div class="flex min-w-0 flex-col gap-3">
          <div
            class="flex min-w-0 flex-wrap items-center justify-between gap-x-8 gap-y-3"
          >
            <p
              v-if="copyrightText"
              class="order-2 min-w-0 max-w-full break-words text-[12px] leading-5 text-footer-text-muted lg:order-1"
            >
              {{ copyrightText }}
            </p>

            <nav
              aria-label="Footer legal links"
              class="order-1 flex w-full min-w-0 flex-wrap items-center gap-x-5 lg:order-2 lg:ml-auto lg:w-auto"
            >
              <template v-for="link in legalLinks" :key="link.id">
                <a
                  v-if="isExternalUrl(link.url)"
                  :href="link.url"
                  :target="isHttpUrl(link.url) ? '_blank' : undefined"
                  :rel="isHttpUrl(link.url) ? 'noopener noreferrer' : undefined"
                  class="inline-flex min-h-11 max-w-full items-center rounded-sm py-2 text-left text-[12px] leading-5 text-footer-text-secondary transition-colors duration-200 hover:text-footer-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--footer-text-secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-footer-bg"
                >
                  {{ link.label }}
                </a>
                <NuxtLink
                  v-else
                  :to="link.url"
                  class="inline-flex min-h-11 max-w-full items-center rounded-sm py-2 text-left text-[12px] leading-5 text-footer-text-secondary transition-colors duration-200 hover:text-footer-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--footer-text-secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-footer-bg"
                >
                  {{ link.label }}
                </NuxtLink>
              </template>

              <button
                type="button"
                class="inline-flex min-h-11 max-w-full items-center rounded-sm py-2 text-left text-[12px] leading-5 text-footer-text-secondary transition-colors duration-200 hover:text-footer-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--footer-text-secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-footer-bg"
                @click="openCookiePreferences"
              >
                ქუქიების პარამეტრები
              </button>
            </nav>
          </div>

          <p class="min-w-0 max-w-full break-words text-[11px] leading-5 text-footer-text-muted">
            This site is protected by reCAPTCHA and the Google
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              class="rounded-sm text-footer-text-secondary underline decoration-footer-text-muted/60 underline-offset-4 transition-colors duration-200 hover:text-footer-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--footer-text-secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-footer-bg"
            >
              Privacy Policy
            </a>
            and
            <a
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              class="rounded-sm text-footer-text-secondary underline decoration-footer-text-muted/60 underline-offset-4 transition-colors duration-200 hover:text-footer-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--footer-text-secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-footer-bg"
            >
              Terms of Service
            </a>
            apply.
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>
