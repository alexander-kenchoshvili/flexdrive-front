<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { normalizeAuthRedirect } from "~/utils/authRouting";
import type { AuthSessionState } from "~/types/auth";
import type { ContentItemData, SmartComponentData } from "~/types/page";
import {
  sanitizeText,
  splitAutoMateTitleParts,
} from "~/composables/helpers";

const props = defineProps<{
  data?: SmartComponentData;
}>();

const { executeRecaptcha } = useRecaptcha();
const { applyAuthSession } = useAuthSession();
const router = useRouter();
const route = useRoute();
const globalStore = useGlobalStore();
const { loginSchema } = useAuthValidationSchemas();
const {
  authenticateWithGoogle,
  getGoogleAuthErrorMessage,
} = useGoogleAuthFlow();
const { isGoogleIdentityConfigured } = useGoogleIdentity();

const errorMessage = ref("");
const loading = ref(false);
const googleLoading = ref(false);
const hasGoogleAuth = computed(() => isGoogleIdentityConfigured());
const isAuthBusy = computed(() => loading.value || googleLoading.value);

const sectionEyebrow = computed(() => sanitizeText(props.data?.buttonText));

const sectionTitle = computed(() => sanitizeText(props.data?.title));
const titleParts = computed(() => splitAutoMateTitleParts(sectionTitle.value));

const sectionSubtitle = computed(() => sanitizeText(props.data?.subtitle));

const accountHighlights = computed<ContentItemData[]>(() => {
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

const { defineField, errors, handleSubmit, setFieldError } = useForm({
  validationSchema: toTypedSchema(loginSchema),
  initialValues: {
    email: "",
    password: "",
  },
});

const [email, emailAttrs] = defineField("email");
const [password, passwordAttrs] = defineField("password");

watch(
  () => [globalStore.authResolved, globalStore.currentUser?.id || null],
  () => {
    void redirectIfAuthenticated();
  },
  { immediate: true },
);

const loginUser = handleSubmit(async (values) => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const recaptchaToken = await executeRecaptcha("login");

    const loginResponse = await secureFetchRaw<{ session?: AuthSessionState }>(
      "/accounts/login/",
      {
        method: "POST",
        body: {
          email: values.email,
          password: values.password,
          recaptcha_token: recaptchaToken,
        },
      },
    );

    applyAuthSession(loginResponse?.session);

    const userResponse = await secureFetchRaw(
      "/accounts/me/",
      {
        method: "GET",
      },
    );

    globalStore.currentUser = userResponse;
    globalStore.authResolved = true;
    await router.push(redirectTarget.value);
  } catch (e: any) {
    const emailFieldError = e?.data?.email?.[0];
    const passwordFieldError = e?.data?.password?.[0];

    if (emailFieldError) setFieldError("email", emailFieldError);
    if (passwordFieldError) setFieldError("password", passwordFieldError);

    errorMessage.value =
      e?.data?.non_field_errors?.[0] ||
      e?.data?.detail ||
      e?.message ||
      "ავტორიზაცია ვერ შესრულდა. სცადეთ თავიდან.";
  } finally {
    loading.value = false;
  }
});

const loginWithGoogle = async (credential: string) => {
  googleLoading.value = true;
  errorMessage.value = "";

  try {
    await authenticateWithGoogle(credential);
    await router.push(redirectTarget.value);
  } catch (error: any) {
    errorMessage.value = getGoogleAuthErrorMessage(
      error,
      "Google-ით შესვლა ვერ შესრულდა. სცადეთ თავიდან.",
    );
  } finally {
    googleLoading.value = false;
  }
};

const handleGoogleError = (message: string) => {
  errorMessage.value =
    message || "Google-ით შესვლა ვერ შესრულდა. სცადეთ თავიდან.";
};
</script>

<template>
  <section class="bg-[linear-gradient(135deg,var(--bg-primary)_0%,var(--surface)_46%,var(--section-soft)_100%)] text-text-primary">
    <div
      class="container-fluid grid gap-5 py-6 sm:py-10 lg:min-h-[620px] lg:grid-cols-[minmax(0,1fr)_minmax(380px,430px)] lg:items-center lg:gap-12 lg:py-14 xl:py-16"
    >
      <div class="order-2 space-y-4 lg:order-1 lg:max-w-xl lg:pr-6">
        <span
          v-if="sectionEyebrow"
          class="inline-flex items-center rounded-full border border-border-default bg-surface px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-primary shadow-[0_14px_34px_-30px_var(--shadow-color)] sm:px-4 sm:py-2"
        >
          {{ sectionEyebrow }}
        </span>

        <div>
          <h1
            class="title-under-xs upper max-w-xl text-[28px] font-extrabold leading-[1.15] text-text-primary sm:text-[36px] lg:text-[44px]"
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
            class="subtitle-under-xs mt-3 max-w-xl text-sm leading-6 text-text-secondary sm:text-base sm:leading-7"
          >
            {{ sectionSubtitle }}
          </p>
        </div>

        <div
          v-if="accountHighlights.length"
          class="grid gap-2 sm:grid-cols-2 lg:max-w-lg"
        >
          <article
            v-for="(item, index) in accountHighlights"
            :key="item.id"
            class="rounded-[18px] border border-border-default bg-surface p-3 shadow-[0_16px_38px_-34px_var(--shadow-color)] sm:p-4"
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
          class="mx-auto w-full max-w-[420px] rounded-[24px] border border-border-default bg-surface p-4 shadow-[0_26px_70px_-44px_var(--shadow-color)] sm:p-6 lg:p-7"
          novalidate
          @submit.prevent="loginUser"
        >
          <div class="mb-5 sm:mb-6">
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-primary"
            >
              შესვლა
            </p>
            <h2
              class="title-under-xs upper mt-2 text-[26px] font-extrabold leading-tight text-text-primary sm:text-[30px]"
            >
              ანგარიშში შესვლა
            </h2>
            <p class="subtitle-under-xs mt-2 text-sm leading-6 text-text-secondary">
              შეიყვანე ელ.ფოსტა და პაროლი ანგარიშში შესასვლელად.
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
            class="mb-2"
            v-bind="passwordAttrs"
            label="პაროლი"
            type="password"
            autocomplete="current-password"
            :error="errors.password"
            :disabled="isAuthBusy"
          />

          <div class="mb-4 flex justify-end">
            <NuxtLink
              to="/forgot-password"
              class="text-sm font-semibold text-accent-primary transition-colors duration-200 hover:text-accent-hover"
            >
              პაროლი დაგავიწყდათ?
            </NuxtLink>
          </div>

          <div
            v-if="errorMessage"
            class="mb-4 rounded-[16px] border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error"
          >
            {{ errorMessage }}
          </div>

          <BaseButton
            type="submit"
            :full-width="true"
            class="mt-2 rounded-[16px]"
            :disabled="isAuthBusy"
          >
            {{ loading ? "მიმდინარეობს შესვლა..." : "შესვლა" }}
          </BaseButton>

          <div v-if="hasGoogleAuth" class="mt-5">
            <div class="mb-4 flex items-center gap-3">
              <span class="h-px flex-1 bg-border-default" aria-hidden="true" />
              <span class="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                ან
              </span>
              <span class="h-px flex-1 bg-border-default" aria-hidden="true" />
            </div>

            <div class="space-y-3">
              <GoogleAuthButton
                context="signin"
                :disabled="loading"
                :loading="googleLoading"
                @credential="loginWithGoogle"
                @error="handleGoogleError"
              />
              <p
                class="text-center text-[11px] leading-5 text-text-muted"
              >
                Google-ით გაგრძელებით ეთანხმები
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

          <div
            class="mt-5 border-t border-border-default pt-4 text-center text-sm"
          >
            <p class="text-text-secondary">
              ჯერ არ გაქვს ანგარიში?
              <NuxtLink
                to="/register"
                class="font-semibold text-accent-primary transition-colors duration-200 hover:text-accent-hover"
              >
                რეგისტრაცია
              </NuxtLink>
            </p>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
