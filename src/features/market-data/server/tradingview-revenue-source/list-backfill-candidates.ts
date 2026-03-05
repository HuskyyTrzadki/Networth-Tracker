import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type SupabaseAdminClient = SupabaseClient<Database>;

export type TradingViewRevenueSourceBackfillCandidate = Readonly<{
  provider: string;
  providerKey: string;
  symbol: string;
  name: string | null;
  exchange: string | null;
  instrumentType: Database["public"]["Enums"]["instrument_type"];
  updatedAt: string;
  cacheFetchedAt: string | null;
}>;

type Input = Readonly<{
  supabase: SupabaseAdminClient;
  provider?: string;
  staleBefore: string;
  limit: number;
}>;

export async function listTradingViewRevenueSourceBackfillCandidates({
  supabase,
  provider = "yahoo",
  staleBefore,
  limit,
}: Input): Promise<readonly TradingViewRevenueSourceBackfillCandidate[]> {
  const { data, error } = await supabase.rpc(
    "list_tradingview_revenue_source_backfill_candidates",
    {
      p_provider: provider,
      p_stale_before: staleBefore,
      p_limit: limit,
    }
  );

  if (error) {
    throw new Error(`Failed to load TradingView revenue source candidates: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    provider: row.provider,
    providerKey: row.provider_key,
    symbol: row.symbol,
    name: row.name,
    exchange: row.exchange,
    instrumentType: row.instrument_type,
    updatedAt: row.updated_at,
    cacheFetchedAt: row.cache_fetched_at,
  }));
}

export async function countTradingViewRevenueSourceBackfillCandidates(
  supabase: SupabaseAdminClient,
  input: Readonly<{
    provider?: string;
    staleBefore: string;
  }>
): Promise<number> {
  const { data, error } = await supabase.rpc(
    "count_tradingview_revenue_source_backfill_candidates",
    {
      p_provider: input.provider ?? "yahoo",
      p_stale_before: input.staleBefore,
    }
  );

  if (error) {
    throw new Error(`Failed to count TradingView revenue source candidates: ${error.message}`);
  }

  return typeof data === "number" ? data : 0;
}
