import type { BusinessPeriod } from "./businessReport";

export type MetaState = { status: "ready" | "empty" | "stale" | "unavailable" | "range_limit"; fetched_at: string | null; message?: string };
export type AdMetrics = { spend: string; impressions: number; clicks: number; reach: number; website_purchases: string; website_purchase_value: string; link_clicks?: string; landing_page_views?: string };
export type AdDay = AdMetrics & { date: string };
export type MarketingReport = {
  status: "ready" | "partial" | "unavailable" | "not_configured";
  message?: string;
  period: BusinessPeriod;
  generated_at: string;
  refresh_seconds: number;
  accounts: { facebook: string; instagram: string; ads: string };
  technical?: { events_manager_url: string; pixel_id: string; capi_enabled: boolean; capi_configured: boolean; delivery_details: string; delivery_message: string };
  pixel?: MetaState & { id?: string; name?: string; last_event_at?: string | null };
  facebook?: { profile: MetaState & { name?: string; followers?: number }; activity: MetaState & { views?: number; interactions?: number; reported_days?: number; complete?: boolean } };
  instagram?: { profile: MetaState & { username?: string; followers?: number; posts?: number }; activity: MetaState & { views?: number; reach?: number; total_interactions?: number } };
  ads?: MetaState & { currency?: string; timezone?: string; summary?: AdMetrics; daily?: AdDay[]; campaigns?: (AdMetrics & { id: string; name: string; objective?: string | null; effective_status?: string | null })[]; campaigns_limited?: boolean; campaign_metadata_status?: string; attribution?: { click_days: number; view_days: number; report_time: string } };
};

export const metaHasData = (block?: MetaState) => !!block && ["ready", "empty", "stale"].includes(block.status);
export const marketingMoney = (value: string | number | null | undefined, currency?: string) => {
  if (value == null || !currency) return "—";
  return new Intl.NumberFormat("ka-GE", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
};
export const metaUpdated = (value?: string | null) => value
  ? new Intl.DateTimeFormat("ka-GE", { timeZone: "Asia/Tbilisi", dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "";
export const marketingInsight = (report: MarketingReport | null, social?: boolean) => {
  if (!report || report.status === "not_configured") return "";
  const ads = report.ads, parts: string[] = [];
  if (social !== true && metaHasData(ads) && ads?.summary) {
    const summary = ads.summary;
    if (!summary.impressions && !summary.clicks && !Number(summary.spend)) parts.push("არჩეულ პერიოდში Meta-ს რეკლამის ანგარიშში აქტივობა არ არის აღრიცხული.");
    else parts.push(`Meta-ს რეკლამაზე დახარჯულია ${marketingMoney(summary.spend, ads.currency)}, აღრიცხულია ${new Intl.NumberFormat("ka-GE").format(summary.impressions)} ჩვენება და ${new Intl.NumberFormat("ka-GE").format(summary.clicks)} დაწკაპუნება.`);
    if (ads.status === "stale") parts.push("რეკლამის რიცხვები ბოლო წარმატებული განახლებიდანაა.");
  }
  const ig = report.instagram?.activity;
  if (social !== false && metaHasData(ig) && ig?.reach != null) {
    parts.push(`Instagram-ზე კონტენტი ${new Intl.NumberFormat("ka-GE").format(ig.reach)} ანგარიშამდე მივიდა.`);
    if (ig.status === "stale") parts.push("Instagram-ის რიცხვები ბოლო წარმატებული განახლებიდანაა.");
  }
  if (report.status === "partial") parts.push("ზოგი წყარო ვერ განახლდა ან პერიოდის შეზღუდვა აქვს; შესაბამის ბლოკში მიზეზი ჩანს.");
  return parts.join(" ") || "Meta-ს მონაცემები ჯერ მიუწვდომელია. წყაროების მდგომარეობა ქვემოთ ჩანს.";
};
