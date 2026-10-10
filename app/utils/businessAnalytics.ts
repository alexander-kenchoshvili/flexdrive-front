import type { BusinessPeriod } from "./businessReport";

export type AnalyticsDay = { date: string; sessions: number; users: number };
export type AnalyticsReport = {
  status: "not_configured" | "unavailable" | "ready" | "empty" | "partial" | "stale";
  message?: string;
  period: BusinessPeriod;
  hostname: string;
  property_id: string;
  refresh_seconds: number;
  fetched_at: string | null;
  report_timezone?: string | null;
  warnings?: string[];
  summary?: { totalUsers: number; sessions: number; engagedSessions: number; screenPageViews: number };
  daily?: AnalyticsDay[];
  sources?: { source: string; sessions: number; engaged_sessions: number }[];
  source_row_count?: number;
  search?: {
    status: "ready" | "unavailable";
    message?: string;
    total: number | null;
    no_results: number | null;
    row_count: number;
    terms: { term: string; outcome: "results" | "no_results"; count: number; average_results: number }[];
  };
};

export const analyticsHasData = (report: AnalyticsReport | null) => Boolean(report?.summary
  && ["ready", "empty", "partial", "stale"].includes(report.status));

export const analyticsSource = (source: string) => {
  if (source === "(direct) / (none)") return "პირდაპირი შემოსვლა";
  if (source === "(not set)") return "წყარო უცნობია";
  return source;
};

export const analyticsInsight = (report: AnalyticsReport | null): string => {
  if (!report?.summary || !analyticsHasData(report)) return "";
  if (report.status === "empty") return "არჩეულ პერიოდში flexdrive.ge-სთვის Google-ს ჩანაწერები არ დაუბრუნებია. დროებითი დომენისა და დეველოპმენტის მონაცემები ამ ანგარიშში არ შედის.";
  const fmt = (value: number) => new Intl.NumberFormat("ka-GE", { maximumFractionDigits: 1 }).format(value);
  const { sessions, totalUsers } = report.summary;
  const sentences = [`Google-მა აღრიცხა ${fmt(sessions)} ვიზიტი და ${fmt(totalUsers)} მომხმარებელი.`];
  const top = report.sources?.[0];
  if (top?.sessions) sentences.push(`ყველაზე მეტი ვიზიტი მოდის წყაროდან „${analyticsSource(top.source)}“ — ${fmt(top.sessions)}.`);
  if (report.search?.status === "ready" && report.search.total != null && report.search.total > 0 && report.search.no_results != null) {
    sentences.push(`ძიების შედეგების გვერდი გაიხსნა ${fmt(report.search.total)}-ჯერ; მათგან ${fmt(report.search.no_results)} შემთხვევაში პროდუქტი ვერ მოიძებნა (${fmt(report.search.no_results / report.search.total * 100)}%).`);
  }
  return sentences.join(" ");
};
