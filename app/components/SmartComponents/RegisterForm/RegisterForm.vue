<script setup lang="ts">
import { CheckCircleIcon } from "@heroicons/vue/24/solid";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { normalizeAuthRedirect } from "~/utils/authRouting";
import type { ContentItemData, SmartComponentData } from "~/types/page";
import { sanitizeText, splitAutoMateTitleParts } from "~/composables/helpers";

const props = defineProps<{
  data?: SmartComponentData;
}>();

const router = useRouter();
const route = useRoute();
const globalStore = useGlobalStore();
const { executeRecaptcha } = useRecaptcha();
const { passwordHint, registerSchema } = useAuthValidationSchemas();

const successMessage = ref("");
const errorMessage = ref("");
const loading = ref(false);
const isSuccessModalOpen = ref(false);
const isAuthBusy = computed(() => loading.value);

const sectionEyebrow = computed(() => sanitizeText(props.data?.buttonText));

const sectionTitle = computed(() => sanitizeText(props.data?.title));
const titleParts = computed(() => splitAutoMateTitleParts(sectionTitle.value));

const sectionSubtitle = computed(() => sanitizeText(props.data?.subtitle));

const registerBenefits = computed<ContentItemData[]>(() => {
  const list = props.data?.contentData?.list;

  if (!Array.isArray(list) || list.length === 0) {
    return [];
  }

  return list.filter(
    (item) => sanitizeText(item.title) || sanitizeText(item.description),
  );
});

const redirectTarget = computed(() =>
  normalizeAuthRedirect(route.query.redirect, "/"),
);

const redirectIfAuthenticated = async () => {
  if (!globalStore.authResolved || !globalStore.currentUser) {
    return;
  }

  if (route.path !== redirectTarget.value) {
    await router.replace(redirectTarget.value);
  }
};

const { defineField, errors, handleSubmit, resetForm } = useForm({
  validationSchema: toTypedSchema(registerSchema),
  initialValues: {
    email: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  },
});

const [email, emailAttrs] = defineField("email");
const [password, passwordAttrs] = defineField("password");
const [confirmPassword, confirmPasswordAttrs] = defineField("confirmPassword");
const [termsAccepted] = defineField("termsAccepted");

watch(
  () => [globalStore.authResolved, globalStore.currentUser?.id || null],
  () => {
    void redirectIfAuthenticated();
  },
  { immediate: true },
);

watch(
  () => route.query.google_error,
  (message) => {
    if (typeof message === "string" && message.trim()) {
      errorMessage.value = message;
    }
  },
  { immediate: true },
);

watch(
  () => route.query.facebook_error,
  (message) => {
    if (typeof message === "string" && message.trim()) {
      errorMessage.value = message;
    }
  },
  { immediate: true },
);

const closeSuccessModal = () => {
  isSuccessModalOpen.value = false;
  successMessage.value = "";
};

const submitForm = handleSubmit(async (values) => {
  successMessage.value = "";
  errorMessage.value = "";
  loading.value = true;
  isSuccessModalOpen.value = false;

  try {
    const token = await executeRecaptcha("register");
    await apiFetchRaw("/accounts/register/", {
      method: "POST",
      body: {
        email: values.email,
        password: values.password,
        confirm_password: values.confirmPassword,
        terms_accepted: values.termsAccepted,
        recaptcha_token: token,
      },
    });

    successMessage.value =
      "რეგისტრაცია წარმატებით დასრულდა. შეამოწმეთ ელფოსტა.";
    resetForm({
      values: {
        email: "",
        password: "",
        confirmPassword: "",
        termsAccepted: false,
      },
    });
    isSuccessModalOpen.value = true;
  } catch (error: any) {
    errorMessage.value =
      error?.data?.detail || "რეგისტრაცია ვერ შესრულდა. სცადეთ თავიდან.";
  } finally {
    loading.value = false;
  }
});

const handleGoogleError = (message: string) => {
  errorMessage.value =
    message || "Google-ით რეგისტრაცია ვერ შესრულდა. სცადეთ თავიდან.";
};

const handleFacebookError = (message: string) => {
  errorMessage.value =
    message || "Facebook-ით რეგისტრაცია ვერ შესრულდა. სცადეთ თავიდან.";
};
</script>

<template>
  <section
    class="bg-[linear-gradient(135deg,var(--bg-primary)_0%,var(--surface)_46%,var(--section-soft)_100%)] text-text-primary"
  >
    <div
      class="container-fluid grid gap-5 py-6 sm:py-10 lg:min-h-[620px] lg:grid-cols-[minmax(0,1fr)_minmax(380px,460px)] lg:items-start lg:gap-12 lg:py-14 xl:py-16"
    >
      <div class="order-2 space-y-4 lg:order-1 lg:min-w-0 lg:pr-8">
        <span
          v-if="sectionEyebrow"
          class="inline-flex items-center rounded-full border border-border-default bg-surface px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-primary shadow-[0_14px_34px_-30px_var(--shadow-color)] sm:px-4 sm:py-2"
        >
          {{ sectionEyebrow }}
        </span>

        <div>
          <h1
            v-if="sectionTitle"
            class="title-under-xs upper max-w-2xl text-[28px] font-extrabold leading-[1.15] text-text-primary sm:text-[36px] lg:text-[44px]"
          >
            <span v-if="titleParts.upperLeadingPart" class="upper">
              {{ titleParts.upperLeadingPart }}
            </span>
            <template
              v-for="(segment, index) in titleParts.brandSegments"
              :key="`${segment.text}-${index}`"
            >
              <span :class="segment.accent ? 'text-accent-primary' : ''">
                {{ segment.text }}
              </span>
            </template>
            <span v-if="titleParts.upperTrailingPart" class="upper">
              {{ titleParts.upperTrailingPart }}
            </span>
          </h1>

          <p
            v-if="sectionSubtitle"
            class="subtitle-under-xs mt-3 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base sm:leading-7"
          >
            {{ sectionSubtitle }}
          </p>
        </div>

        <div
          v-if="registerBenefits.length"
          class="grid gap-2 max-[1239px]:grid-cols-1 min-[1240px]:grid-cols-3 lg:gap-3 xl:gap-4"
        >
          <article
            v-for="(item, index) in registerBenefits"
            :key="item.id"
            class="rounded-[18px] border border-border-default bg-surface p-3 shadow-[0_16px_38px_-34px_var(--shadow-color)] sm:p-4 lg:p-5"
          >
            <div class="flex items-center gap-3">
              <span
                class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-xs font-extrabold text-accent-primary"
              >
                {{ index + 1 }}
              </span>
              <div class="min-w-0">
                <p class="text-sm font-bold leading-5 text-text-primary">
                  {{ sanitizeText(item.title) }}
                </p>
              </div>
            </div>
            <p
              v-if="sanitizeText(item.description)"
              class="mt-3 text-xs leading-5 text-text-secondary sm:text-sm sm:leading-6"
            >
              {{ sanitizeText(item.description) }}
            </p>
          </article>
        </div>
      </div>

      <div class="order-1 lg:order-2 lg:justify-self-end">
        <form
          class="mx-auto w-full max-w-[460px] rounded-[24px] border border-border-default bg-surface p-4 shadow-[0_26px_70px_-44px_var(--shadow-color)] sm:p-6 lg:p-7"
          novalidate
          @submit.prevent="submitForm"
        >
          <div class="mb-5 sm:mb-6">
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-primary"
            >
              რეგისტრაცია
            </p>
            <h2
              class="title-under-xs upper mt-2 text-[26px] font-extrabold leading-tight text-text-primary sm:text-[30px]"
            >
              ანგარიშის შექმნა
            </h2>
            <p class="subtitle-under-xs mt-2 text-sm leading-6 text-text-secondary">
              შექმენი პროფილი შეკვეთების, სურვილების სიის და მიწოდების
              მონაცემებისთვის.
            </p>
          </div>

          <BaseInput
            v-model="email"
            class="mb-3 sm:mb-4"
            v-bind="emailAttrs"
            label="ელ.ფოსტა"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
            :error="errors.email"
            :disabled="isAuthBusy"
          />

          <BaseInput
            v-model="password"
            class="mb-3"
            v-bind="passwordAttrs"
            label="პაროლი"
            type="password"
            autocomplete="new-password"
            :error="errors.password"
            :disabled="isAuthBusy"
          />

          <div
            class="mb-3 rounded-[16px] border border-border-default bg-surface-2 px-3 py-2.5 text-xs leading-5 text-text-secondary sm:mb-4 sm:px-4 sm:py-3 sm:text-sm sm:leading-6"
          >
            <span class="font-semibold text-text-primary">
              პაროლის მოთხოვნა:
            </span>
            {{ passwordHint }}
          </div>

          <BaseInput
            v-model="confirmPassword"
            class="mb-3 sm:mb-4"
            v-bind="confirmPasswordAttrs"
            label="გაიმეორე პაროლი"
            type="password"
            autocomplete="new-password"
            :error="errors.confirmPassword"
            :disabled="isAuthBusy"
          />

          <label
            class="mb-2 flex items-start gap-3 rounded-[16px] border border-border-default bg-surface-2 px-3 py-2.5 text-xs font-medium leading-5 text-text-secondary transition-colors duration-200 sm:px-4 sm:py-3 sm:text-sm sm:leading-6"
            :class="errors.termsAccepted ? 'border-error/40 text-error' : ''"
          >
            <input
              v-model="termsAccepted"
              type="checkbox"
              class="mt-0.5 h-4 w-4 rounded border border-border-default bg-surface accent-accent-primary"
              :disabled="isAuthBusy"
            />
            <span>
              ვეთანხმები
              <NuxtLink
                to="/terms"
                target="_blank"
                rel="noopener noreferrer"
                class="font-semibold text-accent-primary transition-colors duration-200 hover:text-accent-hover"
                @click.stop
              >
                წესებსა და პირობებს
              </NuxtLink>
              და
              <NuxtLink
                to="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                class="font-semibold text-accent-primary transition-colors duration-200 hover:text-accent-hover"
                @click.stop
              >
                კონფიდენციალურობის პოლიტიკას
              </NuxtLink>
            </span>
          </label>
          <p v-if="errors.termsAccepted" class="mb-4 text-sm text-error">
            {{ errors.termsAccepted }}
          </p>

          <BaseButton
            type="submit"
            :full-width="true"
            class="mt-3 rounded-[16px]"
            :disabled="isAuthBusy"
          >
            {{ loading ? "მიმდინარეობს რეგისტრაცია..." : "რეგისტრაცია" }}
          </BaseButton>

          <div
            v-if="successMessage && !isSuccessModalOpen"
            class="mt-4 rounded-[16px] border border-success/20 bg-success/5 px-4 py-3 text-sm font-medium text-success"
          >
            {{ successMessage }}
          </div>

          <div
            v-if="errorMessage"
            class="mt-4 rounded-[16px] border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error"
          >
            {{ errorMessage }}
          </div>

          <div class="mt-5">
            <div class="mb-4 flex items-center gap-3">
              <span class="h-px flex-1 bg-border-default" aria-hidden="true" />
              <span class="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                ან
              </span>
              <span class="h-px flex-1 bg-border-default" aria-hidden="true" />
            </div>

            <div class="space-y-3">
              <GoogleAuthButton
                context="signup"
                :disabled="loading"
                :redirect-to="redirectTarget"
                :return-path="route.fullPath"
                @error="handleGoogleError"
              />
              <FacebookAuthButton
                context="signup"
                :disabled="loading"
                :redirect-to="redirectTarget"
                :return-path="route.fullPath"
                @error="handleFacebookError"
              />
              <p
                class="text-center text-[11px] leading-5 text-text-muted"
              >
                სოციალური ანგარიშით გაგრძელებით ეთანხმები
                <NuxtLink
                  to="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="font-semibold text-accent-primary transition-colors duration-200 hover:text-accent-hover"
                >
                  წესებს
                </NuxtLink>
                და
                <NuxtLink
                  to="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="font-semibold text-accent-primary transition-colors duration-200 hover:text-accent-hover"
                >
                  კონფიდენციალურობის პოლიტიკას
                </NuxtLink>
                .
              </p>
            </div>
          </div>

          <div class="mt-5 border-t border-border-default pt-4 text-center text-sm">
            <p class="text-text-secondary">
              უკვე გაქვს ანგარიში?
              <NuxtLink
                to="/login"
                class="font-semibold text-accent-primary transition-colors duration-200 hover:text-accent-hover"
              >
                შესვლა
              </NuxtLink>
            </p>
          </div>
        </form>
      </div>
    </div>
  </section>

  <BaseModal
    :show="isSuccessModalOpen"
    title="რეგისტრაცია"
    @close="closeSuccessModal"
  >
    <div class="flex flex-col items-center text-center">
      <div
        class="grid h-16 w-16 place-items-center rounded-full border border-accent-primary/20 bg-accent-primary/10 text-accent-primary"
      >
        <CheckCircleIcon class="h-8 w-8" aria-hidden="true" />
      </div>

      <p
        v-if="successMessage"
        class="mt-5 max-w-md text-sm leading-7 text-text-secondary md:text-base"
      >
        {{ successMessage }}
      </p>
    </div>

    <template #footer>
      <BaseButton
        type="button"
        size="lg"
        :full-width="true"
        @click="closeSuccessModal"
      >
        გასაგებია
      </BaseButton>
    </template>
  </BaseModal>
</template>
