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
    const response = await secureFetchRaw<{ message?: string }>("/accounts/activate/resend/", {
      method: "POST",
      body: {
        email: values.email,
        recaptcha_token: recaptchaToken,
      },
    });

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
  <form
    class="mx-auto mt-12 w-full max-w-md rounded-xl border border-border-default bg-surface p-8 shadow-[0_8px_24px_var(--shadow-color)]"
    novalidate
    @submit.prevent="resendActivation"
  >
    <h2 class="title-under-xs mb-6 text-center text-2xl font-bold text-text-primary upper">
      აქტივაციის ბმულის თავიდან გაგზავნა
    </h2>

    <BaseInput
      v-model="email"
      class="mb-4"
      v-bind="emailAttrs"
      label="ელფოსტა"
      type="email"
      autocomplete="email"
      placeholder="you@example.com"
      :error="errors.email"
      :disabled="loading"
    />

    <button
      type="submit"
      class="btn-min-h-44 mt-2 w-full rounded-md bg-accent-primary px-4 py-3 font-semibold text-text-invert transition-colors hover:bg-accent-hover active:bg-accent-pressed disabled:cursor-not-allowed disabled:opacity-60"
      :disabled="loading"
    >
      {{ loading ? "იგზავნება..." : "ახალი აქტივაციის ბმულის გაგზავნა" }}
    </button>

    <p
      v-if="message"
      class="mt-4 rounded-md border border-border-default bg-surface-2 px-3 py-2 text-sm text-success"
    >
      {{ message }}
    </p>
    <p
      v-if="errorMessage"
      class="mt-4 rounded-md border border-border-default bg-surface-2 px-3 py-2 text-sm text-error"
    >
      {{ errorMessage }}
    </p>

    <div class="mt-4 text-center">
      <NuxtLink
        to="/login"
        class="text-sm font-medium text-link underline underline-offset-2 hover:text-link-hover"
      >
        დაბრუნება ავტორიზაციაზე
      </NuxtLink>
    </div>
  </form>
</template>
