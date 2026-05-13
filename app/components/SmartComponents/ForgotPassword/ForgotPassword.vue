<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { CheckCircleIcon } from "@heroicons/vue/24/solid";
import type { SmartComponentData } from "~/types/page";

defineProps<{
  data?: SmartComponentData;
}>();

const { executeRecaptcha } = useRecaptcha();
const { forgotPasswordSchema } = useAuthValidationSchemas();

const message = ref("");
const errorMessage = ref("");
const loading = ref(false);
const isSuccessModalOpen = ref(false);
const { defineField, errors, handleSubmit, setFieldError, resetForm } = useForm({
  validationSchema: toTypedSchema(forgotPasswordSchema),
  initialValues: {
    email: "",
  },
});

const [email, emailAttrs] = defineField("email");

const closeSuccessModal = () => {
  isSuccessModalOpen.value = false;
  message.value = "";
};

const sendRequest = handleSubmit(async (values) => {
  loading.value = true;
  message.value = "";
  errorMessage.value = "";
  isSuccessModalOpen.value = false;

  try {
    const token = await executeRecaptcha("forgot_password");
    await secureFetchRaw("/accounts/password/forgot/", {
      method: "POST",
      body: {
        email: values.email,
        recaptcha_token: token,
      },
    });

    message.value =
      "თუ ეს ელფოსტა სისტემაში არსებობს, პაროლის აღდგენის ბმული გამოგიგზავნეთ. შეამოწმეთ შემოსულები.";
    resetForm({
      values: {
        email: "",
      },
    });
    isSuccessModalOpen.value = true;
  } catch (error: any) {
    const emailFieldError = error?.data?.email?.[0];
    if (emailFieldError) {
      setFieldError("email", emailFieldError);
    }

    errorMessage.value =
      error?.data?.detail ||
      error?.data?.message ||
      "დაფიქსირდა შეცდომა. სცადეთ თავიდან.";
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
      class="container-fluid grid gap-5 py-6 sm:py-10 lg:min-h-[560px] lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] lg:items-start lg:gap-12 lg:py-14 xl:py-16"
    >
      <div class="order-2 space-y-4 lg:order-1 lg:max-w-xl lg:pr-6">
        <span
          class="inline-flex items-center rounded-full border border-border-default bg-surface px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-primary shadow-[0_14px_34px_-30px_var(--shadow-color)] sm:px-4 sm:py-2"
        >
          ანგარიშის დაცვა
        </span>

        <div>
          <h1
            class="title-under-xs upper max-w-xl text-[28px] font-extrabold leading-[1.15] text-text-primary sm:text-[36px] lg:text-[44px]"
          >
            პაროლის აღდგენა
          </h1>
          <p
            class="subtitle-under-xs mt-3 max-w-xl text-sm leading-6 text-text-secondary sm:text-base sm:leading-7"
          >
            შეიყვანე ანგარიშის ელ.ფოსტა და აღდგენის ბმულს გამოგიგზავნით.
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
                  შეამოწმე ელ.ფოსტა
                </p>
              </div>
            </div>
            <p class="mt-3 text-xs leading-5 text-text-secondary sm:text-sm sm:leading-6">
              ბმული გაიგზავნება მხოლოდ იმ მისამართზე, რომელიც ანგარიშზეა მიბმული.
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
                  დააყენე ახალი პაროლი
                </p>
              </div>
            </div>
            <p class="mt-3 text-xs leading-5 text-text-secondary sm:text-sm sm:leading-6">
              ბმულის გახსნის შემდეგ შექმნი ახალ პაროლს და ჩვეულებრივ შეხვალ.
            </p>
          </article>
        </div>
      </div>

      <div class="order-1 lg:order-2 lg:justify-self-end">
        <form
          class="mx-auto w-full max-w-[420px] rounded-[24px] border border-border-default bg-surface p-4 shadow-[0_26px_70px_-44px_var(--shadow-color)] sm:p-6 lg:p-7"
          novalidate
          @submit.prevent="sendRequest"
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
              აღდგენის ბმული
            </h2>
            <p class="subtitle-under-xs mt-2 text-sm leading-6 text-text-secondary">
              მიუთითე ელ.ფოსტა და შემდეგი ნაბიჯი inbox-ში დაგხვდება.
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
            v-if="errorMessage"
            class="mt-4 rounded-[16px] border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error"
          >
            {{ errorMessage }}
          </p>

          <div
            class="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 border-t border-border-default pt-4 text-sm text-text-secondary"
          >
            <NuxtLink
              to="/login"
              class="font-semibold text-accent-primary transition-colors duration-200 hover:text-accent-hover"
            >
              დაბრუნება ავტორიზაციაზე
            </NuxtLink>
            <NuxtLink
              to="/register"
              class="font-medium transition-colors duration-200 hover:text-accent-primary"
            >
              რეგისტრაცია
            </NuxtLink>
          </div>
        </form>
      </div>
    </div>
  </section>

  <BaseModal
    :show="isSuccessModalOpen"
    title="პაროლის აღდგენის ბმული გამოგზავნილია"
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
        გასაგებია
      </BaseButton>
    </template>
  </BaseModal>
</template>
