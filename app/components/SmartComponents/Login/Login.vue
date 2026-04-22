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

type AccountHighlight = {
  id: number;
  title: string;
  copy: string;
  position: number;
};

const props = defineProps<{
  data?: SmartComponentData;
}>();

const { executeRecaptcha } = useRecaptcha();
const { applyAuthSession } = useAuthSession();
const router = useRouter();
const route = useRoute();
const globalStore = useGlobalStore();
const { loginSchema } = useAuthValidationSchemas();

const errorMessage = ref("");
const loading = ref(false);

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const sectionEyebrow = computed(() => sanitizeText(props.data?.buttonText));

const sectionTitle = computed(() => sanitizeText(props.data?.title));
const titleParts = computed(() => splitAutoMateTitleParts(sectionTitle.value));

const sectionSubtitle = computed(() => sanitizeText(props.data?.subtitle));

const accountHighlights = computed<AccountHighlight[]>(() => {
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
</script>

<template>
  <section
    class="relative isolate overflow-hidden bg-[linear-gradient(180deg,#fffaf6_0%,#ffffff_42%,#fff8f4_100%)] dark:bg-[linear-gradient(180deg,#08111f_0%,#0a1628_44%,#0d1b31_100%)]"
  >
    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.12),transparent_42%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.07),transparent_34%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.18),transparent_38%),radial-gradient(circle_at_top_right,rgba(96,165,250,0.12),transparent_32%)]"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute left-1/2 top-16 h-40 w-40 -translate-x-1/2 rounded-full bg-accent-primary/10 blur-3xl dark:bg-accent-primary/14"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute right-[14%] top-28 hidden h-48 w-48 rounded-full bg-[#7dd3fc]/10 blur-3xl dark:block"
      aria-hidden="true"
    />

    <div
      class="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:min-h-[680px] lg:grid-cols-[minmax(0,1fr)_minmax(400px,460px)] lg:items-center lg:gap-14 lg:px-8 lg:py-20"
    >
      <div class="relative lg:pr-6">
        <span
          v-if="sectionEyebrow"
          class="inline-flex items-center rounded-full border border-accent-primary/15 bg-surface/80 px-5 py-2.5 text-[16px] font-semibold uppercase tracking-[0.12em] text-accent-primary shadow-[0_18px_42px_-28px_rgba(255,107,53,0.45)] backdrop-blur dark:border-accent-primary/25 dark:bg-surface/55 dark:shadow-[0_24px_46px_-28px_rgba(255,107,53,0.28)]"
        >
          {{ sectionEyebrow }}
        </span>

        <h1
          class="title-under-xs mt-6 max-w-xl text-[34px] font-extrabold leading-tight text-text-primary sm:text-[42px] lg:text-[52px]"
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
          class="subtitle-under-xs mt-4 max-w-xl text-base leading-7 text-text-secondary sm:text-[17px]"
        >
          {{ sectionSubtitle }}
        </p>

        <div
          v-if="accountHighlights.length"
          class="mt-8 rounded-[28px] border border-border-default bg-surface/82 p-4 shadow-[0_24px_70px_-46px_var(--shadow-color)] backdrop-blur sm:p-5 dark:border-[#263651] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.78)_0%,rgba(17,28,51,0.88)_100%)] dark:shadow-[0_34px_84px_-46px_rgba(0,0,0,0.72)]"
        >
          <div class="grid gap-3 sm:grid-cols-2">
            <div
              v-for="(item, index) in accountHighlights"
              :key="item.id"
              class="rounded-[22px] border border-border-default bg-surface px-4 py-4 dark:border-[#263651] dark:bg-[linear-gradient(180deg,rgba(11,22,40,0.96)_0%,rgba(15,23,42,0.98)_100%)]"
            >
              <span
                class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-primary/10 text-xs font-bold text-accent-primary"
              >
                {{ index + 1 }}
              </span>
              <p class="mt-3 text-sm font-semibold text-text-primary">
                {{ item.title }}
              </p>
              <p class="mt-2 text-sm leading-6 text-text-secondary">
                {{ item.copy }}
              </p>
            </div>
          </div>
        </div>

        <div
          class="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-text-secondary"
        >
          <NuxtLink
            to="/register"
            class="font-semibold text-accent-primary transition-colors duration-200 hover:text-accent-hover"
          >
            ანგარიშის შექმნა
          </NuxtLink>
          <NuxtLink
            to="/"
            class="font-medium transition-colors duration-200 hover:text-accent-primary"
          >
            მთავარ გვერდზე დაბრუნება
          </NuxtLink>
        </div>
      </div>

      <div class="relative lg:justify-self-end">
        <div
          class="pointer-events-none absolute inset-x-10 -top-8 h-24 rounded-full bg-accent-primary/15 blur-3xl dark:bg-accent-primary/18"
          aria-hidden="true"
        />

        <form
          class="relative mx-auto w-full max-w-[440px] rounded-[28px] border border-border-default/90 bg-surface/95 p-5 shadow-[0_32px_80px_-42px_rgba(15,23,42,0.28)] backdrop-blur sm:p-8 dark:border-[#2b3d5d] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.94)_0%,rgba(17,28,51,0.98)_100%)] dark:shadow-[0_38px_92px_-50px_rgba(0,0,0,0.82)]"
          novalidate
          @submit.prevent="loginUser"
        >
          <div class="mb-6">
            <p
              class="text-xs font-semibold uppercase tracking-[0.16em] text-accent-primary"
            >
              შესვლა
            </p>
            <h2 class="title-under-xs mt-3 text-[30px] font-extrabold text-text-primary">
              კეთილი დაბრუნება
            </h2>
            <p class="subtitle-under-xs mt-2 text-sm leading-6 text-text-secondary">
              შეიყვანე ელ.ფოსტა და პაროლი, რომ შეხვიდე შენს პროფილში.
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
            class="mb-4"
            v-bind="passwordAttrs"
            label="პაროლი"
            type="password"
            autocomplete="current-password"
            :error="errors.password"
            :disabled="loading"
          />

          <div
            v-if="errorMessage"
            class="mb-4 rounded-[18px] border border-error/20 bg-error/5 px-4 py-3 text-sm text-error"
          >
            {{ errorMessage }}
          </div>

          <button
            type="submit"
            class="btn-min-h-44 mt-2 w-full rounded-[16px] bg-accent-primary px-4 py-3 text-sm font-semibold text-text-invert transition-colors duration-200 hover:bg-accent-hover active:bg-accent-pressed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="loading"
          >
            {{ loading ? "მიმდინარეობს შესვლა..." : "შესვლა" }}
          </button>

          <div
            class="mt-6 border-t border-border-default/80 pt-5 text-center text-sm"
          >
            <NuxtLink
              to="/forgot-password"
              class="relative inline-block pb-[2px] font-medium text-accent-primary no-underline after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-current after:opacity-60 after:content-[''] transition-colors duration-200 hover:text-accent-hover dark:text-[#ff8b63] dark:hover:text-[#ffb090]"
            >
              პაროლი დაგავიწყდათ?
            </NuxtLink>

            <p class="mt-3 text-text-secondary">
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
