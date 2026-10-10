import { reportNumber, type BusinessReport, type ReportSummary } from "./businessReport";

type Fact = { key: string; title: string; text: string; path: string; hash?: string };
type InsightReport = Pick<BusinessReport, "summary" | "previous" | "comparisons">;

const number = (value: unknown): number | null => {
  if (value == null || typeof value === "string" && !value.trim()) return null;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
};
const value = (summary: ReportSummary, key: string) => number(summary[key]);
const positive = (summary: ReportSummary, key: string) => (value(summary, key) ?? 0) > 0;
const direction = (report: InsightReport, key: string) => {
  if (value(report.summary, key) === null || value(report.previous, key) === null) return null;
  const delta = number(report.comparisons[key]?.delta);
  return delta === null ? null : Math.sign(delta);
};
const trend = (direction: number) => direction > 0 ? "გაიზარდა" : direction < 0 ? "შემცირდა" : "უცვლელია";

// Deterministic observations from this response only; no generated amounts,
// unexplained causes, forecasts, external models or claims of company net profit.
export const buildBusinessInsights = (report: InsightReport) => {
  const summary = report.summary;
  const sentences: string[] = [];
  const received = value(summary, "received");
  const refunded = value(summary, "refunded");
  const empty = received === 0 && refunded === 0 && value(summary, "paid_orders") === 0 && value(summary, "refunded_orders") === 0;
  const refundOnly = received === 0 && refunded !== null && refunded > 0;
  if (empty) {
    sentences.push("არჩეულ პერიოდში დადასტურებული გადახდები ან თანხის დაბრუნებები არ დაფიქსირებულა. გაყიდვების დინამიკის შესაფასებლად ამ პერიოდში გადახდილი შეკვეთები არ გვაქვს.");
  } else {
    if (refundOnly) sentences.push("არჩეულ პერიოდში ახალი დადასტურებული გადახდა არ ფიქსირდება, თუმცა თანხის დაბრუნებები აღირიცხა.");
    else {
      if (received !== null && received > 0 && value(report.previous, "received") === 0) {
        sentences.push("შესადარებელ პერიოდში მიღებული თანხა ნული იყო; არჩეულ პერიოდში დადასტურებული გადახდები დაფიქსირდა.");
      }
      const sales = direction(report, "product_received");
      const cash = direction(report, "net_received");
      if (sales !== null && cash !== null) {
        sentences.push(`პროდუქტების გაყიდვის თანხა ${trend(sales)}, ${sales > 0 && cash < 0 ? "თუმცა" : "ხოლო"} დაბრუნებების შემდეგ დარჩენილი სრული თანხა ${trend(cash)}.`);
      } else if (cash !== null) {
        sentences.push(`დაბრუნებების შემდეგ დარჩენილი სრული თანხა ${trend(cash)}.`);
      }
    }
    const profit = value(summary, "product_profit_net");
    const previousProfit = value(report.previous, "product_profit_net");
    const profitChange = direction(report, "product_profit_net");
    if (profit !== null && profit < 0) {
      sentences.push(profitChange === null ? "არჩეულ პერიოდში პროდუქტების შედეგი დღგ-ის გარეშე უარყოფითია."
        : `პროდუქტების შედეგი ${profitChange > 0 ? "გაუმჯობესდა" : profitChange < 0 ? "გაუარესდა" : "უცვლელია"}, თუმცა არჩეული პერიოდის შედეგი დღგ-ის გარეშე უარყოფითია.`);
    } else if (profit !== null && previousProfit !== null && previousProfit < 0) {
      sentences.push(`პროდუქტების შედეგი დღგ-ის გარეშე უარყოფითიდან ${profit > 0 ? "დადებითი" : "ნულოვანი"} გახდა.`);
    } else if (profitChange !== null) {
      sentences.push(`პროდუქტების მოგება დღგ-ის გარეშე ${trend(profitChange)}.`);
    }
    if (!refundOnly) {
      const orders = direction(report, "paid_orders"), units = direction(report, "sold_units");
      if (orders !== null && units !== null) sentences.push(`გადახდილი შეკვეთების რაოდენობა ${trend(orders)}, გაყიდული ერთეულების რაოდენობა კი ${trend(units)}.`);
      else if (orders !== null) sentences.push(`გადახდილი შეკვეთების რაოდენობა ${trend(orders)}.`);
    }
    if (!sentences.length) sentences.push("ამ პერიოდის ჩანაწერები ხელმისაწვდომია, თუმცა ცვლილების სანდო შეფასებისთვის შესადარებელი მონაცემები არასაკმარისია.");
    if (profit === null || profitChange === null) sentences.push("პროდუქტების მოგების სრულად შესადარებლად მონაცემები არასაკმარისია.");
  }

  const facts: Fact[] = [];
  if (positive(summary, "refunded")) facts.push({ key: "refunds", title: "თანხის დაბრუნებები დაფიქსირდა", text: "ამ პერიოდში მომხმარებლებისთვის თანხის დაბრუნება დადასტურდა. მიღებული და დაბრუნებული თანხები ფინანსებში ცალ-ცალკე ჩანს.", path: "/business/finance" });
  if (positive(summary, "unsaleable_units")) facts.push({ key: "unsaleable", title: "უვარგისი დაბრუნებული ნივთები", text: `შემოწმებისას გასაყიდად უვარგისად დაფიქსირდა ${reportNumber(summary.unsaleable_units)} ერთეული. მათი ღირებულება ცალკე აღირიცხება.`, path: "/business/finance", hash: "#business-delivery-title" });
  if (positive(summary, "unallocated_events") || positive(summary, "unknown_cost_lines") || positive(summary, "unknown_loss_lines")) {
    facts.push({ key: "incomplete", title: "ზოგი ფინანსური მონაცემი არასრულია", text: "ზოგ ჩანაწერს ისტორიული ღირებულება ან თანხის სანდო განაწილება აკლია. შესაბამისი სრული მაჩვენებელი „—“-ითაა აღნიშნული.", path: "/business/finance" });
  }
  return { paragraph: sentences.join(" "), facts };
};
