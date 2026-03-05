export type TradingViewRevenueGeoInstrument = Readonly<{
  exchange: string | null;
  provider_key: string;
  symbol: string;
  name: string | null;
  instrument_type: string | null;
  updated_at: string;
}>;

export type ProcessTradingViewRevenueGeoInstrumentsInput = Readonly<{
  supabase: unknown;
  instruments: readonly TradingViewRevenueGeoInstrument[];
  provider: string;
  localeSubdomain?: string;
  dryRun?: boolean;
  delayMs?: number;
  timeBudgetMs?: number | null;
}>;

export type ProcessTradingViewRevenueGeoInstrumentsResult = Readonly<{
  processed: number;
  successes: number;
  failures: number;
  skipped: number;
  done: boolean;
  items: readonly unknown[];
}>;

export function processTradingViewRevenueGeoInstruments(
  input: ProcessTradingViewRevenueGeoInstrumentsInput
): Promise<ProcessTradingViewRevenueGeoInstrumentsResult>;

export function runTradingViewRevenueGeoBatch(
  argv: readonly string[]
): Promise<void>;
