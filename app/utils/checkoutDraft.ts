import type { CheckoutFormValues } from "../composables/commerce/useCheckoutForm";

type CheckoutDraftSource = "cart" | "buy_now";
const keyFor = (source: CheckoutDraftSource) => `flexdrive:checkout-draft:v1:${source}`;
const textFields = [
  "company_name", "company_identification_code", "first_name", "last_name",
  "email", "phone", "city", "address_line", "note",
] as const;

// Explicit allowlist: prices, payment tokens and API responses are never persisted.
export const sanitizeCheckoutDraft = (input: unknown): Partial<CheckoutFormValues> => {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const data = input as Record<string, unknown>;
  const result: Partial<CheckoutFormValues> = {};
  if (typeof data.company_is_vat_registered === "boolean" || data.company_is_vat_registered === null) {
    result.company_is_vat_registered = data.company_is_vat_registered;
  }
  for (const field of textFields) {
    if (typeof data[field] === "string") result[field] = data[field];
  }
  if (data.buyer_type === "individual" || data.buyer_type === "legal_entity") {
    result.buyer_type = data.buyer_type;
  }
  for (const field of ["delivery_region_id", "delivery_city_id"] as const) {
    const value = data[field];
    if (value === null || (typeof value === "number" && Number.isSafeInteger(value) && value > 0)) {
      result[field] = value;
    }
  }
  if (typeof data.terms_accepted === "boolean") result.terms_accepted = data.terms_accepted;
  if (data.payment_method === "card" || data.payment_method === "cash_on_delivery") {
    result.payment_method = data.payment_method;
  }
  return result;
};

export const readCheckoutDraft = (source: CheckoutDraftSource, owner: string) => {
  try {
    const raw = sessionStorage.getItem(keyFor(source));
    if (!raw) return null;
    const draft = JSON.parse(raw);
    if (draft?.owner !== owner) {
      clearCheckoutDraft(source);
      return null;
    }
    return sanitizeCheckoutDraft(draft.values);
  } catch {
    return null;
  }
};

export const writeCheckoutDraft = (
  source: CheckoutDraftSource, owner: string, values: CheckoutFormValues,
) => {
  try {
    sessionStorage.setItem(keyFor(source), JSON.stringify({
      owner, values: sanitizeCheckoutDraft(values),
    }));
  } catch {
    // Storage may be unavailable; checkout must remain usable.
  }
};

export const clearCheckoutDraft = (source?: CheckoutDraftSource) => {
  try {
    for (const entry of source ? [source] : ["cart", "buy_now"] as const) {
      sessionStorage.removeItem(keyFor(entry));
    }
  } catch {
    // Also safe during SSR, where sessionStorage is unavailable.
  }
};
