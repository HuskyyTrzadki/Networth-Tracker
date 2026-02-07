import type { SupabaseClient } from "@supabase/supabase-js";

import { getInstrumentDailyPricesCached } from "@/features/market-data";
import { formatSuggestedPriceForInput } from "./lib/price-format";

type SupabaseServerClient = SupabaseClient;

export type InstrumentPriceOnDateInput = Readonly<{
  provider: "yahoo";
  providerKey: string;
  date: string;
}>;

export type InstrumentPriceOnDateResult = Readonly<{
  selectedDate: string;
  marketDate: string | null;
  ohlc: Readonly<{
    open: string | null;
    high: string | null;
    low: string | null;
    close: string;
  }> | null;
  suggestedPrice: string | null;
  range: Readonly<{ low: string; high: string }> | null;
  isFilledFromPreviousSession: boolean;
  warning: string | null;
}>;

const FALLBACK_LOOKBACK_DAYS = 45;

const buildRange = (
  low: string | null,
  high: string | null,
  close: string
): { low: string; high: string } => ({
  low: low ?? close,
  high: high ?? close,
});

export async function getInstrumentPriceOnDate(
  supabase: SupabaseServerClient,
  input: InstrumentPriceOnDateInput
): Promise<InstrumentPriceOnDateResult> {
  // Backend helper: resolve trading-session price on or before selected calendar date.
  const pricesByInstrument = await getInstrumentDailyPricesCached(
    supabase,
    [
      {
        instrumentId: "lookup",
        provider: input.provider,
        providerKey: input.providerKey,
      },
    ],
    input.date,
    {
      lookbackDays: FALLBACK_LOOKBACK_DAYS,
      fetchRangeStart: undefined,
      fetchRangeEnd: input.date,
    }
  );

  const price = pricesByInstrument.get("lookup") ?? null;
  if (!price) {
    return {
      selectedDate: input.date,
      marketDate: null,
      ohlc: null,
      suggestedPrice: null,
      range: null,
      isFilledFromPreviousSession: false,
      warning: "Brak danych rynkowych dla wybranej daty.",
    };
  }

  return {
    selectedDate: input.date,
    marketDate: price.marketDate,
    ohlc: {
      open: price.open,
      high: price.high,
      low: price.low,
      close: price.close,
    },
    suggestedPrice: formatSuggestedPriceForInput(price.close),
    range: buildRange(price.low, price.high, price.close),
    isFilledFromPreviousSession: price.isFilledFromPreviousSession,
    warning: price.isFilledFromPreviousSession
      ? "Wybrany dzień był bez sesji. Użyto ostatniej dostępnej sesji."
      : null,
  };
}
