import type { SupabaseClient } from "@supabase/supabase-js";

import { getInstrumentDailyPricesCached, getInstrumentQuotesCached } from "@/features/market-data";
import {
  fetchYahooQuotes,
  normalizeYahooQuote,
} from "@/features/market-data/server/providers/yahoo/yahoo-quote";
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
const LIVE_QUOTE_TTL_MS = 15 * 60 * 1000;
const LIVE_QUOTE_TIMEOUT_MS = 4000;
const SESSION_MISSING_WARNING =
  "Wybrany dzień był bez sesji. Użyto ostatniej dostępnej sesji.";
const SESSION_NOT_CLOSED_YET_WARNING =
  "Dzisiejsza sesja może jeszcze trwać. Użyto ostatniego dostępnego zamknięcia.";
const LIVE_QUOTE_WARNING =
  "Użyto bieżącej ceny rynkowej (live/cache) dla dzisiejszej daty.";

const buildRange = (
  low: string | null,
  high: string | null,
  close: string
): { low: string; high: string } => ({
  low: low ?? close,
  high: high ?? close,
});

const getIsoDateInTimeZone = (value: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error(`Could not format date in timezone ${timeZone}.`);
  }

  return `${year}-${month}-${day}`;
};

const isWeekendIsoDate = (value: string) => {
  const [yearRaw, monthRaw, dayRaw] = value.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const weekday = parsed.getUTCDay();
  return weekday === 0 || weekday === 6;
};

const resolveFallbackWarning = ({
  selectedDate,
  marketDate,
  exchangeTimezone,
  now = new Date(),
}: Readonly<{
  selectedDate: string;
  marketDate: string;
  exchangeTimezone: string;
  now?: Date;
}>) => {
  // Same-day fallback on a weekday often means "daily candle not closed yet", not "no session day".
  const todayInExchange = getIsoDateInTimeZone(now, exchangeTimezone);
  const isSameDaySelection = selectedDate === todayInExchange;
  const isHistoricalFallback = marketDate < selectedDate;

  if (isSameDaySelection && isHistoricalFallback && !isWeekendIsoDate(selectedDate)) {
    return SESSION_NOT_CLOSED_YET_WARNING;
  }

  return SESSION_MISSING_WARNING;
};

const isSelectedDateTodayInTimeZone = ({
  selectedDate,
  exchangeTimezone,
  now = new Date(),
}: Readonly<{
  selectedDate: string;
  exchangeTimezone: string;
  now?: Date;
}>) => selectedDate === getIsoDateInTimeZone(now, exchangeTimezone);

const resolveInstrumentId = async (
  supabase: SupabaseServerClient,
  input: InstrumentPriceOnDateInput
) => {
  // Resolve canonical instrument UUID for quote cache lookups.
  const { data, error } = await supabase
    .from("instruments")
    .select("id")
    .eq("provider", input.provider)
    .eq("provider_key", input.providerKey)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id ?? null;
};

const getLiveQuotePrice = async (
  supabase: SupabaseServerClient,
  input: InstrumentPriceOnDateInput
) => {
  const instrumentId = await resolveInstrumentId(supabase, input);

  if (instrumentId) {
    const quotes = await getInstrumentQuotesCached(
      supabase,
      [
        {
          instrumentId,
          provider: input.provider,
          providerKey: input.providerKey,
        },
      ],
      { ttlMs: LIVE_QUOTE_TTL_MS }
    );
    const cachedOrLiveQuote = quotes.get(instrumentId) ?? null;
    if (cachedOrLiveQuote) {
      return cachedOrLiveQuote.price;
    }
  }

  // Fallback for symbols not yet persisted in `instruments` cache.
  const bySymbol = await fetchYahooQuotes([input.providerKey], LIVE_QUOTE_TIMEOUT_MS);
  const directQuote = normalizeYahooQuote(
    input.providerKey,
    bySymbol[input.providerKey]
  );

  return directQuote?.price ?? null;
};

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
  const exchangeTimezone = price?.exchangeTimezone ?? "UTC";
  const isSelectedToday = isSelectedDateTodayInTimeZone({
    selectedDate: input.date,
    exchangeTimezone,
  });

  if (isSelectedToday) {
    // For today's date, prefer fresh quote cache/live over previous daily close.
    const liveQuotePrice = await getLiveQuotePrice(supabase, input);

    if (liveQuotePrice) {
      return {
        selectedDate: input.date,
        marketDate: input.date,
        ohlc: null,
        suggestedPrice: formatSuggestedPriceForInput(liveQuotePrice),
        range: null,
        isFilledFromPreviousSession: false,
        warning: LIVE_QUOTE_WARNING,
      };
    }
  }

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
      ? resolveFallbackWarning({
          selectedDate: input.date,
          marketDate: price.marketDate,
          exchangeTimezone: price.exchangeTimezone,
        })
      : null,
  };
}

export const __test__ = {
  resolveFallbackWarning,
  isSelectedDateTodayInTimeZone,
  isWeekendIsoDate,
  getIsoDateInTimeZone,
};
