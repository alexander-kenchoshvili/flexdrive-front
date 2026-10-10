// Tracking belongs to the canonical storefront, never local or preview hosts.
export const isProductionTrackingHost = (hostname: string) =>
  hostname.toLowerCase() === "flexdrive.ge";
