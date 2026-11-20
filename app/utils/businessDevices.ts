import type { BusinessPeriod } from "./businessReport";

export type DeviceRow = {
  category: "mobile" | "desktop" | "tablet" | "other"; label: string;
  sessions: number; purchases: number; session_share: number | null; purchase_share: number | null;
};
export type DeviceReport = {
  status: "ready" | "stale" | "unavailable" | "not_configured";
  period: BusinessPeriod; fetched_at: string | null; refresh_seconds: number;
  message?: string; warnings?: string[]; timezone?: string; source?: "ga4";
  totals?: { sessions: number; purchases: number }; rows?: DeviceRow[];
};
export const deviceShare = (value: number | null | undefined) => value == null || !Number.isFinite(value)
  ? "—" : `${new Intl.NumberFormat("ka-GE", { maximumFractionDigits: 1 }).format(value)}%`;
