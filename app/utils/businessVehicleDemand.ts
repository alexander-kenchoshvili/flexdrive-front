import type { BusinessPeriod } from "./businessReport";
export type VehicleDemandRow = { make: string; model: string; year: number | null; visits: number; vin_visits: number; no_results: number; missing_catalog: number };
export type VehicleDemandReport = {
  period: BusinessPeriod; generated_at: string; collection_started_at: string | null;
  summary: { visits: number; selections: number; no_results: number; missing_catalog: number };
  rows: VehicleDemandRow[]; row_count: number; insights: string[];
};
