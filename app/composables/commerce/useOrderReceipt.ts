import { apiFetchRaw } from "~/composables/apiFetch";
import type { CommerceReceiptAccess } from "~/types/commerce";

type StoredReceiptAccess = {
  token: string;
  storedAt: string;
};

const RECEIPT_ACCESS_PREFIX = "flexdrive:order-receipt:";
const RECEIPT_ACCESS_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const storageKey = (orderToken: string) =>
  `${RECEIPT_ACCESS_PREFIX}${String(orderToken || "").trim()}`;

const safeFilenamePart = (value: string) => {
  const normalized = String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "order";
};

export const useOrderReceipt = () => {
  const storeReceiptAccess = (
    orderToken: string | null | undefined,
    access: CommerceReceiptAccess | null | undefined,
  ) => {
    const normalizedOrderToken = String(orderToken || "").trim();
    const token = String(access?.receipt_access_token || "").trim();
    if (!import.meta.client || !normalizedOrderToken || !token) return;

    try {
      const payload: StoredReceiptAccess = {
        token,
        storedAt: new Date().toISOString(),
      };
      window.sessionStorage.setItem(
        storageKey(normalizedOrderToken),
        JSON.stringify(payload),
      );
    } catch {
      // Receipt storage is best-effort and must never block a completed order.
    }
  };

  const readReceiptAccessToken = (orderToken: string | null | undefined) => {
    const normalizedOrderToken = String(orderToken || "").trim();
    if (!import.meta.client || !normalizedOrderToken) return "";

    try {
      const key = storageKey(normalizedOrderToken);
      const rawValue = window.sessionStorage.getItem(key);
      if (!rawValue) return "";

      const parsed = JSON.parse(rawValue) as Partial<StoredReceiptAccess>;
      const token = String(parsed.token || "").trim();
      const storedAt = new Date(String(parsed.storedAt || "")).getTime();
      if (
        !token ||
        !Number.isFinite(storedAt) ||
        Date.now() - storedAt > RECEIPT_ACCESS_MAX_AGE_MS
      ) {
        window.sessionStorage.removeItem(key);
        return "";
      }
      return token;
    } catch {
      return "";
    }
  };

  const downloadReceipt = async (options: {
    orderToken: string;
    orderNumber: string;
    accessToken?: string;
  }) => {
    if (!import.meta.client) return;

    const headers: Record<string, string> = {};
    if (options.accessToken) {
      headers["X-Receipt-Token"] = options.accessToken;
    }

    const pdf = await apiFetchRaw<Blob>(
      `/commerce/orders/${encodeURIComponent(options.orderToken)}/receipt/`,
      {
        headers,
        responseType: "blob",
      },
    );
    const objectUrl = URL.createObjectURL(pdf);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `FlexDrive-${safeFilenamePart(options.orderNumber)}.pdf`;
    anchor.hidden = true;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  };

  return {
    storeReceiptAccess,
    readReceiptAccessToken,
    downloadReceipt,
  };
};
