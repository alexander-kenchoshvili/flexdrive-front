<script setup lang="ts">
import { storeToRefs } from "pinia";
import { sanitizeText } from "~/composables/helpers";
import type {
  FooterLinkItem,
  FooterPayload,
  FooterSocialItem,
} from "~/types/footer";

const footerStore = useFooter();
const { footer } = storeToRefs(footerStore);

if (!footer.value) {
  await footerStore.fetchFooter();
}

const fallbackFooter: FooterPayload = {
  brand: {
    name: "AutoMate",
    description:
      "AutoMate გაძლევს ავტომობილის აქსესუარების დათვალიერებისა და შეძენის მარტივ, გასაგებ და სანდო გზას.",
  },
  trust_items: ["მარტივი შეკვეთა", "სწრაფი მიწოდება", "უსაფრთხო გადახდა"],
  groups: {
    navigation: [],
    help: [],
    legal: [],
  },
  contact: {
    phone: null,
    email: null,
    working_hours: null,
    city: null,
  },
  socials: [],
  copyright_text: "© 2026 AutoMate. ყველა უფლება დაცულია.",
};

const footerData = computed(() => footer.value ?? fallbackFooter);

const brandName = computed(
  () => sanitizeText(footerData.value.brand?.name) || "AutoMate",
);

const brandPrefix = computed(() => {
  const value = brandName.value;
  const mateIndex = value.toLowerCase().indexOf("mate");
  if (mateIndex <= 0) return value;
  return value.slice(0, mateIndex);
});

const brandAccentPart = computed(() => {
  const value = brandName.value;
  const mateIndex = value.toLowerCase().indexOf("mate");
  if (mateIndex <= 0) return "";
  return value.slice(mateIndex);
});

const brandDescription = computed(
  () =>
    sanitizeText(footerData.value.brand?.description) ||
    fallbackFooter.brand.description,
);

const trustItems = computed(() =>
  (footerData.value.trust_items || []).map(sanitizeText).filter(Boolean),
);

const sortLinks = (links: FooterLinkItem[] = []) =>
  [...links]
    .filter((link) => sanitizeText(link.label) && sanitizeText(link.url))
    .sort((a, b) => a.footer_order - b.footer_order || a.id - b.id);

const navigationLinks = computed(() =>
  sortLinks(footerData.value.groups?.navigation || []),
);

const helpLinks = computed(() =>
  sortLinks(footerData.value.groups?.help || []),
);

const legalLinks = computed(() =>
  sortLinks(footerData.value.groups?.legal || []),
);

const toPhoneHref = (value: string) => `tel:${value.replace(/[^\d+]/g, "")}`;

const contactItems = computed(() => {
  const phone = sanitizeText(footerData.value.contact?.phone);
  const workingHours = sanitizeText(footerData.value.contact?.working_hours);
  const city = sanitizeText(footerData.value.contact?.city);

  return [
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
};

const socials = computed(() =>
  (footerData.value.socials || [])
    .map((item) => ({
      ...item,
      label: sanitizeText(item.label),
      url: sanitizeText(item.url),
      icon: socialIconMap[item.type?.toLowerCase?.() || ""] || "mail",
    }))
    .filter((item) => item.label && item.url),
);

const copyrightText = computed(
  () =>
    sanitizeText(footerData.value.copyright_text) ||
    fallbackFooter.copyright_text ||
    "",
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
          <h2 id="footer-brand-heading" class="sr-only">AutoMate Footer</h2>

          <NuxtLink
            to="/"
            class="inline-flex items-center gap-3 rounded-xl transition-colors duration-200 hover:text-accent-primary"
          >
            <BaseIcon name="logo" :size="34" class="text-accent-primary" />
            <span
              class="text-[19px] font-bold leading-none text-footer-text-primary"
            >
              <template v-if="brandAccentPart">
                {{ brandPrefix
                }}<span class="text-accent-primary">{{ brandAccentPart }}</span>
              </template>
              <template v-else>
                {{ brandName }}
              </template>
            </span>
          </NuxtLink>

          <p
            class="mt-5 text-[14px] leading-7 text-footer-text-secondary xl:max-w-[280px]"
          >
            {{ brandDescription }}
          </p>
          <!-- 
          <ul
            v-if="trustItems.length"
            class="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:flex-col"
          >
            <li
              v-for="item in trustItems"
              :key="item"
              class="inline-flex w-full sm:w-fit items-center gap-2.5 rounded-full border border-footer-border bg-footer-surface px-3.5 py-2 text-[12px] font-medium leading-none text-footer-text-secondary"
            >
              <span class="h-2 w-2 rounded-full bg-accent-primary" />
              <span>{{ item }}</span>
            </li>
          </ul> -->
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
            >
              <span
                class="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-footer-border bg-footer-surface text-accent-primary"
              >
                <BaseIcon :name="item.icon" :size="15" />
              </span>

              <a
                v-if="item.href"
                :href="item.href"
                class="min-w-0 text-[14px] leading-6 text-footer-text-secondary transition-colors duration-200 hover:text-accent-primary"
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
        </section>
      </div>

      <div class="border-t border-footer-border py-5 sm:py-6">
        <div class="flex flex-col gap-5">
          <div
            class="grid gap-4 sm:grid-cols-2 sm:gap-x-8 xl:grid-cols-[minmax(0,1fr)_auto_auto] xl:items-center"
          >
            <p class="text-[12px] leading-5 text-footer-text-muted">
              {{ copyrightText }}
            </p>

            <nav
              v-if="legalLinks.length"
              aria-label="Footer legal links"
              class="flex flex-wrap items-center gap-x-5 gap-y-2 sm:justify-end xl:justify-center"
            >
              <template v-for="link in legalLinks" :key="link.id">
                <a
                  v-if="isExternalUrl(link.url)"
                  :href="link.url"
                  :target="isHttpUrl(link.url) ? '_blank' : undefined"
                  :rel="isHttpUrl(link.url) ? 'noopener noreferrer' : undefined"
                  class="text-[12px] leading-5 text-footer-text-muted transition-colors duration-200 hover:text-footer-text-secondary"
                >
                  {{ link.label }}
                </a>
                <NuxtLink
                  v-else
                  :to="link.url"
                  class="text-[12px] leading-5 text-footer-text-muted transition-colors duration-200 hover:text-footer-text-secondary"
                >
                  {{ link.label }}
                </NuxtLink>
              </template>
            </nav>

            <div
              v-if="socials.length"
              class="flex flex-wrap items-center gap-2 sm:col-span-2 xl:col-span-1 xl:justify-end"
            >
              <a
                v-for="item in socials"
                :key="`${item.type}-${item.label}`"
                :href="item.url"
                :target="resolveSocialTarget(item)"
                :rel="resolveSocialRel(item)"
                class="inline-flex items-center gap-2 rounded-full border border-footer-border bg-footer-surface px-3 py-2 text-[12px] font-medium leading-none text-footer-text-muted transition-colors duration-200 hover:border-accent-primary hover:bg-footer-hover hover:text-footer-text-primary"
              >
                <BaseIcon :name="item.icon" :size="14" />
                <span>{{ item.label }}</span>
              </a>
            </div>
          </div>

          <div
            class="rounded-[18px] border border-footer-border bg-footer-surface px-4 py-3"
          >
            <p class="text-[11px] leading-5 text-footer-text-muted">
              This site is protected by reCAPTCHA and the Google
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                class="text-footer-text-secondary underline decoration-footer-border underline-offset-4 transition-colors duration-200 hover:text-accent-primary"
              >
                Privacy Policy
              </a>
              and
              <a
                href="https://policies.google.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                class="text-footer-text-secondary underline decoration-footer-border underline-offset-4 transition-colors duration-200 hover:text-accent-primary"
              >
                Terms of Service
              </a>
              apply.
            </p>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
