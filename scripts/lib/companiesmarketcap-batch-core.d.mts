import type { Database } from "../../src/lib/supabase/database.types";

import type { SupabaseClient } from "@supabase/supabase-js";

type SupabaseAdminClient = SupabaseClient<Database>;

export type CompaniesMarketCapBatchInstrument = Readonly<{
  exchange: string | null;
  provider_key: string;
  symbol: string;
  name: string | null;
  instrument_type: string | null;
  updated_at: string;
}>;

export declare function processCompaniesMarketCapInstruments(input: {
  supabase: SupabaseAdminClient;
  instruments: readonly CompaniesMarketCapBatchInstrument[];
  provider: string;
  dryRun?: boolean;
  delayMs?: number;
}): Promise<{
  processed: number;
  successes: number;
  failures: number;
  skipped: number;
  done: boolean;
  items: readonly unknown[];
}>;

export declare function runCompaniesMarketCapBatch(
  argv: readonly string[]
): Promise<void>;
