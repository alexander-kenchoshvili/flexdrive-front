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
    class="bg-[linear-gradient(135deg,var(--bg-primary)_0%,var(--surface)_46%,var(--section-soft)_100%)] text-text-primary"
  >
    <div
      class="container-fluid grid gap-5 py-6 sm:py-10 lg:min-h-[560px] lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)] lg:items-start lg:gap-12 lg:py-14 xl:py-16"
    >
      <div class="order-2 space-y-4 lg:order-1 lg:max-w-xl lg:pr-6">
        <span
          class="inline-flex items-center rounded-full border border-border-default bg-surface px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-primary shadow-[0_14px_34px_-30px_var(--shadow-color)] sm:px-4 sm:py-2"
        >
          უსაფრთხო პაროლი
        </span>

        <div>
          <h1
            class="title-under-xs upper max-w-xl text-[28px] font-extrabold leading-[1.15] text-text-primary sm:text-[36px] lg:text-[44px]"
          >
            ახალი პაროლის დაყენება
          </h1>
          <p
            class="subtitle-under-xs mt-3 max-w-xl text-sm leading-6 text-text-secondary sm:text-base sm:leading-7"
          >
            შექმენი ახალი პაროლი და შემდეგ ჩვეულებრივ გააგრძელე ავტორიზაცია.
          </p>
        </div>

        <div class="grid gap-2 sm:grid-cols-2 lg:max-w-lg">
          <article
            class="rounded-[18px] border border-border-default bg-surface p-3 shadow-[0_16px_38px_-34px_var(--shadow-color)] sm:p-4"
          >
            <div class="flex items-center gap-3">
              <span
                class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-xs font-extrabold text-accent-primary"
              >
                1
              </span>
              <div class="min-w-0">
                <p class="text-sm font-bold leading-5 text-text-primary">
                  გამოიყენე ძლიერი პაროლი
                </p>
              </div>
            </div>
            <p
              class="mt-3 text-xs leading-5 text-text-secondary sm:text-sm sm:leading-6"
            >
              პაროლი უნდა აკმაყოფილებდეს ქვემოთ მოცემულ მოთხოვნებს.
            </p>
          </article>

          <article
            class="rounded-[18px] border border-border-default bg-surface p-3 shadow-[0_16px_38px_-34px_var(--shadow-color)] sm:p-4"
          >
            <div class="flex items-center gap-3">
              <span
                class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-xs font-extrabold text-accent-primary"
              >
                2
              </span>
              <div class="min-w-0">
                <p class="text-sm font-bold leading-5 text-text-primary">
                  შედი განახლებული პაროლით
                </p>
              </div>
            </div>
            <p
              class="mt-3 text-xs leading-5 text-text-secondary sm:text-sm sm:leading-6"
            >
              წარმატების შემდეგ ავტორიზაციის გვერდზე გადახვალ.
            </p>
          </article>
        </div>
      </div>

      <div class="order-1 lg:order-2 lg:justify-self-end">
        <form
          class="mx-auto w-full max-w-[440px] rounded-[24px] border border-border-default bg-surface p-4 shadow-[0_26px_70px_-44px_var(--shadow-color)] sm:p-6 lg:p-7"
          novalidate
          @submit.prevent="resetPassword"
        >
          <div class="mb-5 sm:mb-6">
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-primary"
            >
              პაროლის აღდგენა
            </p>
            <h2
              class="title-under-xs upper mt-2 text-[26px] font-extrabold leading-tight text-text-primary sm:text-[30px]"
            >
              ახალი პაროლი
            </h2>
            <p class="subtitle-under-xs mt-2 text-sm leading-6 text-text-secondary">
              შეიყვანე და გაიმეორე ახალი პაროლი ანგარიშისთვის.
            </p>
          </div>

          <BaseInput
            v-model="password"
            class="mb-3"
            v-bind="passwordAttrs"
            label="ახალი პაროლი"
            type="password"
            autocomplete="new-password"
            :error="errors.password"
            :disabled="loading"
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
            label="გაიმეორეთ ახალი პაროლი"
            type="password"
            autocomplete="new-password"
            :error="errors.confirmPassword"
            :disabled="loading"
          />

          <BaseButton
            type="submit"
            :full-width="true"
            class="mt-2 rounded-[16px]"
            :disabled="loading"
          >
            {{ loading ? "იცვლება..." : "ახალი პაროლის შენახვა" }}
          </BaseButton>

          <p
            v-if="errorMessage"
            class="mt-4 rounded-[16px] border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error"
          >
            {{ errorMessage }}
          </p>

          <div
            class="mt-5 flex items-center justify-center border-t border-border-default pt-4 text-sm text-text-secondary"
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

      <p
        v-if="message"
        class="mt-5 max-w-md text-sm leading-7 text-text-secondary md:text-base"
      >
        {{ message }}
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
