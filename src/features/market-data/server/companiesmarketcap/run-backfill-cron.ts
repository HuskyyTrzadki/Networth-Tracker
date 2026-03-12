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
  processCompaniesMarketCapInstruments: (input: {
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
    delayMs?: number;
    dryRun?: boolean;
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
  limit: number;
  staleDays: number;
  delayMs: number;
  provider?: string;
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
    "../../../../../scripts/lib/companiesmarketcap-batch-core.mjs"
  )) as BatchModule;
}

export async function runCompaniesMarketCapCron({
  supabase,
  limit,
  staleDays,
  delayMs,
  provider = DEFAULT_PROVIDER,
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
      processedProviderKeys: [] as string[],
      remainingEstimate: 0,
      done: true,
      startedAt,
      finishedAt: new Date().toISOString(),
    };
  }

  const batchModule = await loadBatchModule();
  const result = await batchModule.processCompaniesMarketCapInstruments({
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
    delayMs,
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
    processedProviderKeys: candidates
      .map((candidate) => candidate.providerKey)
      .filter((value, index, array) => array.indexOf(value) === index),
    remainingEstimate: totalAfter,
    done: totalAfter === 0,
    startedAt,
    finishedAt: new Date().toISOString(),
    totalCandidatesBeforeRun: totalBefore,
  };
}
