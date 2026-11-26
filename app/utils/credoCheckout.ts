import type { CheckoutPaymentMethod, CredoOffer } from "~/types/commerce";

export const isCredoMethod = (method: CheckoutPaymentMethod): method is "credo_dayavi" | "credo_installment" =>
  method === "credo_dayavi" || method === "credo_installment";
export const credoOfferForMethod = (method: "credo_dayavi" | "credo_installment"): CredoOffer =>
  method === "credo_dayavi" ? "dayavi" : "installment";
export const isCredoToken = (token: unknown): token is string =>
  typeof token === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);

// Defense in depth: only the bank's documented installment environment.
export const safeCredoRedirect = (value: unknown): string | null => {
  if (typeof value !== "string" || /[\s\\%]/.test(value)
      || value.split("/").some((part) => part === "." || part === "..")) return null;
  try {
    const url = new URL(value);
    return url.origin === "https://ganvadeba.credo.ge" && !url.username && !url.password
      && !url.search && !url.hash && url.pathname.startsWith("/installment/")
      && url.pathname.length > "/installment/".length ? url.toString() : null;
  } catch { return null; }
};

export const credoApplicationPath = (token: string) => `/checkout/credo/${token}`;
const storageKey = (source: "cart" | "buy_now") => `flexdrive:credo-application:${source}`;
export const storeCredoApplication = (source: "cart" | "buy_now", owner: string, token: string) => {
  if (!isCredoToken(token)) return;
  try { sessionStorage.setItem(storageKey(source), JSON.stringify({ owner, token })); } catch { /* optional recovery */ }
};
export const readCredoApplication = (source: "cart" | "buy_now", owner: string): string | null => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey(source)) || "null");
    return saved?.owner === owner && isCredoToken(saved.token) ? saved.token : null;
  } catch { return null; }
};
export const clearCredoApplication = (source: "cart" | "buy_now", owner: string, token: string) => {
  try {
    if (readCredoApplication(source, owner) === token) sessionStorage.removeItem(storageKey(source));
  } catch { /* optional recovery */ }
};
