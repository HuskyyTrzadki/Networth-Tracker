export type TradingViewRevenueBreakdownKind = "geo" | "source";

export type TradingViewRevenueBreakdownInstrument = Readonly<{
  exchange: string | null;
  provider_key: string;
  symbol: string;
  name: string | null;
  instrument_type: string | null;
  updated_at: string;
}>;

export type ProcessTradingViewRevenueBreakdownInstrumentsInput = Readonly<{
  supabase: unknown;
  instruments: readonly TradingViewRevenueBreakdownInstrument[];
  provider: string;
  kind: TradingViewRevenueBreakdownKind;
  localeSubdomain?: string;
  dryRun?: boolean;
  delayMs?: number;
  timeBudgetMs?: number | null;
}>;

export type ProcessTradingViewRevenueBreakdownInstrumentsResult = Readonly<{
  processed: number;
  successes: number;
  failures: number;
  skipped: number;
  done: boolean;
  items: readonly unknown[];
}>;

export function processTradingViewRevenueBreakdownInstruments(
  input: ProcessTradingViewRevenueBreakdownInstrumentsInput
): Promise<ProcessTradingViewRevenueBreakdownInstrumentsResult>;

export function runTradingViewRevenueBreakdownBatch(
  argv: readonly string[]
): Promise<void>;
