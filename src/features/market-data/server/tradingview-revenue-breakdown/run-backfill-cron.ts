import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type SupabaseAdminClient = SupabaseClient<Database>;

type Candidate = Readonly<{
  provider: string;
  providerKey: string;
  symbol: string;
  name: string | null;
  exchange: string | null;
  instrumentType: Database["public"]["Enums"]["instrument_type"];
  updatedAt: string;
  cacheFetchedAt: string | null;
}>;

type BatchModule = Readonly<{
  processTradingViewRevenueBreakdownInstruments: (input: {
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
    kind: "geo" | "source";
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

type Input = Readonly<{
  supabase: SupabaseAdminClient;
  kind: "geo" | "source";
  limit: number;
  staleDays: number;
  delayMs: number;
  timeBudgetMs: number;
  provider?: string;
  localeSubdomain?: string;
  listCandidates: (input: {
    supabase: SupabaseAdminClient;
    provider?: string;
    staleBefore: string;
    limit: number;
  }) => Promise<readonly Candidate[]>;
  countCandidates: (
    supabase: SupabaseAdminClient,
    input: {
      provider?: string;
      staleBefore: string;
    }
  ) => Promise<number>;
}>;

const DEFAULT_PROVIDER = "yahoo";

const resolveStaleBeforeIso = (staleDays: number) =>
  new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000).toISOString();

async function loadBatchModule(): Promise<BatchModule> {
  return (await import(
    "../../../../../scripts/lib/tradingview-revenue-breakdown-batch-core.mjs"
  )) as BatchModule;
}

export async function runTradingViewRevenueBreakdownCron({
  supabase,
  kind,
  limit,
  staleDays,
  delayMs,
  timeBudgetMs,
  provider = DEFAULT_PROVIDER,
  localeSubdomain = "www",
  listCandidates,
  countCandidates,
}: Input) {
  const startedAt = new Date().toISOString();
  const staleBefore = resolveStaleBeforeIso(staleDays);
  const totalBefore = await countCandidates(supabase, {
    provider,
    staleBefore,
  });

  const candidates = await listCandidates({
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
  const result = await batchModule.processTradingViewRevenueBreakdownInstruments({
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
    kind,
    localeSubdomain,
    delayMs,
    timeBudgetMs,
    dryRun: false,
  });

  const totalAfter = await countCandidates(supabase, {
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
