import type { SupabaseClient } from "@supabase/supabase-js";

import type { SnapshotScope } from "./types";
import type { SnapshotChartRow } from "./types";
import { getBucketDate } from "./bucket-date";

const toNumber = (value: string | number | null) => {
  if (value === null) return null;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

type SnapshotRow = Readonly<{
  bucket_date: string;
  total_value_pln: string | number | null;
  total_value_usd: string | number | null;
  total_value_eur: string | number | null;
  net_external_cashflow_pln: string | number | null;
  net_external_cashflow_usd: string | number | null;
  net_external_cashflow_eur: string | number | null;
  net_implicit_transfer_pln: string | number | null;
  net_implicit_transfer_usd: string | number | null;
  net_implicit_transfer_eur: string | number | null;
  is_partial_pln: boolean;
  is_partial_usd: boolean;
  is_partial_eur: boolean;
}>;

type SnapshotRowsResult = Readonly<{
  hasSnapshots: boolean;
  rows: readonly SnapshotChartRow[];
}>;

export async function getPortfolioSnapshotRows(
  supabase: SupabaseClient,
  scope: SnapshotScope,
  portfolioId: string | null,
  days?: number
): Promise<SnapshotRowsResult> {
  // Server read: return snapshot rows for charting value + performance.
  if (scope === "PORTFOLIO" && !portfolioId) {
    throw new Error("Missing portfolioId for PORTFOLIO scope.");
  }

  let query = supabase
    .from("portfolio_snapshots")
    .select(
      "bucket_date,total_value_pln,total_value_usd,total_value_eur,net_external_cashflow_pln,net_external_cashflow_usd,net_external_cashflow_eur,net_implicit_transfer_pln,net_implicit_transfer_usd,net_implicit_transfer_eur,is_partial_pln,is_partial_usd,is_partial_eur"
    )
    .eq("scope", scope)
    .order("bucket_date", { ascending: true });

  if (typeof days === "number") {
    // Backend filter: keep bounded history for fixed ranges (7D/1M/1Y).
    // When days is omitted we intentionally return full snapshot history (ALL range).
    const fromDate = new Date();
    fromDate.setUTCDate(fromDate.getUTCDate() - Math.max(days - 1, 0));
    const fromBucket = getBucketDate(fromDate);
    query = query.gte("bucket_date", fromBucket);
  }

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
    rows: rows.map((row) => ({
      bucketDate: row.bucket_date,
      totalValuePln: toNumber(row.total_value_pln),
      totalValueUsd: toNumber(row.total_value_usd),
      totalValueEur: toNumber(row.total_value_eur),
      netExternalCashflowPln: toNumber(row.net_external_cashflow_pln),
      netExternalCashflowUsd: toNumber(row.net_external_cashflow_usd),
      netExternalCashflowEur: toNumber(row.net_external_cashflow_eur),
      netImplicitTransferPln: toNumber(row.net_implicit_transfer_pln),
      netImplicitTransferUsd: toNumber(row.net_implicit_transfer_usd),
      netImplicitTransferEur: toNumber(row.net_implicit_transfer_eur),
      isPartialPln: row.is_partial_pln,
      isPartialUsd: row.is_partial_usd,
      isPartialEur: row.is_partial_eur,
    })),
  };
}
