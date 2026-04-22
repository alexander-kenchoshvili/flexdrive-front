<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { CheckCircleIcon } from "@heroicons/vue/24/solid";

definePageMeta({
  skipCmsLoader: true,
});

const { executeRecaptcha } = useRecaptcha();
const route = useRoute();
const router = useRouter();
const { passwordHint, resetPasswordSchema } = useAuthValidationSchemas();

const token = route.params.token as string;
const message = ref<string | null>(null);
const errorMessage = ref<string | null>(null);
const loading = ref(false);
const isSuccessModalOpen = ref(false);

useNoindexPage({
  title: "პაროლის აღდგენა",
  description: "პაროლის აღდგენის ტექნიკური გვერდი.",
});

const { defineField, errors, handleSubmit, setFieldError } = useForm({
  validationSchema: toTypedSchema(resetPasswordSchema),
  initialValues: {
    password: "",
    confirmPassword: "",
  },
});

const [password, passwordAttrs] = defineField("password");
const [confirmPassword, confirmPasswordAttrs] = defineField("confirmPassword");

const closeSuccessModal = () => {
  isSuccessModalOpen.value = false;
  message.value = null;
  void router.push("/login");
};

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
    const priorityKeys = ["password", "detail", "message", "non_field_errors"];
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

const resetPassword = handleSubmit(async (values) => {
  errorMessage.value = null;
  message.value = null;
  loading.value = true;
  isSuccessModalOpen.value = false;

  try {
    const recaptchaToken = await executeRecaptcha("reset_password");
    await secureFetchRaw("/accounts/password/reset/", {
      method: "POST",
      body: {
        token,
        password: values.password,
        recaptcha_token: recaptchaToken,
      },
    });

    message.value = "პაროლი წარმატებით განახლდა. ახლა შეგიძლიათ შეხვიდეთ სისტემაში.";
    isSuccessModalOpen.value = true;
  } catch (error: any) {
    const passwordFieldError = extractFirstErrorMessage(error?.data?.password);
    if (passwordFieldError) {
      setFieldError("password", passwordFieldError);
    }

    const backendMessage = extractFirstErrorMessage(error?.data || error);
    errorMessage.value =
      backendMessage || "დაფიქსირდა შეცდომა. სცადეთ თავიდან.";
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
      class="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6 sm:py-14 lg:min-h-[640px] lg:px-8 lg:py-20"
    >
      <div class="relative w-full max-w-[560px]">
        <div
          class="pointer-events-none absolute inset-x-10 -top-8 h-24 rounded-full bg-accent-primary/15 blur-3xl dark:bg-accent-primary/18"
          aria-hidden="true"
        />

        <form
          class="relative rounded-[30px] border border-border-default/90 bg-surface/95 p-5 shadow-[0_32px_80px_-42px_rgba(15,23,42,0.28)] backdrop-blur sm:p-8 dark:border-[#2b3d5d] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.94)_0%,rgba(17,28,51,0.98)_100%)] dark:shadow-[0_38px_92px_-50px_rgba(0,0,0,0.82)]"
          novalidate
          @submit.prevent="resetPassword"
        >
          <div class="mb-6 text-center">
            <h1 class="title-under-xs text-[30px] font-extrabold text-text-primary sm:text-[34px]">
              პაროლის აღდგენა
            </h1>
          </div>

          <BaseInput
            v-model="password"
            class="mb-4"
            v-bind="passwordAttrs"
            label="ახალი პაროლი"
            type="password"
            autocomplete="new-password"
            :error="errors.password"
            :hint="passwordHint"
            :disabled="loading"
          />

          <BaseInput
            v-model="confirmPassword"
            class="mb-4"
            v-bind="confirmPasswordAttrs"
            label="გაიმეორეთ ახალი პაროლი"
            type="password"
            autocomplete="new-password"
            :error="errors.confirmPassword"
            :disabled="loading"
          />

          <button
            type="submit"
            class="btn-min-h-44 mt-2 w-full rounded-[16px] bg-accent-primary px-4 py-3 text-sm font-semibold text-text-invert transition-colors duration-200 hover:bg-accent-hover active:bg-accent-pressed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="loading"
          >
            {{ loading ? "იცვლება..." : "ახალი პაროლის შენახვა" }}
          </button>

          <p
            v-if="errorMessage"
            class="mt-4 rounded-[18px] border border-error/20 bg-error/5 px-4 py-3 text-sm text-error"
          >
            {{ errorMessage }}
          </p>

          <div
            class="mt-6 flex items-center justify-center border-t border-border-default/80 pt-5 text-sm text-text-secondary"
          >
            <NuxtLink
              to="/login"
              class="font-semibold text-accent-primary transition-colors duration-200 hover:text-accent-hover"
            >
              დაბრუნება ავტორიზაციაზე
            </NuxtLink>
          </div>
        </form>
      </div>
    </div>
  </section>

  <BaseModal
    :show="isSuccessModalOpen"
    title="პაროლი განახლდა"
    @close="closeSuccessModal"
  >
    <div class="flex flex-col items-center text-center">
      <div
        class="grid h-16 w-16 place-items-center rounded-full border border-accent-primary/20 bg-accent-primary/10 text-accent-primary"
      >
        <CheckCircleIcon class="h-8 w-8" aria-hidden="true" />
      </div>

      <p class="mt-5 max-w-md text-sm leading-7 text-text-secondary md:text-base">
        {{
          message ||
          "პაროლი წარმატებით განახლდა. ახლა შეგიძლიათ შეხვიდეთ სისტემაში."
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
        ავტორიზაციაზე გადასვლა
      </BaseButton>
    </template>
  </BaseModal>
</template>
