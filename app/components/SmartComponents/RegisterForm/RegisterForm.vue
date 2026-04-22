<script setup lang="ts">
import { CheckCircleIcon } from "@heroicons/vue/24/solid";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { normalizeAuthRedirect } from "~/utils/authRouting";
import type { ContentItemData, SmartComponentData } from "~/types/page";
import { sanitizeText, splitAutoMateTitleParts } from "~/composables/helpers";

type RegisterBenefit = {
  id: number;
  title: string;
  copy: string;
  position: number;
};

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

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const sectionEyebrow = computed(() => sanitizeText(props.data?.buttonText));

const sectionTitle = computed(() => sanitizeText(props.data?.title));
const titleParts = computed(() => splitAutoMateTitleParts(sectionTitle.value));

const sectionSubtitle = computed(() => sanitizeText(props.data?.subtitle));

const registerBenefits = computed<RegisterBenefit[]>(() => {
  const list = props.data?.contentData?.list;

  if (!Array.isArray(list) || list.length === 0) {
    return [];
  }

  return list
    .map((item: ContentItemData, index) => ({
      id: toNumber(item.id, index + 1),
      position: toNumber(item.position, index + 1),
      title: sanitizeText(item.title),
      copy: sanitizeText(item.description),
    }))
    .filter((item) => item.title || item.copy)
    .sort((a, b) =>
      a.position === b.position ? a.id - b.id : a.position - b.position,
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

const { defineField, errors, handleSubmit, setFieldError, resetForm } = useForm(
  {
    validationSchema: toTypedSchema(registerSchema),
    initialValues: {
      email: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
    },
  },
);

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

const extractFirstErrorMessage = (payload: any): string | null => {
  if (!payload) return null;
  if (typeof payload === "string") return payload;

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const nested = extractFirstErrorMessage(item);
      if (nested) return nested;
    }
    return null;
  }

  if (typeof payload === "object") {
    const priorityKeys = [
      "password",
      "confirm_password",
      "terms_accepted",
      "email",
      "non_field_errors",
      "detail",
      "message",
    ];
    const keys = [...priorityKeys, ...Object.keys(payload)];
    const seen = new Set<string>();

    for (const key of keys) {
      if (seen.has(key) || !(key in payload)) continue;
      seen.add(key);
      const nested = extractFirstErrorMessage(payload[key]);
      if (nested) return nested;
    }
  }

  return null;
};

const applyBackendFieldErrors = (payload: any) => {
  if (!payload || typeof payload !== "object") return;

  const fieldMap = [
    { apiKey: "email", formKey: "email" },
    { apiKey: "password", formKey: "password" },
    { apiKey: "confirm_password", formKey: "confirmPassword" },
    { apiKey: "terms_accepted", formKey: "termsAccepted" },
  ] as const;

  for (const { apiKey, formKey } of fieldMap) {
    const message = extractFirstErrorMessage(payload[apiKey]);
    if (message) {
      setFieldError(formKey, message);
    }
  }
};

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

    const submitErrorPayload = null;
    if (submitErrorPayload) {
      const payload = submitErrorPayload;
      applyBackendFieldErrors(payload);

      errorMessage.value =
        extractFirstErrorMessage(payload) || "რეგისტრაცია ვერ შესრულდა.";
      return;
    }

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
    errorMessage.value = "დაფიქსირდა შეცდომა.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section
    class="relative isolate overflow-hidden bg-[linear-gradient(180deg,#fff7f0_0%,#fffdfa_24%,#fff8f1_58%,#fffaf6_100%)] dark:bg-[linear-gradient(180deg,#060f1d_0%,#0b1730_34%,#0e1c38_70%,#122246_100%)]"
  >
    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.16),transparent_34%),radial-gradient(circle_at_top_center,rgba(255,214,153,0.24),transparent_28%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_30%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.24),transparent_32%),radial-gradient(circle_at_top_center,rgba(251,191,36,0.16),transparent_26%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_30%)]"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -left-16 top-28 h-56 w-56 rounded-full bg-accent-primary/10 blur-3xl dark:bg-accent-primary/18"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute right-[8%] top-40 h-48 w-48 rounded-full bg-[#fde68a]/20 blur-3xl dark:bg-[#38bdf8]/12"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute bottom-10 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-[#fb7185]/10 blur-3xl dark:bg-[#f97316]/10"
      aria-hidden="true"
    />

    <div
      class="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:min-h-[720px] lg:grid-cols-[minmax(0,1fr)_minmax(430px,500px)] lg:items-start lg:gap-16 lg:px-8 lg:py-20"
    >
      <div class="relative lg:pr-4">
        <span
          v-if="sectionEyebrow"
          class="inline-flex items-center rounded-full border border-accent-primary/15 bg-surface/80 px-5 py-2.5 text-[16px] font-semibold uppercase tracking-[0.12em] text-accent-primary shadow-[0_18px_42px_-28px_rgba(255,107,53,0.45)] backdrop-blur dark:border-accent-primary/25 dark:bg-surface/55 dark:shadow-[0_24px_46px_-28px_rgba(255,107,53,0.28)]"
        >
          {{ sectionEyebrow }}
        </span>

        <h1
          v-if="sectionTitle"
          class="title-under-xs mt-5 max-w-xl text-[34px] font-extrabold leading-[1.04] text-text-primary sm:text-[42px] lg:text-[54px]"
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
          class="subtitle-under-xs mt-5 max-w-xl text-base leading-7 text-text-secondary sm:text-[17px]"
        >
          {{ sectionSubtitle }}
        </p>

        <div
          v-if="registerBenefits.length"
          class="mt-9 rounded-[30px] border border-border-default/80 bg-surface/72 p-4 shadow-[0_28px_80px_-48px_var(--shadow-color)] backdrop-blur sm:p-5 dark:border-[#294066] dark:bg-[linear-gradient(180deg,rgba(10,19,37,0.82)_0%,rgba(14,27,50,0.9)_100%)] dark:shadow-[0_34px_86px_-48px_rgba(0,0,0,0.82)]"
        >
          <ol class="space-y-3">
            <li
              v-for="(item, index) in registerBenefits"
              :key="item.id"
              class="grid grid-cols-[auto_1fr] gap-4 rounded-[22px] border border-border-default/70 bg-surface/80 px-4 py-4 dark:border-[#243755] dark:bg-[linear-gradient(180deg,rgba(10,19,37,0.92)_0%,rgba(14,24,44,0.98)_100%)]"
            >
              <span
                class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-accent-primary/20 bg-accent-primary/10 text-sm font-bold text-accent-primary"
              >
                {{ index + 1 }}
              </span>
              <div>
                <p
                  class="text-sm font-semibold text-text-primary sm:text-[15px]"
                >
                  {{ item.title }}
                </p>
                <p class="mt-1.5 text-sm leading-6 text-text-secondary">
                  {{ item.copy }}
                </p>
              </div>
            </li>
          </ol>
        </div>
      </div>

      <div class="relative lg:justify-self-end">
        <div
          class="pointer-events-none absolute inset-x-10 -top-10 h-28 rounded-full bg-accent-primary/16 blur-3xl dark:bg-accent-primary/22"
          aria-hidden="true"
        />

        <form
          class="relative mx-auto w-full max-w-[500px] rounded-[32px] border border-border-default/90 bg-surface/95 p-5 shadow-[0_36px_92px_-48px_rgba(15,23,42,0.34)] backdrop-blur sm:p-8 dark:border-[#2b436b] dark:bg-[linear-gradient(180deg,rgba(10,19,37,0.95)_0%,rgba(14,27,50,0.98)_100%)] dark:shadow-[0_42px_100px_-54px_rgba(0,0,0,0.86)]"
          novalidate
          @submit.prevent="submitForm"
        >
          <div class="mb-6">
            <p
              class="text-xs font-semibold uppercase tracking-[0.16em] text-accent-primary"
            >
              რეგისტრაცია
            </p>
            <h2
              class="title-under-xs mt-3 text-[30px] font-extrabold text-text-primary"
            >
              შექმენი ანგარიში
            </h2>
            <p
              class="subtitle-under-xs mt-2 text-sm leading-6 text-text-secondary"
            >
              ელ.ფოსტა და პაროლი საკმარისია, რომ პერსონალური სივრცე სწრაფად
              გაააქტიურო.
            </p>
          </div>

          <BaseInput
            v-model="email"
            class="mb-4"
            v-bind="emailAttrs"
            label="ელ.ფოსტა"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
            :error="errors.email"
            :disabled="loading"
          />

          <BaseInput
            v-model="password"
            class="mb-3"
            v-bind="passwordAttrs"
            label="პაროლი"
            type="password"
            autocomplete="new-password"
            :error="errors.password"
            :disabled="loading"
          />

          <div
            class="mb-4 rounded-[18px] border border-border-default/80 bg-surface/70 px-4 py-3 text-sm leading-6 text-text-secondary dark:border-[#263c5f] dark:bg-[rgba(12,22,40,0.82)]"
          >
            <span class="font-semibold text-text-primary"
              >პაროლის მოთხოვნა:</span
            >
            {{ passwordHint }}
          </div>

          <BaseInput
            v-model="confirmPassword"
            class="mb-4"
            v-bind="confirmPasswordAttrs"
            label="გაიმეორე პაროლი"
            type="password"
            autocomplete="new-password"
            :error="errors.confirmPassword"
            :disabled="loading"
          />

          <label
            class="mb-2 flex items-start gap-3 rounded-[18px] border border-border-default/80 bg-surface/72 px-4 py-3 text-sm font-medium text-text-secondary transition-colors duration-200 dark:border-[#263c5f] dark:bg-[rgba(12,22,40,0.82)]"
            :class="errors.termsAccepted ? 'border-error/40 text-error' : ''"
          >
            <input
              v-model="termsAccepted"
              type="checkbox"
              class="mt-0.5 h-4 w-4 rounded border border-border-default bg-surface-2 accent-accent-primary"
              :disabled="loading"
            />
            <span>
              ვეთანხმები
              <NuxtLink
                to="/terms"
                target="_blank"
                rel="noopener noreferrer"
                class="relative inline-block pb-[2px] font-semibold text-accent-primary no-underline after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-current after:opacity-60 after:content-[''] transition-colors duration-200 hover:text-accent-hover dark:text-[#ff8b63] dark:hover:text-[#ffb090]"
                @click.stop
              >
                წესებსა და პირობებს
              </NuxtLink>
              და
              <NuxtLink
                to="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                class="relative inline-block pb-[2px] font-semibold text-accent-primary no-underline after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-current after:opacity-60 after:content-[''] transition-colors duration-200 hover:text-accent-hover dark:text-[#ff8b63] dark:hover:text-[#ffb090]"
                @click.stop
              >
                კონფიდენციალურობის პოლიტიკას
              </NuxtLink>
            </span>
          </label>
          <p v-if="errors.termsAccepted" class="mb-4 text-sm text-error">
            {{ errors.termsAccepted }}
          </p>

          <button
            type="submit"
            class="btn-min-h-44 mt-4 w-full rounded-[16px] bg-accent-primary px-4 py-3 text-sm font-semibold text-text-invert transition-colors duration-200 hover:bg-accent-hover active:bg-accent-pressed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="loading"
          >
            {{ loading ? "მიმდინარეობს რეგისტრაცია..." : "რეგისტრაცია" }}
          </button>

          <div
            v-if="successMessage && !isSuccessModalOpen"
            class="mt-4 rounded-[18px] border border-success/20 bg-success/5 px-4 py-3 text-sm text-success"
          >
            {{ successMessage }}
          </div>

          <div
            v-if="errorMessage"
            class="mt-4 rounded-[18px] border border-error/20 bg-error/5 px-4 py-3 text-sm text-error"
          >
            {{ errorMessage }}
          </div>

          <div
            class="mt-6 border-t border-border-default/80 pt-5 text-center text-sm text-text-secondary"
          >
            <p>
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
        class="mt-5 max-w-md text-sm leading-7 text-text-secondary md:text-base"
      >
        {{
          successMessage ||
          "რეგისტრაცია წარმატებით დასრულდა. შეამოწმეთ ელფოსტა."
        }}
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
