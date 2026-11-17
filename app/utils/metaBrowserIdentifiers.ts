import { isProductionTrackingHost } from "~/utils/trackingHost";

// Existing consented Pixel cookies only. No new cookie or fabricated ad click.
export const metaBrowserIdentifierHeaders = (consent: boolean) => {
  const headers: Record<string, string> = {};
  if (!import.meta.client || !consent || !isProductionTrackingHost(window.location.hostname)) return headers;
  try {
    const cookies = document.cookie.split(";").map((value) => value.trim());
    for (const key of ["fbp", "fbc"] as const) {
      const raw = cookies.find((value) => value.startsWith(`_${key}=`));
      if (!raw) continue;
      const value = decodeURIComponent(raw.slice(key.length + 2));
      const pattern = key === "fbp" ? /^fb\.\d{1,2}\.\d{13}\.\d{1,30}$/ : /^fb\.\d{1,2}\.\d{13}\.[A-Za-z0-9_-]{1,400}$/;
      if (pattern.test(value)) headers[`X-FlexDrive-Meta-${key === "fbp" ? "Fbp" : "Fbc"}`] = value;
    }
  } catch { /* Cookie access failure cannot affect checkout. */ }
  return headers;
};
