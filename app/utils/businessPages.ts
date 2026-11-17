import type { BusinessPeriod } from "./businessReport";
export type PageReport = {
  status: "ready" | "stale" | "unavailable" | "not_configured";
  period: BusinessPeriod; fetched_at: string | null; refresh_seconds: number;
  message?: string; warnings?: string[]; timezone?: string;
  row_count?: number;
  rows?: { path: string; views: number; users: number; active_users: number; average_active_seconds: number | null }[];
};
export const activeTime = (seconds: number | null | undefined) => {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return "—";
  const rounded = Math.round(seconds), minutes = Math.floor(rounded / 60);
  return minutes ? `${minutes} წთ ${rounded % 60} წმ` : `${rounded} წმ`;
};
export const publicPageName = (path: string) => path === "/" ? "მთავარი გვერდი"
  : /^\/catalog\/?$/.test(path) ? "კატალოგი" : path.startsWith("/catalog/") ? "პროდუქტის გვერდი" : "საინფორმაციო გვერდი";
