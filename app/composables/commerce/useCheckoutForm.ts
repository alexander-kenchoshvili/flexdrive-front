import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { useAccountApi } from "~/composables/useAccountApi";
import { useCommerceApi } from "~/composables/commerce/useCommerceApi";
import { useCommerceValidationSchemas } from "~/composables/useCommerceValidationSchemas";
import {
  extractFirstErrorMessage,
  normalizeApiErrorMessage,
} from "~/composables/commerce/errorUtils";
import type {
  AccountProfile,
  AccountProfileUpdatePayload,
} from "~/types/account";
import type {
  CheckoutBuyerType,
  CheckoutPaymentMethod,
  CommerceDeliveryCity,
  CommerceDeliveryQuote,
  CommerceDeliveryRegion,
} from "~/types/commerce";

export type CheckoutFormValues = {
  buyer_type: CheckoutBuyerType;
  company_name: string;
  company_identification_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  delivery_region_id: number | null;
  delivery_city_id: number | null;
  city: string;
  address_line: string;
  note: string;
  terms_accepted: boolean;
  payment_method: CheckoutPaymentMethod;
};

export type CheckoutFieldName = keyof CheckoutFormValues;
export type CheckoutFieldErrors = Partial<Record<CheckoutFieldName, string>>;

export const CHECKOUT_CASH_ON_DELIVERY_ENABLED = false;
export const CHECKOUT_DEFAULT_PAYMENT_METHOD: CheckoutPaymentMethod = "card";

export const checkoutFieldOrder: CheckoutFieldName[] = [
  "buyer_type",
  "company_name",
  "company_identification_code",
  "first_name",
  "last_name",
  "email",
  "phone",
  "delivery_region_id",
  "delivery_city_id",
  "city",
  "address_line",
  "terms_accepted",
  "payment_method",
  "note",
];

export const checkoutFieldSelectors: Record<CheckoutFieldName, string> = {
  buyer_type: '[data-checkout-field="buyer_type"]',
  company_name: '[data-checkout-field="company_name"]',
  company_identification_code:
    '[data-checkout-field="company_identification_code"]',
  first_name: '[data-checkout-field="first_name"]',
  last_name: '[data-checkout-field="last_name"]',
  email: '[data-checkout-field="email"]',
  phone: '[data-checkout-field="phone"]',
  delivery_region_id: '[data-checkout-field="delivery_region_id"]',
  delivery_city_id: '[data-checkout-field="delivery_city_id"]',
  city: '[data-checkout-field="delivery_city_id"]',
  address_line: '[data-checkout-field="address_line"]',
  terms_accepted: '[data-checkout-field="terms_accepted"]',
  payment_method: '[data-checkout-field="payment_method"]',
  note: '[data-checkout-field="note"]',
};

export const useCheckoutForm = (options?: {
  profileKey?: string;
  source?: "cart" | "buy_now";
}) => {
  const globalStore = useGlobalStore();
  const { getProfile, updateProfile } = useAccountApi();
  const { getDeliveryRegions, getDeliveryCities, getDeliveryQuote } =
    useCommerceApi();
  const { checkoutSchema } = useCommerceValidationSchemas();

  const {
    defineField,
    errors,
    handleSubmit: validateSubmit,
    setErrors,
    setFieldError,
    setFieldValue,
    values,
  } = useForm<CheckoutFormValues>({
    validationSchema: toTypedSchema(checkoutSchema),
    initialValues: {
      buyer_type: "individual",
      company_name: "",
      company_identification_code: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      delivery_region_id: null,
      delivery_city_id: null,
      city: "",
      address_line: "",
      note: "",
      terms_accepted: false,
      payment_method: CHECKOUT_DEFAULT_PAYMENT_METHOD,
    },
  });

  const [firstName, firstNameAttrs] = defineField("first_name");
  const [buyerType] = defineField("buyer_type");
  const [companyName, companyNameAttrs] = defineField("company_name");
  const [companyIdentificationCode, companyIdentificationCodeAttrs] =
    defineField("company_identification_code");
  const [lastName, lastNameAttrs] = defineField("last_name");
  const [email, emailAttrs] = defineField("email");
  const [phone, phoneAttrs] = defineField("phone");
  const [deliveryRegionId] = defineField("delivery_region_id");
  const [deliveryCityId] = defineField("delivery_city_id");
  const [addressLine, addressLineAttrs] = defineField("address_line");
  const [note, noteAttrs] = defineField("note");
  const [termsAccepted] = defineField("terms_accepted");
  const [paymentMethod] = defineField("payment_method");

  const deliveryCities = ref<CommerceDeliveryCity[]>([]);
  const deliveryCitiesPending = ref(false);
  const deliveryCitiesError = ref<string | null>(null);
  let deliveryCitiesRequestId = 0;
  const deliveryQuote = ref<CommerceDeliveryQuote | null>(null);
  const deliveryQuotePending = ref(false);
  const deliveryQuoteError = ref<string | null>(null);
  let deliveryQuoteRequestId = 0;

  const {
    data: deliveryRegionsData,
    pending: deliveryRegionsPending,
    error: deliveryRegionsError,
    refresh: refreshDeliveryRegions,
  } = useAsyncData(
    `${options?.profileKey || "checkout-profile"}-delivery-regions`,
    () => getDeliveryRegions(),
    { default: () => ({ results: [] }) },
  );

  const deliveryRegions = computed<CommerceDeliveryRegion[]>(
    () => deliveryRegionsData.value?.results || [],
  );
  const deliveryRegionOptions = computed(() =>
    deliveryRegions.value.map((region) => ({
      label: region.name,
      value: region.id,
    })),
  );
  const deliveryCityOptions = computed(() =>
    deliveryCities.value.map((cityOption) => ({
      label: cityOption.name,
      value: cityOption.id,
    })),
  );
  const selectedDeliveryRegion = computed(
    () =>
      deliveryRegions.value.find(
        (region) => region.id === deliveryRegionId.value,
      ) || null,
  );

  const loadDeliveryCities = async (regionId: number) => {
    const requestId = ++deliveryCitiesRequestId;
    deliveryCitiesPending.value = true;
    deliveryCitiesError.value = null;

    try {
      const response = await getDeliveryCities(regionId);
      if (requestId === deliveryCitiesRequestId) {
        deliveryCities.value = response.results;
      }
    } catch {
      if (requestId === deliveryCitiesRequestId) {
        deliveryCities.value = [];
        deliveryCitiesError.value =
          "ქალაქებისა და დასახლებების ჩამონათვალი ვერ ჩაიტვირთა.";
      }
    } finally {
      if (requestId === deliveryCitiesRequestId) {
        deliveryCitiesPending.value = false;
      }
    }
  };

  const retryDeliveryLocations = async () => {
    if (deliveryRegionsError.value) {
      await refreshDeliveryRegions();
    }

    if (deliveryRegionId.value) {
      await loadDeliveryCities(deliveryRegionId.value);
    }
  };

  const loadDeliveryQuote = async (regionId: number, cityId: number) => {
    const requestId = ++deliveryQuoteRequestId;
    deliveryQuote.value = null;
    deliveryQuotePending.value = true;
    deliveryQuoteError.value = null;

    try {
      const quote = await getDeliveryQuote({
        source: options?.source || "cart",
        delivery_region_id: regionId,
        delivery_city_id: cityId,
      });
      if (requestId === deliveryQuoteRequestId) {
        deliveryQuote.value = quote;
      }
    } catch (error) {
      if (requestId === deliveryQuoteRequestId) {
        deliveryQuoteError.value = normalizeApiErrorMessage(
          error,
          "მიწოდების ფასი ვერ დაითვალა. სცადეთ ხელახლა.",
        );
      }
    } finally {
      if (requestId === deliveryQuoteRequestId) {
        deliveryQuotePending.value = false;
      }
    }
  };

  const retryDeliveryQuote = async () => {
    if (
      typeof deliveryRegionId.value === "number" &&
      typeof deliveryCityId.value === "number"
    ) {
      await loadDeliveryQuote(
        deliveryRegionId.value,
        deliveryCityId.value,
      );
    }
  };

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

  watch(deliveryRegionId, (nextRegionId) => {
    deliveryCitiesRequestId += 1;
    deliveryCities.value = [];
    deliveryCitiesPending.value = false;
    deliveryCitiesError.value = null;
    deliveryQuoteRequestId += 1;
    deliveryQuote.value = null;
    deliveryQuotePending.value = false;
    deliveryQuoteError.value = null;
    setFieldValue("delivery_city_id", null, false);
    setFieldValue("city", "", false);
    setFieldError("delivery_city_id", undefined);
    setFieldError("city", undefined);

    if (typeof nextRegionId === "number") {
      void loadDeliveryCities(nextRegionId);
    }
  });

  watch(deliveryCityId, (nextCityId) => {
    const selectedCity = deliveryCities.value.find(
      (cityOption) => cityOption.id === nextCityId,
    );
    setFieldValue("city", selectedCity?.name || "");
    deliveryQuoteRequestId += 1;
    deliveryQuote.value = null;
    deliveryQuotePending.value = false;
    deliveryQuoteError.value = null;

    if (
      typeof deliveryRegionId.value === "number" &&
      typeof nextCityId === "number" &&
      selectedCity
    ) {
      void loadDeliveryQuote(deliveryRegionId.value, nextCityId);
    }
  });

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
    buyerType,
    companyName,
    companyNameAttrs,
    companyIdentificationCode,
    companyIdentificationCodeAttrs,
    firstName,
    firstNameAttrs,
    lastName,
    lastNameAttrs,
    email,
    emailAttrs,
    phone,
    phoneAttrs,
    deliveryRegionId,
    deliveryCityId,
    deliveryRegionOptions,
    deliveryCityOptions,
    selectedDeliveryRegion,
    deliveryRegionsPending,
    deliveryCitiesPending,
    deliveryLocationsError: computed(() =>
      deliveryRegionsError.value
        ? "რეგიონების ჩამონათვალი ვერ ჩაიტვირთა."
        : deliveryCitiesError.value,
    ),
    retryDeliveryLocations,
    deliveryQuote,
    deliveryQuotePending,
    deliveryQuoteError,
    retryDeliveryQuote,
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
