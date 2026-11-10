import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { clearCheckoutDraft, readCheckoutDraft, writeCheckoutDraft } from "~/utils/checkoutDraft";
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
  CommerceDeliveryOption,
  DeliveryServiceSlug,
  CommerceDeliveryQuote,
  CommerceDeliveryRegion,
} from "~/types/commerce";

export type CheckoutFormValues = {
  buyer_type: CheckoutBuyerType;
  company_name: string;
  company_identification_code: string;
  company_is_vat_registered: boolean | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  delivery_region_id: number | null;
  delivery_city_id: number | null;
  delivery_service_slug: DeliveryServiceSlug;
  city: string;
  address_line: string;
  note: string;
  terms_accepted: boolean;
  payment_method: CheckoutPaymentMethod;
};

export type CheckoutFieldName = keyof CheckoutFormValues;
export type CheckoutFieldErrors = Partial<Record<CheckoutFieldName, string>>;

// Temporary checkout test switch. Set back to false after receipt QA is complete.
export const CHECKOUT_CASH_ON_DELIVERY_ENABLED = false;
export const CHECKOUT_DEFAULT_PAYMENT_METHOD: CheckoutPaymentMethod = "card";

export const checkoutFieldOrder: CheckoutFieldName[] = [
  "buyer_type",
  "company_name",
  "company_identification_code",
  "company_is_vat_registered",
  "first_name",
  "last_name",
  "email",
  "phone",
  "delivery_region_id",
  "delivery_city_id",
  "delivery_service_slug",
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
  company_is_vat_registered: '[data-checkout-field="company_is_vat_registered"]',
  first_name: '[data-checkout-field="first_name"]',
  last_name: '[data-checkout-field="last_name"]',
  email: '[data-checkout-field="email"]',
  phone: '[data-checkout-field="phone"]',
  delivery_region_id: '[data-checkout-field="delivery_region_id"]',
  delivery_city_id: '[data-checkout-field="delivery_city_id"]',
  delivery_service_slug: '[data-checkout-field="delivery_service_slug"]',
  city: '[data-checkout-field="delivery_city_id"]',
  address_line: '[data-checkout-field="address_line"]',
  terms_accepted: '[data-checkout-field="terms_accepted"]',
  payment_method: '[data-checkout-field="payment_method"]',
  note: '[data-checkout-field="note"]',
};

export const useCheckoutForm = (options?: {
  profileKey?: string;
  source?: "cart" | "buy_now";
  deliveryReady?: () => boolean;
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
    resetForm,
    values,
  } = useForm<CheckoutFormValues>({
    validationSchema: toTypedSchema(checkoutSchema),
    initialValues: {
      buyer_type: "individual",
      company_name: "",
      company_identification_code: "",
      company_is_vat_registered: null,
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      delivery_region_id: null,
      delivery_city_id: null,
      delivery_service_slug: "standard",
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
  const [companyIsVatRegistered] = defineField("company_is_vat_registered");
  const [companyIdentificationCode, companyIdentificationCodeAttrs] =
    defineField("company_identification_code");
  const [lastName, lastNameAttrs] = defineField("last_name");
  const [email, emailAttrs] = defineField("email");
  const [phone, phoneAttrs] = defineField("phone");
  const [deliveryRegionId] = defineField("delivery_region_id");
  const [deliveryCityId] = defineField("delivery_city_id");
  const [deliveryServiceSlug] = defineField("delivery_service_slug");
  const [city] = defineField("city");
  const [addressLine, addressLineAttrs] = defineField("address_line");
  const [note, noteAttrs] = defineField("note");
  const [termsAccepted] = defineField("terms_accepted");
  const [paymentMethod] = defineField("payment_method");

  const draftSource = options?.source || "cart";
  const draftMounted = ref(false);
  let draftReady = false;
  let restoringDraft = false;
  let hasRestoredDraft = false;
  let draftOwner = "";
  const currentDraftOwner = () => String(globalStore.currentUser?.id ?? "guest");
  const clearFormDraft = () => {
    draftReady = false;
    clearCheckoutDraft(draftSource);
  };
  const saveFormDraft = () => {
    if (draftReady && !restoringDraft && draftOwner === currentDraftOwner()) {
      writeCheckoutDraft(draftSource, draftOwner, values);
    }
  };

  const deliveryCities = ref<CommerceDeliveryCity[]>([]);
  const deliveryCitiesPending = ref(false);
  const deliveryCitiesError = ref<string | null>(null);
  let deliveryCitiesRequestId = 0;
  const deliveryQuote = ref<CommerceDeliveryQuote | null>(null);
  const deliveryOptions = ref<CommerceDeliveryOption[]>([]);
  const deliveryQuotePending = ref(false);
  const deliveryQuoteError = ref<string | null>(null);
  let deliveryQuoteRequestId = 0;

  const {
    data: deliveryRegionsData,
    pending: deliveryRegionsPending,
    error: deliveryRegionsError,
    refresh: refreshDeliveryRegions,
  } = useAsyncData(
    `${options?.profileKey || "checkout-profile"}-wingo-delivery-regions`,
    async () => {
      const response = await getDeliveryRegions();
      if (response.provider !== "wingo" || !response.results.length) {
        throw new Error("მიწოდების რეგიონები ვერ ჩაიტვირთა. სცადეთ ხელახლა.");
      }
      return response;
    },
    { default: () => ({ provider: "wingo" as const, results: [] }) },
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
      if (requestId === deliveryCitiesRequestId && deliveryRegionId.value === regionId) {
        if (response.provider !== "wingo" || response.region.id !== regionId) {
          throw new Error("დასახლებების ჩამონათვალი განახლდა. აირჩიეთ რეგიონი ხელახლა.");
        }
        deliveryCities.value = response.results;
        if (!response.results.some((entry) => entry.id === deliveryCityId.value)) {
          setFieldValue("delivery_city_id", response.results.length === 1 ? response.results[0]!.id : null, false);
        }
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

  let deliveryExpiryTimer: ReturnType<typeof setTimeout> | null = null;
  const clearDeliveryExpiry = () => {
    if (deliveryExpiryTimer !== null) clearTimeout(deliveryExpiryTimer);
    deliveryExpiryTimer = null;
  };
  onScopeDispose(clearDeliveryExpiry);

  const optionsFromQuote = (quote: CommerceDeliveryQuote): CommerceDeliveryOption[] => quote.options || [{
    service_slug: "standard", delivery_type_id: 1, label: "სტანდარტული მიტანა",
    price: quote.customer_delivery_price, available: true, unavailable_reason: "",
    estimated_delivery_date: null, estimate_label: "", booking_deadline_at: null, checkout_deadline_at: null,
  }];

  const loadDeliveryQuote = async (regionId: number, cityId: number) => {
    const requestId = ++deliveryQuoteRequestId;
    const service = deliveryServiceSlug.value;
    const started = Date.now();
    const isCurrent = () => requestId === deliveryQuoteRequestId && deliveryRegionId.value === regionId &&
      deliveryCityId.value === cityId && deliveryServiceSlug.value === service;
    clearDeliveryExpiry();
    deliveryQuote.value = null;
    deliveryQuotePending.value = true;
    deliveryQuoteError.value = null;
    const payload = { source: draftSource, delivery_region_id: regionId,
      delivery_city_id: cityId, delivery_service_slug: service };
    try {
      const quote = await getDeliveryQuote(payload);
      if (!isCurrent()) return;
      if (quote.provider !== "wingo" || quote.delivery_type_id !== (service === "fast" ? 2 : 1) ||
          (quote.service_slug ?? "standard") !== service || quote.region_id !== regionId || quote.city_id !== cityId) {
        throw new Error("მიწოდების არჩევანი განახლდა. გამოთვალეთ თავიდან.");
      }
      const remaining = quote.expires_at && quote.server_time
        ? Date.parse(quote.expires_at) - Date.parse(quote.server_time) - Math.max(0, Date.now() - started) : null;
      if (remaining !== null && (!Number.isFinite(remaining) || remaining <= 0)) {
        throw new Error("მიწოდების შეთავაზებას ვადა გაუვიდა. განაახლეთ არჩევანი.");
      }
      deliveryOptions.value = optionsFromQuote(quote);
      deliveryQuote.value = quote;
      if (remaining !== null) {
        deliveryExpiryTimer = setTimeout(() => {
          if (!isCurrent()) return;
          deliveryQuote.value = null;
          deliveryQuoteError.value = "მიწოდების შეთავაზება ახლდება…";
          void retryDeliveryQuote();
        }, remaining);
      }
    } catch (error) {
      if (isCurrent()) {
        deliveryQuoteError.value = normalizeApiErrorMessage(error, "მიწოდების ფასი ვერ დაითვალა. სცადეთ ხელახლა.");
        if (service === "fast") {
          // Refresh alternatives after cutoff; the selected paid service is never silently changed.
          try {
            const standard = await getDeliveryQuote({ ...payload, delivery_service_slug: "standard" });
            if (isCurrent() && standard.provider === "wingo" && standard.delivery_type_id === 1 &&
                standard.region_id === regionId && standard.city_id === cityId) {
              deliveryOptions.value = optionsFromQuote(standard);
            }
          } catch { /* The original error remains visible; no stale quote becomes payable. */ }
        }
      }
    } finally {
      if (isCurrent()) deliveryQuotePending.value = false;
    }
  };

  const retryDeliveryQuote = async () => {
    if (
      typeof deliveryRegionId.value === "number" &&
      typeof deliveryCityId.value === "number" && (options?.deliveryReady?.() ?? true)
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
    if (!profile || hasRestoredDraft) return;

    fillFieldIfBlank("first_name", profile.first_name);
    fillFieldIfBlank("last_name", profile.last_name);
    fillFieldIfBlank("email", profile.email);
    fillFieldIfBlank("phone", profile.phone);
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
    if (restoringDraft) return;
    deliveryCitiesRequestId += 1;
    deliveryCities.value = [];
    deliveryCitiesPending.value = false;
    deliveryCitiesError.value = null;
    deliveryQuoteRequestId += 1;
    clearDeliveryExpiry();
    deliveryQuote.value = null;
    deliveryQuotePending.value = false;
    deliveryQuoteError.value = null;
    deliveryOptions.value = [];
    setFieldValue("delivery_city_id", null, false);
    setFieldValue("delivery_service_slug", "standard", false);
    setFieldValue("city", "", false);
    setFieldError("delivery_city_id", undefined);
    setFieldError("city", undefined);

    if (typeof nextRegionId === "number") {
      void loadDeliveryCities(nextRegionId);
    }
  }, { flush: "sync" });

  watch([deliveryRegions, deliveryRegionsPending], ([regions, pending]) => {
    if (!pending && !restoringDraft && typeof deliveryRegionId.value === "number" &&
        !regions.some((region) => region.id === deliveryRegionId.value)) {
      setFieldValue("delivery_region_id", null, false);
    }
  });

  watch([deliveryCityId, deliveryCities, () => options?.deliveryReady?.() ?? true], ([nextCityId, , ready], [previousCityId]) => {
    if (restoringDraft) return;
    const selectedCity = deliveryCities.value.find(
      (cityOption) => cityOption.id === nextCityId,
    );
    setFieldValue("city", selectedCity?.name || "", false);
    setFieldError("delivery_city_id", undefined);
    setFieldError("city", undefined);
    deliveryQuoteRequestId += 1;
    clearDeliveryExpiry();
    deliveryQuote.value = null;
    deliveryQuotePending.value = false;
    deliveryQuoteError.value = null;

    if (nextCityId !== previousCityId) {
      deliveryOptions.value = [];
      if (deliveryServiceSlug.value !== "standard") {
        setFieldValue("delivery_service_slug", "standard", false);
        return;
      }
    }
    if (
      typeof deliveryRegionId.value === "number" &&
      typeof nextCityId === "number" &&
      selectedCity && ready
    ) {
      void loadDeliveryQuote(deliveryRegionId.value, nextCityId);
    }
  }, { flush: "sync" });

  watch(deliveryServiceSlug, () => {
    if (restoringDraft) return;
    deliveryQuoteRequestId += 1;
    clearDeliveryExpiry();
    deliveryQuote.value = null;
    deliveryQuotePending.value = false;
    deliveryQuoteError.value = null;
    setFieldError("delivery_service_slug", undefined);
    if (typeof deliveryRegionId.value === "number" && typeof deliveryCityId.value === "number" &&
        deliveryCities.value.some((entry) => entry.id === deliveryCityId.value) && (options?.deliveryReady?.() ?? true)) {
      void loadDeliveryQuote(deliveryRegionId.value, deliveryCityId.value);
    }
  }, { flush: "sync" });

  watch(
    () => globalStore.currentUser?.email,
    (nextEmail) => {
      if (
        typeof nextEmail === "string" &&
        nextEmail.trim() &&
        !hasRestoredDraft &&
        !String(values.email || "").trim()
      ) {
        setFieldValue("email", nextEmail.trim());
      }
    },
    { immediate: true },
  );

  watch(values, saveFormDraft, { deep: true, flush: "sync" });

  watch(
    [draftMounted, () => globalStore.authResolved],
    async ([mounted, authResolved]) => {
      if (!mounted || !authResolved || draftReady) return;
      draftOwner = currentDraftOwner();
      const draft = readCheckoutDraft(draftSource, draftOwner);
      if (draft && Object.keys(draft).length) {
        hasRestoredDraft = true;
        restoringDraft = true;
        resetForm({ values: { ...values, ...draft } });
        // Let dependent field watchers flush without clearing the restored city.
        await nextTick();
        restoringDraft = false;
        if (typeof deliveryRegionId.value === "number") {
          void loadDeliveryCities(deliveryRegionId.value);
        }
      }
      draftReady = true;
      saveFormDraft();
    },
  );
  watch(() => globalStore.currentUser?.id, (nextId, previousId) => {
    if (draftReady && nextId !== previousId) clearFormDraft();
  }, { flush: "sync" });
  onMounted(() => { draftMounted.value = true; });

  return {
    errors,
    values,
    validateSubmit,
    setErrors,
    setFieldValue,
    buyerType,
    companyName,
    companyIsVatRegistered,
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
    city,
    deliveryRegionId,
    deliveryCityId,
    deliveryServiceSlug,
    deliveryOptions,
    deliveryRegionOptions,
    deliveryCityOptions,
    selectedDeliveryRegion,
    deliveryRegionsPending,
    deliveryCitiesPending,
    deliveryLocationsError: computed(() =>
      deliveryRegionsError.value
        ? "მიწოდების რეგიონები ვერ ჩაიტვირთა."
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
    clearFormDraft,
  };
};
