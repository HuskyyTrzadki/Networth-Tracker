import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import {
  countTradingViewRevenueGeoBackfillCandidates,
  listTradingViewRevenueGeoBackfillCandidates,
} from "./list-backfill-candidates";

type SupabaseAdminClient = SupabaseClient<Database>;

type Input = Readonly<{
  supabase: SupabaseAdminClient;
  limit: number;
  staleDays: number;
  delayMs: number;
  timeBudgetMs: number;
  provider?: string;
  localeSubdomain?: string;
}>;

type TradingViewRevenueGeoBatchModule = Readonly<{
  processTradingViewRevenueGeoInstruments: (input: {
    supabase: SupabaseAdminClient;
    instruments: readonly {
      exchange: string | null;
      provider_key: string;
      symbol: string;
      name: string | null;
      instrument_type: string | null;
      updated_at: string;
    }[];
    provider: string;
    localeSubdomain?: string;
    dryRun?: boolean;
    delayMs?: number;
    timeBudgetMs?: number;
  }) => Promise<{
    processed: number;
    successes: number;
    failures: number;
    skipped: number;
    done: boolean;
    items: readonly unknown[];
  }>;
}>;

const DEFAULT_PROVIDER = "yahoo";
const BATCH_CORE_MODULE_PATH =
  "../../../../../scripts/lib/tradingview-revenue-geo-batch-core.mjs";

const resolveStaleBeforeIso = (staleDays: number) =>
  new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000).toISOString();

async function loadBatchModule(): Promise<TradingViewRevenueGeoBatchModule> {
  return (await import(BATCH_CORE_MODULE_PATH)) as TradingViewRevenueGeoBatchModule;
}

export async function runTradingViewRevenueGeoBackfillCron({
  supabase,
  limit,
  staleDays,
  delayMs,
  timeBudgetMs,
  provider = DEFAULT_PROVIDER,
  localeSubdomain = "www",
}: Input) {
  const startedAt = new Date().toISOString();
  const staleBefore = resolveStaleBeforeIso(staleDays);
  const totalBefore = await countTradingViewRevenueGeoBackfillCandidates(supabase, {
    provider,
    staleBefore,
  });

  const candidates = await listTradingViewRevenueGeoBackfillCandidates({
    supabase,
    provider,
    staleBefore,
    limit,
  });

  if (candidates.length === 0) {
    return {
      processed: 0,
      successes: 0,
      failures: 0,
      skipped: 0,
      remainingEstimate: 0,
      done: true,
      startedAt,
      finishedAt: new Date().toISOString(),
    };
  }

  const batchModule = await loadBatchModule();
  const result = await batchModule.processTradingViewRevenueGeoInstruments({
    supabase,
    instruments: candidates.map((candidate) => ({
      exchange: candidate.exchange,
      provider_key: candidate.providerKey,
      symbol: candidate.symbol,
      name: candidate.name,
      instrument_type: candidate.instrumentType,
      updated_at: candidate.updatedAt,
    })),
    provider,
    localeSubdomain,
    delayMs,
    timeBudgetMs,
    dryRun: false,
  });

  const totalAfter = await countTradingViewRevenueGeoBackfillCandidates(supabase, {
    provider,
    staleBefore,
  });

  return {
    processed: result.processed,
    successes: result.successes,
    failures: result.failures,
    skipped: result.skipped,
    remainingEstimate: totalAfter,
    done: totalAfter === 0,
    startedAt,
    finishedAt: new Date().toISOString(),
    totalCandidatesBeforeRun: totalBefore,
  };
}
