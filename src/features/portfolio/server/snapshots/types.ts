import type { SnapshotCurrency } from "./supported-currencies";

export type SnapshotScope = "PORTFOLIO" | "ALL";

export type SnapshotTotals = Readonly<{
  totalValue: string | null;
  isPartial: boolean;
  missingQuotes: number;
  missingFx: number;
  asOf: string | null;
}>;

export type SnapshotRowInsert = Readonly<{
  user_id: string;
  scope: SnapshotScope;
  portfolio_id: string | null;
  bucket_date: string;
  captured_at?: string;
  total_value_pln: string | null;
  total_value_usd: string | null;
  total_value_eur: string | null;
  is_partial_pln: boolean;
  missing_quotes_pln: number;
  missing_fx_pln: number;
  as_of_pln: string | null;
  is_partial_usd: boolean;
  missing_quotes_usd: number;
  missing_fx_usd: number;
  as_of_usd: string | null;
  is_partial_eur: boolean;
  missing_quotes_eur: number;
  missing_fx_eur: number;
  as_of_eur: string | null;
}>;

export type SnapshotSeriesPoint = Readonly<{
  label: string;
  value: number;
}>;

export type SnapshotSeries = Readonly<{
  currency: SnapshotCurrency;
  points: readonly SnapshotSeriesPoint[];
  latestMeta: Readonly<{
    isPartial: boolean;
    missingQuotes: number;
    missingFx: number;
  }> | null;
}>;
