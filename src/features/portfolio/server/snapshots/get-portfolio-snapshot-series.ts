import type { SupabaseClient } from "@supabase/supabase-js";

import {
  SNAPSHOT_CURRENCIES,
  type SnapshotCurrency,
} from "./supported-currencies";
import type { SnapshotScope, SnapshotSeries } from "./types";

type SnapshotRow = Readonly<{
  bucket_date: string;
  total_value_pln: string | number | null;
  total_value_usd: string | number | null;
  total_value_eur: string | number | null;
  is_partial_pln: boolean;
  missing_quotes_pln: number;
  missing_fx_pln: number;
  is_partial_usd: boolean;
  missing_quotes_usd: number;
  missing_fx_usd: number;
  is_partial_eur: boolean;
  missing_quotes_eur: number;
  missing_fx_eur: number;
}>;

type SeriesResult = Readonly<{
  hasSnapshots: boolean;
  seriesByCurrency: Readonly<Record<SnapshotCurrency, SnapshotSeries>>;
}>;

const toNumber = (value: string | number | null) => {
  if (value === null) return null;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const buildSeries = (
  currency: SnapshotCurrency,
  rows: readonly SnapshotRow[]
): SnapshotSeries => {
  const points = rows
    .map((row) => {
      const valueKey =
        currency === "PLN"
          ? row.total_value_pln
          : currency === "USD"
            ? row.total_value_usd
            : row.total_value_eur;
      const value = toNumber(valueKey);
      if (value === null) return null;
      return { label: row.bucket_date, value };
    })
    .filter((point): point is NonNullable<typeof point> => Boolean(point));

  const latestRow = rows.at(-1);
  const latestMeta = latestRow
    ? {
        isPartial:
          currency === "PLN"
            ? latestRow.is_partial_pln
            : currency === "USD"
              ? latestRow.is_partial_usd
              : latestRow.is_partial_eur,
        missingQuotes:
          currency === "PLN"
            ? latestRow.missing_quotes_pln
            : currency === "USD"
              ? latestRow.missing_quotes_usd
              : latestRow.missing_quotes_eur,
        missingFx:
          currency === "PLN"
            ? latestRow.missing_fx_pln
            : currency === "USD"
              ? latestRow.missing_fx_usd
              : latestRow.missing_fx_eur,
      }
    : null;

  return { currency, points, latestMeta };
};

export async function getPortfolioSnapshotSeries(
  supabase: SupabaseClient,
  scope: SnapshotScope,
  portfolioId: string | null,
  days: number
): Promise<SeriesResult> {
  // Server read: fetch daily snapshots for charting.
  if (scope === "PORTFOLIO" && !portfolioId) {
    throw new Error("Missing portfolioId for PORTFOLIO scope.");
  }

  const fromDate = new Date();
  fromDate.setUTCDate(fromDate.getUTCDate() - Math.max(days - 1, 0));
  const fromBucket = fromDate.toISOString().slice(0, 10);

  let query = supabase
    .from("portfolio_snapshots")
    .select(
      "bucket_date,total_value_pln,total_value_usd,total_value_eur,is_partial_pln,missing_quotes_pln,missing_fx_pln,is_partial_usd,missing_quotes_usd,missing_fx_usd,is_partial_eur,missing_quotes_eur,missing_fx_eur"
    )
    .eq("scope", scope)
    .gte("bucket_date", fromBucket)
    .order("bucket_date", { ascending: true });

  if (scope === "PORTFOLIO") {
    query = query.eq("portfolio_id", portfolioId);
  } else {
    query = query.is("portfolio_id", null);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as SnapshotRow[];

  return {
    hasSnapshots: rows.length > 0,
    seriesByCurrency: SNAPSHOT_CURRENCIES.reduce(
      (acc, currency) => {
        acc[currency] = buildSeries(currency, rows);
        return acc;
      },
      {} as Record<SnapshotCurrency, SnapshotSeries>
    ),
  };
}
