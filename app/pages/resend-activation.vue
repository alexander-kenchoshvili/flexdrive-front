<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";

definePageMeta({
  skipCmsLoader: true,
});

const { executeRecaptcha } = useRecaptcha();
const { resendActivationSchema } = useAuthValidationSchemas();

const loading = ref(false);
const message = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

useNoindexPage({
  title: "აქტივაციის ბმულის თავიდან გაგზავნა",
  description: "აქტივაციის ბმულის თავიდან გაგზავნის ტექნიკური გვერდი.",
});

const { defineField, errors, handleSubmit, setFieldError } = useForm({
  validationSchema: toTypedSchema(resendActivationSchema),
  initialValues: {
    email: "",
  },
});

const [email, emailAttrs] = defineField("email");

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
    const priorityKeys = ["email", "detail", "message", "non_field_errors"];
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

const resendActivation = handleSubmit(async (values) => {
  loading.value = true;
  message.value = null;
  errorMessage.value = null;

  try {
    const recaptchaToken = await executeRecaptcha("resend_activation");
    const response = await secureFetchRaw<{ message?: string }>(
      "/accounts/activate/resend/",
      {
        method: "POST",
        body: {
          email: values.email,
          recaptcha_token: recaptchaToken,
        },
      },
    );

    message.value =
      response?.message ||
      "თუ ეს ელფოსტა სისტემაში არსებობს და ანგარიში ჯერ არ არის გააქტიურებული, ახალი აქტივაციის ბმული გაიგზავნა.";
  } catch (error: any) {
    const emailFieldError = extractFirstErrorMessage(error?.data?.email);
    if (emailFieldError) {
      setFieldError("email", emailFieldError);
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
    class="bg-[linear-gradient(135deg,var(--bg-primary)_0%,var(--surface)_46%,var(--section-soft)_100%)] text-text-primary"
  >
    <div
      class="container-fluid flex min-h-[420px] items-start justify-center py-6 sm:py-10 lg:min-h-[560px] lg:py-14 xl:py-16"
    >
      <form
        class="w-full max-w-[460px] rounded-[24px] border border-border-default bg-surface p-4 shadow-[0_26px_70px_-44px_var(--shadow-color)] sm:p-6 lg:p-7"
        novalidate
        @submit.prevent="resendActivation"
      >
        <div class="mb-5 text-center sm:mb-6">
          <p
            class="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-primary"
          >
            აქტივაციის ბმული
          </p>
          <h1
            class="title-under-xs upper mt-2 text-[26px] font-extrabold leading-tight text-text-primary sm:text-[30px]"
          >
            ბმულის თავიდან გაგზავნა
          </h1>
          <p
            class="subtitle-under-xs mt-2 text-sm leading-6 text-text-secondary"
          >
            მიუთითე ელ.ფოსტა და ახალ აქტივაციის ბმულს გამოგიგზავნით.
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
          :disabled="loading"
        />

        <BaseButton
          type="submit"
          :full-width="true"
          class="mt-2 rounded-[16px]"
          :disabled="loading"
        >
          {{ loading ? "იგზავნება..." : "ბმულის გაგზავნა" }}
        </BaseButton>

        <p
          v-if="message"
          class="mt-4 rounded-[16px] border border-success/20 bg-success/5 px-4 py-3 text-sm font-medium text-success"
        >
          {{ message }}
        </p>
        <p
          v-if="errorMessage"
          class="mt-4 rounded-[16px] border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error"
        >
          {{ errorMessage }}
        </p>

        <div
          class="mt-5 flex items-center justify-center border-t border-border-default pt-4 text-sm"
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
  </section>
</template>
