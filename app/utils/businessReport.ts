export type ReportSection = "overview" | "sales" | "finance";
export type BusinessPeriod = { start: string; end: string };
export type ReportSummary = Record<string, string | number | null>;
export type ReportDay = { date: string; received: string; refunded: string; net_received: string; product_profit_net: string | null; paid_orders: number; sold_units: number | null };
export type BusinessReport = {
  period: BusinessPeriod;
  previous_period: BusinessPeriod;
  summary: ReportSummary;
  previous: ReportSummary;
  comparisons: Record<string, { delta: string | null; percent: string | null }>;
  daily: ReportDay[];
  products: { sku: string; name: string; sold_units: number; returned_units: number; net_units: number; net_sales: string; profit_net: string | null }[];
  deliveries: { order_number: string; date: string; carrier: string; buffer: string; delivery: string }[];
  delivery_rows_total: number;
  losses: { order_number: string; date: string; sku: string; name: string; quantity: number; cost_net: string | null }[];
  loss_rows_total: number;
  generated_at: string;
};

export const businessToday = () => {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Tbilisi", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const value = (key: string) => parts.find((part) => part.type === key)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
};

export const businessPreset = (preset: "month" | "previous" | "30days", today = businessToday()): BusinessPeriod => {
  const current = new Date(`${today}T00:00:00Z`);
  if (preset === "30days") {
    current.setUTCDate(current.getUTCDate() - 29);
    return { start: current.toISOString().slice(0, 10), end: today };
  }
  if (preset === "previous") {
    current.setUTCDate(0);
    return { start: `${current.toISOString().slice(0, 7)}-01`, end: current.toISOString().slice(0, 10) };
  }
  return { start: `${today.slice(0, 7)}-01`, end: today };
};

export const reportMoney = (value: string | number | null | undefined) => value == null
  ? "—"
  : new Intl.NumberFormat("ka-GE", { style: "currency", currency: "GEL", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));

export const reportNumber = (value: string | number | null | undefined) => value == null ? "—" : new Intl.NumberFormat("ka-GE").format(Number(value));
export const reportDate = (value: string) => value.split("-").reverse().join(".");

export const REPORT_METRICS = {
  overview: [
    { key: "net_received", label: "თანხა დაბრუნებების შემდეგ", money: true, note: "მიღებული თანხა − დაბრუნებული თანხა; მიტანის ჩათვლით." },
    { key: "paid_orders", label: "გადახდილი შეკვეთები", money: false, note: "ამ პერიოდში დადასტურებულად გადახდილი შეკვეთები." },
    { key: "sold_units", label: "გაყიდული ერთეულები", money: false, note: "გადახდილი პროდუქტების რაოდენობა, დაბრუნებების გამოკლებამდე." },
    { key: "product_profit_net", label: "პროდუქტების მოგება", money: true, note: "დღგ-ის გარეშე, დაბრუნებების შემდეგ; სხვა ბიზნესხარჯების გამოკლებამდე." },
  ],
  sales: [
    { key: "paid_orders", label: "გადახდილი შეკვეთები", money: false, note: "ამ პერიოდში დადასტურებული გადახდის მქონე შეკვეთები." },
    { key: "sold_units", label: "გაყიდული ერთეულები", money: false, note: "გადახდილი პროდუქტების რაოდენობა, დაბრუნებების გამოკლებამდე." },
    { key: "product_received", label: "პროდუქტების გაყიდვები", money: true, note: "პროდუქტებში მიღებული თანხა დღგ-ით, მიტანის გარეშე." },
    { key: "average_order", label: "შეკვეთის საშუალო თანხა", money: true, note: "მიღებული სრული თანხა ÷ გადახდილი შეკვეთების რაოდენობა." },
  ],
  finance: [
    { key: "received", label: "მიღებული თანხა", money: true, note: "დადასტურებული გადახდები დღგ-ით, მიტანის ჩათვლით." },
    { key: "refunded", label: "დაბრუნებული თანხა", money: true, note: "ამ პერიოდში მომხმარებლებისთვის დადასტურებულად დაბრუნებული თანხა." },
    { key: "net_received", label: "თანხა დაბრუნებების შემდეგ", money: true, note: "მიღებული თანხა − დაბრუნებული თანხა." },
    { key: "product_profit_net", label: "პროდუქტების მოგება", money: true, note: "დღგ-ის გარეშე, დაბრუნებების შემდეგ; სხვა ბიზნესხარჯების გამოკლებამდე." },
  ],
} as const;
