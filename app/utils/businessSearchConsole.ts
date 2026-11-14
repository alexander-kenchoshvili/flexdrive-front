import type { BusinessPeriod } from "./businessReport";

export type SearchMetrics = { clicks: number; impressions: number; ctr: number; position: number | null };
export type SearchBlock = { status: string; rows?: (SearchMetrics & { query?: string; page?: string; date?: string })[]; summary?: SearchMetrics };
export type SearchConsoleReport = {
  status: string; message?: string; property: string; requested_period: BusinessPeriod; period: BusinessPeriod | null;
  previous_period?: BusinessPeriod; available_from: string; available_through: string; fetched_at: string | null;
  timezone: string; data_state: string; refresh_seconds: number; row_limit: number;
  summary?: SearchMetrics; previous?: SearchBlock; daily?: SearchBlock; queries?: SearchBlock; pages?: SearchBlock;
};
export const searchConsoleHasData = (report: SearchConsoleReport | null) => !!report?.summary && ["ready", "empty", "partial", "stale"].includes(report.status);
export const searchMetric = (value: number | null | undefined, fraction = false) => value == null || !Number.isFinite(value) ? "—"
  : new Intl.NumberFormat("ka-GE", { maximumFractionDigits: 1 }).format(fraction ? value * 100 : value) + (fraction ? "%" : "");
export const searchChange = (now: number | null | undefined, before: number | null | undefined, metric: keyof SearchMetrics, comparable: boolean) => {
  if (!comparable || now == null || before == null || !Number.isFinite(now) || !Number.isFinite(before)) return "შედარება მიუწვდომელია";
  if (now === before) return "ცვლილება არ არის";
  if (metric === "position") return `${searchMetric(Math.abs(now - before))} პოზიციით ${now < before ? "გაუმჯობესდა" : "გაუარესდა"}`;
  if (metric === "ctr") return `${now > before ? "+" : "−"}${searchMetric(Math.abs(now - before) * 100)} პროცენტული პუნქტი`;
  if (!before) return "წინა პერიოდში 0 იყო";
  return `${now > before ? "↑ გაიზარდა" : "↓ შემცირდა"} ${searchMetric(Math.abs((now - before) / before), true)}`;
};
export const searchConsoleInsight = (report: SearchConsoleReport | null) => {
  if (!searchConsoleHasData(report) || !report?.summary) return "";
  const { clicks, impressions } = report.summary;
  if (!impressions && !clicks) return "Google-ს ამ პერიოდში ძიების შედეგები არ დაუბრუნებია. ახალ ან ინდექსაციისგან შეზღუდულ საიტზე ეს მოსალოდნელია; ეს გაყიდვების ან საიტზე ყველა ვიზიტის რაოდენობა არ არის.";
  const text = `Google-ის ძიებაში ჩვენი საიტი გამოჩნდა ${searchMetric(impressions)}-ჯერ და მიიღო ${searchMetric(clicks)} დაწკაპუნება.`;
  return clicks ? text : `${text} მომხმარებელი შედეგს ხედავს, მაგრამ საიტზე ჯერ არ გადმოსულა. გადახედე საძიებო სიტყვებს, სათაურსა და აღწერას; მიზეზი მხოლოდ ამ რიცხვებით არ დგინდება.`;
};
