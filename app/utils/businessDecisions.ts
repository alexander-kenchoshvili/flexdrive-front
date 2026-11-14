import type { BusinessPeriod } from "./businessReport";
import type { MarketingReport } from "./businessMarketing";

export type DecisionState = { status: string; fetched_at?: string | null; message?: string; warnings?: string[] };
export type GoogleTotals = { sessions: number; totalUsers: number; ecommercePurchases: number; purchaseRevenue: string | number };
export type DecisionReport = {
  period: BusinessPeriod; previous_period: BusinessPeriod; refresh_seconds: number;
  google?: DecisionState & { current?: GoogleTotals; previous?: GoogleTotals; currency?: string; timezone?: string; sources?: (GoogleTotals & { sessionSourceMedium: string; sessionCampaignName: string })[]; source_row_count?: number };
  funnel?: DecisionState & { steps?: { event: string; label: string; users: number; lost: number | null }[] };
  ads?: MarketingReport["ads"] & DecisionState;
  previous_ads?: MarketingReport["ads"] & DecisionState;
};
export const decisionReady = (state?: DecisionState) => !!state && ["ready", "empty", "stale"].includes(state.status);
const number = (value: unknown) => value == null || value === "" || !Number.isFinite(Number(value)) || Number(value) < 0 ? null : Number(value);
export const adEfficiency = (summary?: { spend?: string; website_purchases?: string; website_purchase_value?: string }) => {
  const spend = number(summary?.spend), purchases = number(summary?.website_purchases), revenue = number(summary?.website_purchase_value);
  return { cpa: spend !== null && purchases !== null && purchases > 0 ? spend / purchases : null,
    roas: spend !== null && spend > 0 && revenue !== null ? revenue / spend : null };
};
export const decisionChange = (current: unknown, previous: unknown, comparable = true) => {
  const now = number(current), before = number(previous);
  if (!comparable || now === null || before === null) return "შედარება მიუწვდომელია";
  if (now === before) return "ცვლილება არ არის";
  if (!before) return "წინა პერიოდში 0 იყო";
  const percent = new Intl.NumberFormat("ka-GE", { maximumFractionDigits: 1 }).format(Math.abs((now - before) / before * 100));
  return `${now > before ? "↑ გაიზარდა" : "↓ შემცირდა"} ${percent}%`;
};
export const decisionSummary = (report: DecisionReport | null) => {
  if (!report) return [];
  const notes: string[] = [];
  const google = report.google;
  if (decisionReady(google) && google?.current) {
    if (!google.current.sessions) notes.push("Google-ს ამ პერიოდში ვიზიტები არ აღურიცხავს. გაყიდვების ზუსტი შედეგი გაყიდვებისა და ფინანსების სექციებში ნახე.");
    else if (!google.current.ecommercePurchases) notes.push("ვიზიტები აღირიცხება, შეძენა ჯერ არა. გადაამოწმე შეძენის აღრიცხვა; მხოლოდ ამ რიცხვით ვერ დავასკვნით, რომ საიტზე გაყიდვა არ ყოფილა.");
  }
  const steps = decisionReady(report.funnel) ? report.funnel?.steps : undefined;
  if (steps?.[0]?.users) {
    const drop = steps.slice(0, -1).reduce((best, step) => (step.lost || 0) > (best.lost || 0) ? step : best);
    if (drop.lost) notes.push(`ყველაზე მეტი მომხმარებელი ეტაპის შემდეგ აღარ გადავიდა წინ: „${drop.label}“ — ${drop.lost}. შეამოწმე შემდეგი ნაბიჯის სიმარტივე და მოვლენების აღრიცხვა.`);
  }
  if (decisionReady(report.ads) && report.ads?.summary) {
    if (!Number(report.ads.summary.spend)) notes.push("ამ პერიოდში სარეკლამო ხარჯი არ არის. რეკლამის უკუგებას აქტივობის დაწყების შემდეგ შეაფასებ.");
    else if (!Number(report.ads.summary.website_purchases)) notes.push("რეკლამაზე თანხა დაიხარჯა, მაგრამ Meta-ს შეძენა არ მიუწერია. გადაამოწმე შეძენის აღრიცხვა და კამპანიის შედეგები.");
  }
  if ([report.google, report.funnel, report.ads, report.previous_ads].some((block) => block?.status === "stale")) notes.push("ნაწილი ძველი პასუხიდანაა; განახლების დრო გადაამოწმე.");
  return notes;
};
