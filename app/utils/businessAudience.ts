import type { BusinessPeriod } from "./businessReport";
export type AudienceReport = {
  status: string; message?: string; period: BusinessPeriod; fetched_at: string | null; timezone?: string; warnings?: string[];
  new_users?: number; returning_users?: number;
  daily?: { date: string; new_users: number; returning_users: number }[];
  first_sources?: { source: string; new_users: number }[]; source_row_count?: number;
};
