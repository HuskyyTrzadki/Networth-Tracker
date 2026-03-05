export type TradingViewRevenueSourceInstrument = Readonly<{
  exchange: string | null;
  provider_key: string;
  symbol: string;
  name: string | null;
  instrument_type: string | null;
  updated_at: string;
}>;

export type ProcessTradingViewRevenueSourceInstrumentsInput = Readonly<{
  supabase: unknown;
  instruments: readonly TradingViewRevenueSourceInstrument[];
  provider: string;
  localeSubdomain?: string;
  dryRun?: boolean;
  delayMs?: number;
  timeBudgetMs?: number | null;
}>;

export type ProcessTradingViewRevenueSourceInstrumentsResult = Readonly<{
  processed: number;
  successes: number;
  failures: number;
  skipped: number;
  done: boolean;
  items: readonly unknown[];
}>;

export function processTradingViewRevenueSourceInstruments(
  input: ProcessTradingViewRevenueSourceInstrumentsInput
): Promise<ProcessTradingViewRevenueSourceInstrumentsResult>;

export function runTradingViewRevenueSourceBatch(
  argv: readonly string[]
): Promise<void>;
