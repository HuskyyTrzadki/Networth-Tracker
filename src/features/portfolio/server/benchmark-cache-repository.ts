import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables, TablesInsert } from "@/lib/supabase/database.types";

type InstrumentCacheRow = Pick<
  Tables<"instrument_daily_prices_cache">,
  "provider_key" | "price_date" | "currency" | "close"
>;

type FxCacheRow = Pick<
  Tables<"fx_daily_rates_cache">,
  "base_currency" | "quote_currency" | "rate_date" | "rate"
>;

type InstrumentDailyUpsertRow = TablesInsert<"instrument_daily_prices_cache">;
type FxDailyUpsertRow = TablesInsert<"fx_daily_rates_cache">;

export type {
  FxCacheRow,
  FxDailyUpsertRow,
  InstrumentCacheRow,
  InstrumentDailyUpsertRow,
};

export type BenchmarkCacheRepository = Readonly<{
  readInstrumentRows: (
    providerKeys: readonly string[],
    fromDate: string,
    toDate: string
  ) => Promise<InstrumentCacheRow[]>;
  readFxRows: (
    currencies: readonly string[],
    fromDate: string,
    toDate: string
  ) => Promise<FxCacheRow[]>;
  upsertInstrumentRows: (rows: InstrumentDailyUpsertRow[]) => Promise<void>;
  upsertFxRows: (rows: FxDailyUpsertRow[]) => Promise<void>;
}>;

type CreateRepositoryInput = Readonly<{
  reader: SupabaseClient<Database>;
  writer?: SupabaseClient<Database> | null;
  provider: string;
}>;

export const createBenchmarkCacheRepository = ({
  reader,
  writer,
  provider,
}: CreateRepositoryInput): BenchmarkCacheRepository => ({
  async readInstrumentRows(providerKeys, fromDate, toDate) {
    const { data, error } = await reader
      .from("instrument_daily_prices_cache")
      .select("provider_key,price_date,currency,close")
      .eq("provider", provider)
      .in("provider_key", providerKeys)
      .gte("price_date", fromDate)
      .lte("price_date", toDate);

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async readFxRows(currencies, fromDate, toDate) {
    const { data, error } = await reader
      .from("fx_daily_rates_cache")
      .select("base_currency,quote_currency,rate_date,rate")
      .eq("provider", provider)
      .in("base_currency", currencies)
      .in("quote_currency", currencies)
      .gte("rate_date", fromDate)
      .lte("rate_date", toDate);

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async upsertInstrumentRows(rows) {
    if (!writer || rows.length === 0) return;

    const { error } = await writer.from("instrument_daily_prices_cache").upsert(rows, {
      onConflict: "provider,provider_key,price_date",
    });
    if (error) throw new Error(error.message);
  },

  async upsertFxRows(rows) {
    if (!writer || rows.length === 0) return;

    const { error } = await writer.from("fx_daily_rates_cache").upsert(rows, {
      onConflict: "provider,base_currency,quote_currency,rate_date",
    });
    if (error) throw new Error(error.message);
  },
});
