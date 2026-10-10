import { reportMoney, reportNumber } from "./businessReport";

export type ReturnFilter = "awaiting" | "received" | "not_required" | "all";
export type PaymentFilter = "attention" | "pending" | "failed" | "issues";
export type OperationsQuery = {
  returns: ReturnFilter; payments: PaymentFilter;
  returns_page: number; stock_page: number; payments_page: number;
};
export const operationsQuery = (): OperationsQuery => ({ returns: "awaiting", payments: "attention", returns_page: 1, stock_page: 1, payments_page: 1 });
export type OperationsPage<T> = { items: T[]; total: number; page: number; pages: number; page_size: number };
export type OperationReturn = {
  id: number; order_number: string; receipt_status: string; receipt_label: string; disposition_label: string;
  payment_label: string; requested_at: string; received_at: string | null; waiting_days: number | null;
  expected_units: number; saleable_units: number; unsaleable_units: number; product_count: number;
  products: { name: string; sku: string; quantity: number }[];
};
export type OperationStock = {
  id: number; name: string; sku: string; order_number: string; received_at: string; age_days: number | null;
  received_units: number; remaining_units: number; unit_cost_gross: string | null; value_gross: string | null;
};
export type OperationPayment = {
  id: number; order_number: string | null; action_label: string; status: string; status_label: string;
  amount: string; currency: string; created_at: string; updated_at: string; expires_at: string | null;
  issue: string | null; checked_at: string | null;
};
export type OperationSync = {
  key: string; label: string; last_success_at: string | null;
  latest: null | { status: string; status_label: string; started_at: string; finished_at: string; source_label: string | null;
    counts: { key: string; label: string; value: number | null }[] };
};
export type OperationsReport = {
  generated_at: string; timezone: string;
  returns: OperationsPage<OperationReturn> & { filter: ReturnFilter; summary: { awaiting: number; received: number; not_required: number; awaiting_units: number } };
  stock: OperationsPage<OperationStock> & { summary: { units: number; products: number; lots: number; unknown_cost_units: number; known_value_gross: string; value_gross: string | null; invalid_lots: number } };
  payments: OperationsPage<OperationPayment> & { filter: PaymentFilter; summary: { pending: number; failed: number; issues: number; attention: number } };
  syncs: OperationSync[];
};

export const operationsDate = (value: string | null) => value ? new Intl.DateTimeFormat("ka-GE", {
  timeZone: "Asia/Tbilisi", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
}).format(new Date(value)) : "—";
export const operationsMoney = (value: string | null, currency = "GEL") => currency === "GEL" ? reportMoney(value) : `${reportNumber(value)} ${currency}`;
