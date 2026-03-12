import type { Json } from "@/lib/supabase/database.types";

export const COMPANIES_MARKETCAP_METRICS = [
  "revenue",
  "earnings",
  "pe_ratio",
  "ps_ratio",
] as const;

export type CompaniesMarketCapMetric = (typeof COMPANIES_MARKETCAP_METRICS)[number];

export type CompaniesMarketCapAnnualHistoryPoint = Readonly<{
  year: number;
  value: number | null;
  changePercent: number | null;
  isTtm: boolean;
  periodLabel: string | null;
  dateRangeLabel?: string | null;
}>;

export type CompaniesMarketCapMetricSnapshot = Readonly<{
  providerKey: string;
  metric: CompaniesMarketCapMetric;
  slug: string;
  sourceUrl: string;
  ttmValue: number | null;
  ttmLabel: string | null;
  annualHistory: readonly CompaniesMarketCapAnnualHistoryPoint[];
  metadata: Json;
  fetchedAt: string;
}>;
