import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { useAccountApi } from "~/composables/useAccountApi";
import { useCommerceValidationSchemas } from "~/composables/useCommerceValidationSchemas";
import { extractFirstErrorMessage } from "~/composables/commerce/errorUtils";
import type {
  AccountProfile,
  AccountProfileUpdatePayload,
} from "~/types/account";
import type { CheckoutPaymentMethod } from "~/types/commerce";

export type CheckoutFormValues = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  address_line: string;
  note: string;
  terms_accepted: boolean;
  payment_method: CheckoutPaymentMethod;
};

export type CheckoutFieldName = keyof CheckoutFormValues;
export type CheckoutFieldErrors = Partial<Record<CheckoutFieldName, string>>;

export const checkoutFieldOrder: CheckoutFieldName[] = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "city",
  "address_line",
  "terms_accepted",
  "payment_method",
  "note",
];

export const checkoutFieldSelectors: Record<CheckoutFieldName, string> = {
  first_name: '[data-checkout-field="first_name"]',
  last_name: '[data-checkout-field="last_name"]',
  email: '[data-checkout-field="email"]',
  phone: '[data-checkout-field="phone"]',
  city: '[data-checkout-field="city"]',
  address_line: '[data-checkout-field="address_line"]',
  terms_accepted: '[data-checkout-field="terms_accepted"]',
  payment_method: '[data-checkout-field="payment_method"]',
  note: '[data-checkout-field="note"]',
};

export const useCheckoutForm = (options?: { profileKey?: string }) => {
  const globalStore = useGlobalStore();
  const { getProfile, updateProfile } = useAccountApi();
  const { checkoutSchema } = useCommerceValidationSchemas();

  const {
    defineField,
    errors,
    handleSubmit: validateSubmit,
    setErrors,
    setFieldValue,
    values,
  } = useForm<CheckoutFormValues>({
    validationSchema: toTypedSchema(checkoutSchema),
    initialValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      city: "",
      address_line: "",
      note: "",
      terms_accepted: false,
      payment_method: "cash_on_delivery",
    },
  });

  const [firstName, firstNameAttrs] = defineField("first_name");
  const [lastName, lastNameAttrs] = defineField("last_name");
  const [email, emailAttrs] = defineField("email");
  const [phone, phoneAttrs] = defineField("phone");
  const [city, cityAttrs] = defineField("city");
  const [addressLine, addressLineAttrs] = defineField("address_line");
  const [note, noteAttrs] = defineField("note");
  const [termsAccepted] = defineField("terms_accepted");
  const [paymentMethod] = defineField("payment_method");

  const { data: checkoutProfileData } = useAsyncData<AccountProfile | null>(
    options?.profileKey || "checkout-profile",
    async () => (globalStore.currentUser ? getProfile() : null),
    {
      default: () => null,
      watch: [() => globalStore.currentUser?.id || null],
    },
  );

  const fillFieldIfBlank = (
    field: keyof CheckoutFormValues,
    nextValue: string | null | undefined,
  ) => {
    const normalized = String(nextValue || "").trim();

    if (!normalized || String(values[field] || "").trim()) {
      return;
    }

    setFieldValue(field, normalized);
  };

  const applyProfilePrefill = (profile: AccountProfile | null) => {
    if (!profile) return;

    fillFieldIfBlank("first_name", profile.first_name);
    fillFieldIfBlank("last_name", profile.last_name);
    fillFieldIfBlank("email", profile.email);
    fillFieldIfBlank("phone", profile.phone);
    fillFieldIfBlank("city", profile.city);
    fillFieldIfBlank("address_line", profile.address_line);
  };

  const buildProfileBackfillPayload = (
    profile: AccountProfile | null,
    submittedValues: CheckoutFormValues,
  ): Partial<AccountProfileUpdatePayload> => {
    if (!profile) return {};

    const payload: Partial<AccountProfileUpdatePayload> = {};

    if (!profile.first_name.trim() && submittedValues.first_name.trim()) {
      payload.first_name = submittedValues.first_name.trim();
    }

    if (!profile.last_name.trim() && submittedValues.last_name.trim()) {
      payload.last_name = submittedValues.last_name.trim();
    }

    if (!profile.phone.trim() && submittedValues.phone.trim()) {
      payload.phone = submittedValues.phone.trim();
    }

    if (!profile.city.trim() && submittedValues.city.trim()) {
      payload.city = submittedValues.city.trim();
    }

    if (!profile.address_line.trim() && submittedValues.address_line.trim()) {
      payload.address_line = submittedValues.address_line.trim();
    }

    return payload;
  };

  const resolveProfileForSync = async () => {
    if (!globalStore.currentUser) {
      return null;
    }

    if (checkoutProfileData.value) {
      return checkoutProfileData.value;
    }

    try {
      const profile = await getProfile();
      checkoutProfileData.value = profile;
      return profile;
    } catch {
      return null;
    }
  };

  const syncProfileBackfill = async (submittedValues: CheckoutFormValues) => {
    if (!globalStore.currentUser) {
      return;
    }

    const profile = await resolveProfileForSync();
    const profileBackfillPayload = buildProfileBackfillPayload(
      profile,
      submittedValues,
    );

    if (!Object.keys(profileBackfillPayload).length) {
      return;
    }

    try {
      checkoutProfileData.value = await updateProfile(profileBackfillPayload);
    } catch {
      // Profile sync is best-effort and must not block a successful checkout.
    }
  };

  const extractFieldErrors = (error: unknown): CheckoutFieldErrors => {
    const payload =
      (
        error as
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
        error as
          | {
              response?: {
                _data?: unknown;
                data?: unknown;
              };
            }
          | undefined
      )?.response?._data ??
      (
        error as
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

    const nextErrors: CheckoutFieldErrors = {};
    const validFields = new Set<CheckoutFieldName>(checkoutFieldOrder);

    for (const [key, value] of Object.entries(
      payload as Record<string, unknown>,
    )) {
      if (!validFields.has(key as CheckoutFieldName)) continue;

      const message = extractFirstErrorMessage(value);
      if (message) {
        nextErrors[key as CheckoutFieldName] = message;
      }
    }

    return nextErrors;
  };

  const scrollToFirstInvalidField = async (fieldErrors: CheckoutFieldErrors) => {
    if (!import.meta.client) return;

    const firstInvalidField = checkoutFieldOrder.find((field) =>
      Boolean(fieldErrors[field]?.trim()),
    );

    if (!firstInvalidField) return;

    await nextTick();

    const target = document.querySelector<HTMLElement>(
      checkoutFieldSelectors[firstInvalidField],
    );

    if (!target) return;

    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "center",
      inline: "nearest",
    });
  };

  watch(
    checkoutProfileData,
    (nextProfile) => {
      applyProfilePrefill(nextProfile);
    },
    { immediate: true },
  );

  watch(
    () => globalStore.currentUser?.email,
    (nextEmail) => {
      if (
        typeof nextEmail === "string" &&
        nextEmail.trim() &&
        !String(values.email || "").trim()
      ) {
        setFieldValue("email", nextEmail.trim());
      }
    },
    { immediate: true },
  );

  return {
    errors,
    values,
    validateSubmit,
    setErrors,
    setFieldValue,
    firstName,
    firstNameAttrs,
    lastName,
    lastNameAttrs,
    email,
    emailAttrs,
    phone,
    phoneAttrs,
    city,
    cityAttrs,
    addressLine,
    addressLineAttrs,
    note,
    noteAttrs,
    termsAccepted,
    paymentMethod,
    extractFieldErrors,
    scrollToFirstInvalidField,
    syncProfileBackfill,
  };
};
