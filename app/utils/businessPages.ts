import type { BusinessPeriod } from "./businessReport";

export type PageMetrics = {
  views: number; users: number; active_users: number; sessions: number;
  average_active_seconds: number | null;
};
export type PageRow = PageMetrics & { path: string; title?: string | null };
export type PageFilters = { q?: string; page?: number; path?: string };
export type PageReport = {
  status: "ready" | "stale" | "unavailable" | "not_configured";
  period: BusinessPeriod; fetched_at: string | null; refresh_seconds: number;
  message?: string; warnings?: string[]; timezone?: string;
  mode?: "list" | "detail"; path?: string | null; query?: string;
  page?: number; page_size?: number; row_count?: number; rows?: PageRow[];
  search_too_broad?: boolean;
  summary?: PageMetrics; facebook?: PageMetrics;
  daily?: (PageMetrics & { date: string })[];
  sources?: (PageMetrics & { source: string })[];
  source_row_count?: number; source_limit?: number;
};
export const activeTime = (seconds: number | null | undefined) => {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return "—";
  const rounded = Math.round(seconds), minutes = Math.floor(rounded / 60);
  return minutes ? `${minutes} წთ ${rounded % 60} წმ` : `${rounded} წმ`;
};
export const publicPageName = (path: string) => path === "/" ? "მთავარი გვერდი"
  : /^\/catalog\/?$/.test(path) ? "კატალოგი"
  : path.startsWith("/catalog/category/") ? "კატეგორიის გვერდი"
  : path.startsWith("/catalog/") ? "პროდუქტის გვერდი"
  : /^\/blogs\/?$/.test(path) ? "ბლოგი"
  : path.startsWith("/blogs/") ? "ბლოგის სტატია" : "საინფორმაციო გვერდი";
export const pageReportReady = (report: PageReport | null) => Boolean(report && ["ready", "stale"].includes(report.status));
