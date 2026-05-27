<script setup lang="ts">
import type { CookieConsentDraft } from "~/composables/useCookieConsent";

type ConsentOption = {
  key: "preferences" | "functionality" | "tracking";
  label: string;
  description: string;
};

const {
  consent,
  hasConsentDecision,
  shouldShowCookieBanner,
  saveConsent,
  acceptAllCookies,
  rejectOptionalCookies,
  closeCookiePreferences,
} = useCookieConsent();

const draft = reactive({
  preferences: false,
  functionality: false,
  tracking: false,
});

const isHydrated = ref(false);
const settingsOpen = ref(false);
const isSettingsModalOpen = computed(
  () => isHydrated.value && shouldShowCookieBanner.value && settingsOpen.value,
);

const optionalOptions: ConsentOption[] = [
  {
    key: "preferences",
    label: "პრეფერენციები",
    description: "ინახავს დამატებით არჩევანებს, რომლებიც საიტის გამოყენებას გიმარტივებს.",
  },
  {
    key: "functionality",
    label: "ფუნქციონალურობა",
    description: "გვეხმარება საიტის კომფორტული ფუნქციების მუშაობაში.",
  },
  {
    key: "tracking",
    label: "ანალიტიკა და რეკლამა",
    description: "გვაჩვენებს პროდუქტებს და რეკლამის მიზნობრიობას.",
  },
];

const syncDraft = () => {
  draft.preferences = consent.value?.preferences === true;
  draft.functionality = consent.value?.functionality === true;
  draft.tracking =
    consent.value?.analytics === true && consent.value?.marketing === true;
};

watch(
  shouldShowCookieBanner,
  (isVisible) => {
    if (isVisible) {
      syncDraft();
      settingsOpen.value = hasConsentDecision.value;
    } else {
      settingsOpen.value = false;
    }
  },
  { immediate: true },
);

watch(consent, syncDraft);

onMounted(() => {
  isHydrated.value = true;
});

const toggleOption = (key: ConsentOption["key"]) => {
  draft[key] = !draft[key];
};

const openSettings = () => {
  settingsOpen.value = true;
};

const closeSettings = () => {
  if (hasConsentDecision.value) {
    closeCookiePreferences();
    return;
  }

  settingsOpen.value = false;
};

const savePreferences = () => {
  const nextConsent: CookieConsentDraft = {
    preferences: draft.preferences,
    functionality: draft.functionality,
    analytics: draft.tracking,
    marketing: draft.tracking,
  };

  saveConsent(nextConsent);
};

const switchThumbClass = (isEnabled: boolean) =>
  isEnabled ? "translate-x-5" : "translate-x-0";
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-4 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-4 opacity-0"
    >
      <section
        v-if="isHydrated && shouldShowCookieBanner && !settingsOpen"
        class="fixed inset-x-0 bottom-0 z-[70] border-t border-border-default bg-[color:var(--surface)] px-3 py-3 text-text-primary shadow-[0_-18px_44px_-30px_var(--shadow-color)] sm:px-4"
        aria-label="ქუქიების შეტყობინება"
      >
        <div
          class="mx-auto flex w-full max-w-[1240px] flex-col gap-3 md:items-center md:gap-4 md:text-center lg:flex-row lg:items-center lg:justify-between lg:gap-5 lg:text-left"
        >
          <div class="min-w-0 md:max-w-[700px] lg:max-w-none">
            <h2 class="upper text-base font-extrabold leading-6 sm:text-lg">
              ვებსაიტი იყენებს ქუქი-ფაილებს
            </h2>
            <p class="mt-1 text-sm leading-6 text-text-secondary">
              ჩვენ ვიყენებთ ქუქი-ფაილებს მომხმარებლის გამოცდილების
              გასაუმჯობესებლად. შეგიძლიათ წაიკითხოთ მეტი ქუქი ფაილების
              <NuxtLink
                to="/privacy-policy"
                class="font-semibold text-accent-primary transition-colors hover:text-accent-hover"
              >
                პოლიტიკის
              </NuxtLink>
              შესახებ.
            </p>
          </div>

          <div
            class="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-3 md:mx-auto md:w-full md:max-w-[520px] lg:mx-0 lg:w-[440px]"
          >
            <BaseButton
              type="button"
              size="sm"
              :full-width="true"
              @click="acceptAllCookies"
            >
              დათანხმება
            </BaseButton>

            <BaseButton
              type="button"
              variant="secondary"
              size="sm"
              :full-width="true"
              @click="rejectOptionalCookies"
            >
              უარყოფა
            </BaseButton>

            <BaseButton
              type="button"
              variant="ghost"
              size="sm"
              :full-width="true"
              @click="openSettings"
            >
              პარამეტრები
            </BaseButton>
          </div>
        </div>
      </section>
    </Transition>
  </Teleport>

  <BaseModal
    :show="isSettingsModalOpen"
    aria-label="ქუქიების პარამეტრები"
    close-label="დახურვა"
    @close="closeSettings"
  >
    <template #header>
      <div class="min-w-0">
        <h2 class="upper text-xl font-extrabold leading-7 text-text-primary">
          ქუქის პარამეტრები
        </h2>
      </div>
    </template>

    <div class="max-h-[min(58dvh,420px)] space-y-2 overflow-y-auto pr-1">
      <div
        class="flex items-center justify-between gap-3 rounded-[14px] border border-border-default bg-surface-2 p-3"
      >
        <div class="min-w-0">
          <p class="upper text-sm font-bold text-text-primary">აუცილებელი</p>
          <p class="mt-1 text-xs leading-5 text-text-secondary">
            ავტორიზაცია, კალათა, შეკვეთა და უსაფრთხოება.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked="true"
          disabled
          class="relative h-6 w-11 shrink-0 cursor-not-allowed rounded-full border border-accent-primary bg-accent-primary/20 opacity-80 transition-colors duration-200"
        >
          <span
            class="absolute left-1 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-accent-primary transition-transform duration-200"
            :class="switchThumbClass(true)"
          />
        </button>
      </div>

      <div
        v-for="option in optionalOptions"
        :key="option.key"
        class="flex items-center justify-between gap-3 rounded-[14px] border border-border-default bg-surface-2 p-3 transition-colors hover:border-accent-primary/60"
      >
        <div class="min-w-0">
          <p class="upper text-sm font-bold text-text-primary">
            {{ option.label }}
          </p>
          <p class="mt-1 text-xs leading-5 text-text-secondary">
            {{ option.description }}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          :aria-checked="draft[option.key]"
          class="relative h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
          :class="
            draft[option.key]
              ? 'border-accent-primary bg-accent-primary/20'
              : 'border-border-default bg-surface'
          "
          @click="toggleOption(option.key)"
        >
          <span
            class="absolute left-1 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-accent-primary transition-transform duration-200"
            :class="switchThumbClass(draft[option.key])"
          />
        </button>
      </div>
    </div>

    <template #footer>
      <div class="grid w-full gap-2 sm:grid-cols-3">
        <BaseButton
          type="button"
          size="sm"
          :full-width="true"
          @click="acceptAllCookies"
        >
          დათანხმება
        </BaseButton>

        <BaseButton
          type="button"
          variant="secondary"
          size="sm"
          :full-width="true"
          @click="rejectOptionalCookies"
        >
          უარყოფა
        </BaseButton>

        <BaseButton
          type="button"
          variant="ghost"
          size="sm"
          :full-width="true"
          @click="savePreferences"
        >
          შენახვა
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
