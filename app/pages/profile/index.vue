<script setup lang="ts">
import { ExclamationTriangleIcon } from "@heroicons/vue/24/outline";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import BaseButton from "~/components/common/BaseButton.vue";
import BaseInput from "~/components/common/BaseInput.vue";
import ProfileInfoSection from "~/components/profile/ProfileInfoSection.vue";
import ProfileInfoSkeleton from "~/components/profile/ProfileInfoSkeleton.vue";
import ProfileShell from "~/components/profile/ProfileShell.vue";
import { useAccountApi } from "~/composables/useAccountApi";
import { useAccountValidationSchemas } from "~/composables/useAccountValidationSchemas";
import type {
  AccountProfile,
  AccountProfileUpdatePayload,
} from "~/types/account";

type AccountFieldErrors = Partial<
  Record<keyof AccountProfileUpdatePayload, string>
>;

definePageMeta({
  skipCmsLoader: true,
  middleware: "auth-required",
});

const globalStore = useGlobalStore();
const { resetState } = useAuth();
const { getProfile, updateProfile, deleteProfile } = useAccountApi();
const { accountProfileSchema } = useAccountValidationSchemas();

const isClientReady = ref(false);
const isEditing = ref(false);
const savePending = ref(false);
const formError = ref<string | null>(null);
const autoEditInitialized = ref(false);
const isDeleteModalOpen = ref(false);
const deletePending = ref(false);
const deleteError = ref<string | null>(null);

const mapProfileToForm = (
  profile: AccountProfile,
): AccountProfileUpdatePayload => ({
  first_name: profile.first_name || "",
  last_name: profile.last_name || "",
  email: profile.email || "",
  phone: profile.phone || "",
  city: profile.city || "",
  address_line: profile.address_line || "",
});

const { defineField, errors, handleSubmit, resetForm, setErrors } =
  useForm<AccountProfileUpdatePayload>({
    validationSchema: toTypedSchema(accountProfileSchema),
    initialValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      city: "",
      address_line: "",
    },
  });

const [firstName, firstNameAttrs] = defineField("first_name");
const [lastName, lastNameAttrs] = defineField("last_name");
const [email, emailAttrs] = defineField("email");
const [phone, phoneAttrs] = defineField("phone");
const [city, cityAttrs] = defineField("city");
const [addressLine, addressLineAttrs] = defineField("address_line");

const shouldLoadProfile = computed(
  () =>
    isClientReady.value &&
    globalStore.authResolved &&
    Boolean(globalStore.currentUser),
);

const {
  data: profileData,
  pending,
  error,
  refresh,
} = useAsyncData("account-profile", () => getProfile(), {
  server: false,
  immediate: false,
});

const profile = computed(() => profileData.value || null);
const resolvedProfile = computed(() => profile.value as AccountProfile);
const isInitialLoading = computed(
  () => !shouldLoadProfile.value || (pending.value && !profile.value),
);
const hasHardLoadError = computed(
  () => !isInitialLoading.value && !profile.value && Boolean(error.value),
);

const extractFirstErrorMessage = (payload: unknown): string | null => {
  if (!payload) return null;

  if (typeof payload === "string") {
    return payload;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const nestedMessage = extractFirstErrorMessage(item);
      if (nestedMessage) return nestedMessage;
    }
    return null;
  }

  if (typeof payload === "object") {
    for (const value of Object.values(payload as Record<string, unknown>)) {
      const nestedMessage = extractFirstErrorMessage(value);
      if (nestedMessage) return nestedMessage;
    }
  }

  return null;
};

const translateFieldMessage = (
  field: keyof AccountProfileUpdatePayload,
  message: string,
) => {
  if (field === "email" && message.toLowerCase().includes("already exists")) {
    return "ეს ელფოსტა უკვე გამოიყენება.";
  }

  return message;
};

const extractFieldErrors = (apiError: unknown): AccountFieldErrors => {
  const payload =
    (
      apiError as
        | {
            data?: unknown;
            response?: {
              _data?: unknown;
              data?: unknown;
            };
          }
        | undefined
    )?.data ??
    (
      apiError as
        | {
            response?: {
              _data?: unknown;
              data?: unknown;
            };
          }
        | undefined
    )?.response?._data ??
    (
      apiError as
        | {
            response?: {
              data?: unknown;
            };
          }
        | undefined
    )?.response?.data;

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }

  const validFields = new Set<keyof AccountProfileUpdatePayload>([
    "first_name",
    "last_name",
    "email",
    "phone",
    "city",
    "address_line",
  ]);

  const nextErrors: AccountFieldErrors = {};

  for (const [key, value] of Object.entries(
    payload as Record<string, unknown>,
  )) {
    if (!validFields.has(key as keyof AccountProfileUpdatePayload)) continue;

    const message = extractFirstErrorMessage(value);
    if (!message) continue;

    nextErrors[key as keyof AccountProfileUpdatePayload] =
      translateFieldMessage(key as keyof AccountProfileUpdatePayload, message);
  }

  return nextErrors;
};

const normalizeApiErrorMessage = (apiError: unknown, fallback: string) => {
  const normalizedError = apiError as
    | {
        data?: unknown;
        response?: {
          _data?: unknown;
          data?: unknown;
        };
        message?: string;
      }
    | undefined;

  return (
    extractFirstErrorMessage(normalizedError?.data) ||
    extractFirstErrorMessage(normalizedError?.response?._data) ||
    extractFirstErrorMessage(normalizedError?.response?.data) ||
    normalizedError?.message ||
    fallback
  );
};

const syncFormWithProfile = (nextProfile: AccountProfile | null) => {
  if (!nextProfile) return;

  resetForm({
    values: mapProfileToForm(nextProfile),
  });
};

const shouldAutoOpenEditMode = (nextProfile: AccountProfile) =>
  !nextProfile.first_name.trim() &&
  !nextProfile.last_name.trim() &&
  !nextProfile.phone.trim() &&
  !nextProfile.city.trim() &&
  !nextProfile.address_line.trim();

watch(
  profile,
  (nextProfile) => {
    syncFormWithProfile(nextProfile);

    if (!nextProfile || autoEditInitialized.value) {
      return;
    }

    if (shouldAutoOpenEditMode(nextProfile)) {
      isEditing.value = true;
    }

    autoEditInitialized.value = true;
  },
  { immediate: true },
);

watch(
  shouldLoadProfile,
  (canLoadProfile) => {
    if (!canLoadProfile) {
      return;
    }

    void refresh();
  },
  { immediate: true },
);

const openEditMode = () => {
  if (!profile.value) return;
  formError.value = null;
  setErrors({});
  syncFormWithProfile(profile.value);
  isEditing.value = true;
};

const closeEditMode = () => {
  formError.value = null;
  setErrors({});
  syncFormWithProfile(profile.value);
  isEditing.value = false;
};

const openDeleteModal = () => {
  deleteError.value = null;
  isDeleteModalOpen.value = true;
};

const closeDeleteModal = () => {
  if (deletePending.value) return;

  deleteError.value = null;
  isDeleteModalOpen.value = false;
};

const retryLoad = async () => {
  await refresh();
};

onMounted(() => {
  isClientReady.value = true;
});

const submitProfileForm = handleSubmit(async (submittedValues) => {
  if (savePending.value) return;

  formError.value = null;
  setErrors({});
  savePending.value = true;

  try {
    const updatedProfile = await updateProfile({
      first_name: submittedValues.first_name.trim(),
      last_name: submittedValues.last_name.trim(),
      email: submittedValues.email.trim(),
      phone: submittedValues.phone.trim(),
      city: submittedValues.city.trim(),
      address_line: submittedValues.address_line.trim(),
    });

    profileData.value = updatedProfile;

    if (globalStore.currentUser) {
      globalStore.currentUser = {
        ...globalStore.currentUser,
        email: updatedProfile.email,
      };
    }

    syncFormWithProfile(updatedProfile);
    isEditing.value = false;
  } catch (submitError) {
    const nextFieldErrors = extractFieldErrors(submitError);
    setErrors(nextFieldErrors);

    if (!Object.keys(nextFieldErrors).length) {
      formError.value = normalizeApiErrorMessage(
        submitError,
        "პროფილის განახლება ვერ მოხერხდა. გთხოვ სცადო ხელახლა.",
      );
    }
  } finally {
    savePending.value = false;
  }
});

const deleteAccount = async () => {
  if (deletePending.value) return;

  deleteError.value = null;
  deletePending.value = true;

  try {
    await deleteProfile();
    resetState();
    isDeleteModalOpen.value = false;
    await navigateTo("/");
  } catch (deleteAccountError) {
    deleteError.value = normalizeApiErrorMessage(
      deleteAccountError,
      "ანგარიშის გაუქმება ვერ მოხერხდა. გთხოვ სცადო ხელახლა.",
    );
  } finally {
    deletePending.value = false;
  }
};

useNoindexPage({
  title: "პროფილი",
  description:
    "მართე პირადი ინფორმაცია და ძირითადი მიწოდების მისამართი FlexDrive-ის პროფილის გვერდიდან.",
});
</script>

<template>
  <ProfileShell
    active-section="info"
    eyebrow="ანგარიში"
    subtitle="აქ შეგიძლია შეცვალო პირადი და ძირითადი მიწოდების ინფორმაცია."
  >
    <ProfileInfoSkeleton v-if="isInitialLoading" />

    <section
      v-else-if="hasHardLoadError"
      class="rounded-[28px] border border-error/30 bg-surface p-6 text-sm text-text-secondary shadow-[0_24px_60px_-38px_var(--shadow-color)]"
    >
      <p class="text-base font-semibold text-text-primary">
        პროფილის მონაცემების ჩატვირთვა ვერ მოხერხდა.
      </p>
      <p class="mt-2">
        გთხოვ სცადო თავიდან ან მოგვიანებით დაბრუნდე ამ გვერდზე.
      </p>
      <div class="mt-4 flex flex-col gap-3 sm:flex-row">
        <BaseButton type="button" variant="primary" @click="retryLoad">
          თავიდან ცდა
        </BaseButton>
        <BaseButton as="nuxt-link" to="/" variant="secondary">
          მთავარზე დაბრუნება
        </BaseButton>
      </div>
    </section>

    <template v-else>
      <ProfileInfoSection v-if="!isEditing" :profile="resolvedProfile">
        <template #action>
          <BaseButton
            type="button"
            variant="accent-outline"
            class="px-5 py-3"
            @click="openEditMode"
          >
            რედაქტირება
          </BaseButton>
        </template>
      </ProfileInfoSection>

      <section
        v-else
        class="rounded-[28px] border border-border-default bg-surface p-6 shadow-[0_24px_60px_-38px_var(--shadow-color)] md:p-7"
      >
        <div
          class="flex flex-col gap-4 border-b border-border-default pb-6 sm:flex-row sm:items-start sm:justify-between"
        >
          <div class="max-w-2xl">
            <p
              class="text-xs font-semibold uppercase tracking-[0.14em] text-accent-primary"
            >
              ანგარიშის ინფორმაცია
            </p>
            <h2
              class="title-under-xs mt-2 text-[28px] font-extrabold leading-tight text-text-primary"
            >
              მონაცემების რედაქტირება
            </h2>
            <p
              class="subtitle-under-xs mt-3 text-sm leading-7 text-text-secondary"
            >
              შეცვალე ის მონაცემები, რომლებიც პროფილში და მიწოდების დეტალებში
              უნდა გამოჩნდეს.
            </p>
          </div>

          <BaseButton
            type="button"
            variant="secondary"
            class="px-5 py-3"
            @click="closeEditMode"
          >
            გაუქმება
          </BaseButton>
        </div>

        <div
          v-if="formError"
          class="mt-6 rounded-[20px] border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
        >
          {{ formError }}
        </div>

        <form
          class="mt-6 space-y-6"
          novalidate
          @submit.prevent="submitProfileForm"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <BaseInput
              v-model="firstName"
              v-bind="firstNameAttrs"
              label="სახელი *"
              autocomplete="given-name"
              placeholder="შეიყვანე სახელი"
              :error="errors.first_name"
              :disabled="savePending"
            />

            <BaseInput
              v-model="lastName"
              v-bind="lastNameAttrs"
              label="გვარი *"
              autocomplete="family-name"
              placeholder="შეიყვანე გვარი"
              :error="errors.last_name"
              :disabled="savePending"
            />

            <BaseInput
              v-model="email"
              v-bind="emailAttrs"
              label="ელფოსტა *"
              type="email"
              autocomplete="email"
              placeholder="name@example.com"
              :error="errors.email"
              :disabled="savePending"
            />

            <BaseInput
              v-model="phone"
              v-bind="phoneAttrs"
              label="ტელეფონი *"
              type="tel"
              autocomplete="tel"
              placeholder="შეიყვანე ნომერი"
              :error="errors.phone"
              :disabled="savePending"
            />

            <BaseInput
              v-model="city"
              v-bind="cityAttrs"
              label="ქალაქი *"
              autocomplete="address-level2"
              placeholder="მაგალითად: თბილისი"
              :error="errors.city"
              :disabled="savePending"
            />

            <BaseInput
              v-model="addressLine"
              v-bind="addressLineAttrs"
              class="md:col-span-2"
              label="მისამართი *"
              autocomplete="street-address"
              placeholder="ქუჩა, ნომერი, ბინა"
              :error="errors.address_line"
              :disabled="savePending"
            />
          </div>

          <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <BaseButton
              type="button"
              variant="secondary"
              class="px-6 py-3"
              :disabled="savePending"
              @click="closeEditMode"
            >
              გაუქმება
            </BaseButton>
            <BaseButton
              type="submit"
              variant="primary"
              class="px-6 py-3"
              :loading="savePending"
              :disabled="savePending"
            >
              შენახვა
            </BaseButton>
          </div>
        </form>
      </section>

      <section
        class="mt-6 rounded-[28px] border border-error/25 bg-[linear-gradient(180deg,rgba(239,68,68,0.06)_0%,rgba(239,68,68,0.02)_100%)] p-6 shadow-[0_24px_60px_-38px_var(--shadow-color)] md:p-7"
      >
        <div
          class="flex flex-col gap-5 border-b border-border-default pb-6 sm:flex-row sm:items-start sm:justify-between"
        >
          <div class="max-w-2xl">
            <p
              class="text-xs font-semibold uppercase tracking-[0.14em] text-error"
            >
              საფრთხის ზონა
            </p>
            <h2
              class="title-under-xs mt-2 text-[28px] font-extrabold leading-tight text-text-primary"
            >
              ანგარიშის გაუქმება
            </h2>
            <p
              class="subtitle-under-xs mt-3 text-sm leading-7 text-text-secondary"
            >
              თუ პროფილი აღარ გჭირდება, შეგიძლია სრულად გააუქმო ანგარიში. ეს
              მოქმედება შეუქცევადია.
            </p>
          </div>

          <BaseButton
            type="button"
            variant="danger"
            class="px-5 py-3"
            @click="openDeleteModal"
          >
            ანგარიშის გაუქმება
          </BaseButton>
        </div>

        <div
          class="mt-5 flex items-center gap-3 text-sm leading-7 text-text-secondary"
        >
          <span
            class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-error/20 bg-error/10 text-error"
          >
            <ExclamationTriangleIcon class="h-5 w-5" aria-hidden="true" />
          </span>

          <p>
            ანგარიშის გაუქმების შემდეგ პროფილი, შენახული მონაცემები და პირადი
            სივრცე აღარ იქნება ხელმისაწვდომი.
          </p>
        </div>
      </section>
    </template>
  </ProfileShell>

  <BaseModal
    :show="isDeleteModalOpen"
    title="ანგარიშის გაუქმება"
    @close="closeDeleteModal"
  >
    <div class="flex flex-col gap-4">
      <div
        class="flex items-start gap-3 rounded-[20px] border border-error/20 bg-error/5 px-4 py-4"
      >
        <span
          class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-error/20 bg-error/10 text-error"
        >
          <ExclamationTriangleIcon class="h-5 w-5" aria-hidden="true" />
        </span>

        <div>
          <p class="text-sm font-semibold text-text-primary">
            დარწმუნებული ხარ, რომ ანგარიშის გაუქმება გინდა?
          </p>
          <p class="mt-2 text-sm leading-7 text-text-secondary">
            ეს მოქმედება შეუქცევადია და პროფილის მონაცემებს ვეღარ აღადგენ.
          </p>
        </div>
      </div>

      <p
        v-if="deleteError"
        class="rounded-[18px] border border-error/20 bg-error/5 px-4 py-3 text-sm text-error"
      >
        {{ deleteError }}
      </p>
    </div>

    <template #footer>
      <BaseButton
        type="button"
        variant="secondary"
        size="lg"
        :disabled="deletePending"
        @click="closeDeleteModal"
      >
        დაბრუნება
      </BaseButton>
      <BaseButton
        type="button"
        variant="danger"
        size="lg"
        :loading="deletePending"
        :disabled="deletePending"
        @click="deleteAccount"
      >
        ანგარიშის გაუქმება
      </BaseButton>
    </template>
  </BaseModal>
</template>
