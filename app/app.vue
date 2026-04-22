<script setup lang="ts">
import { storeToRefs } from "pinia";
import { buildOrganizationStructuredData } from "~/utils/structuredData";

const menuStore = useMenu();
const footerStore = useFooter();
const globalStore = useGlobalStore();
const siteSettingsStore = useSiteSettings();
const { footer } = storeToRefs(footerStore);
const { settings } = storeToRefs(siteSettingsStore);
const route = useRoute();
const config = useRuntimeConfig();

await Promise.all([menuStore.fetchMenu(), footerStore.fetchFooter()]);

const dismissRateLimitError = () => {
  globalStore.setRateLimited(false);
};

const siteUrl = computed(() =>
  String(config.public.siteUrl || "https://localhost:3000").replace(/\/+$/, ""),
);
const siteName = computed(
  () => settings.value?.site_name || footer.value?.brand?.name || "AutoMate",
);
const organizationDescription = computed(
  () =>
    footer.value?.brand?.description ||
    settings.value?.default_seo_description ||
    null,
);
const organizationImage = computed(
  () => settings.value?.default_seo_image || config.public.defaultSeoImage || null,
);
const organizationSchema = computed(() => {
  if (!["/", "/contact"].includes(route.path || "/")) {
    return null;
  }

  return buildOrganizationStructuredData({
    siteUrl: siteUrl.value,
    name: siteName.value,
    description: organizationDescription.value,
    image: organizationImage.value,
    email: footer.value?.contact?.email || null,
    phone: footer.value?.contact?.phone || null,
    city: footer.value?.contact?.city || null,
    sameAs: footer.value?.socials?.map((item) => item.url) || [],
  });
});

useHead(() => ({
  script: organizationSchema.value
    ? [
        {
          key: "organization-schema",
          type: "application/ld+json",
          children: JSON.stringify(organizationSchema.value),
        },
      ]
    : [],
}));
</script>

<template>
  <BaseModal
    :show="globalStore.isRateLimited"
    title="შეცდომა: ძალიან ბევრი მოთხოვნა"
    @close="dismissRateLimitError"
  >
    <p>
      სერვერზე დაფიქსირდა ძალიან ბევრი მოთხოვნა თქვენი მოწყობილობიდან. გთხოვთ,
      სცადოთ მოგვიანებით, დაახლოებით 1 წუთში.
    </p>

    <template #footer>
      <BaseButton
        type="button"
        size="lg"
        :full-width="true"
        @click="dismissRateLimitError"
      >
        გასაგებია
      </BaseButton>
    </template>
  </BaseModal>

  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
