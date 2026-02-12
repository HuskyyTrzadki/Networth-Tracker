import type { createClient } from "@/lib/supabase/server";
import { yahooFinance } from "@/lib/yahoo-finance-client";

import { preloadInstrumentDailySeries } from "@/features/portfolio/server/snapshots/range-market-data";

import type {
  DailyChartPoint,
  IntradayChartPoint,
  StockChartRange,
} from "./types";
import { toFiniteNumber, toIsoDate } from "./value-normalizers";

type SupabaseServerClient = ReturnType<typeof createClient>;

type StockChartSeries = Readonly<{
  requestedRange: StockChartRange;
  resolvedRange: StockChartRange;
  timezone: string;
  currency: string | null;
  hasIntraday: boolean;
  dailyPoints: readonly DailyChartPoint[];
  intradayPoints: readonly IntradayChartPoint[];
}>;

type IntradayYahooQuote = Readonly<{
  date: Date;
  close: number | null;
}>;

type IntradayYahooResult = Readonly<{
  meta?: Readonly<{
    currency?: string;
    exchangeTimezoneName?: string;
  }>;
  quotes?: IntradayYahooQuote[];
}>;

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const TEN_YEAR_LOOKBACK_DAYS = 10 * 366;

const subtractDays = (date: Date, days: number) => {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() - days);
  return next;
};

const rangeStartDate = (range: Exclude<StockChartRange, "1D">) => {
  const today = new Date();

  switch (range) {
    case "1M":
      return subtractDays(today, 31);
    case "3M":
      return subtractDays(today, 92);
    case "6M":
      return subtractDays(today, 184);
    case "1Y":
      return subtractDays(today, 366);
    case "3Y":
      return subtractDays(today, 3 * 366);
    case "5Y":
      return subtractDays(today, 5 * 366);
    case "10Y":
      return subtractDays(today, TEN_YEAR_LOOKBACK_DAYS);
    case "ALL":
      return new Date("1970-01-01T00:00:00.000Z");
    default:
      return subtractDays(today, 31);
  }
};

const hasTenYearCoverage = (points: readonly DailyChartPoint[]) => {
  if (points.length === 0) return false;
  const firstPointDate = points[0]?.date;
  if (!firstPointDate) return false;

  const thresholdDate = toIsoDate(subtractDays(new Date(), TEN_YEAR_LOOKBACK_DAYS));
  return firstPointDate <= thresholdDate;
};

const loadIntraday = async (
  providerKey: string
): Promise<{
  timezone: string;
  currency: string | null;
  points: readonly IntradayChartPoint[];
}> => {
  const now = new Date();
  const period1 = new Date(now.getTime() - 2 * DAY_IN_MS);

  // 1D view: fetch intraday candles with pre/post market enabled.
  const raw = (await yahooFinance.chart(
    providerKey,
    {
      period1,
      period2: now,
      interval: "5m",
      includePrePost: true,
      events: "history",
    },
    { validateResult: false }
  )) as IntradayYahooResult;

  const timezone = raw.meta?.exchangeTimezoneName?.trim() || "UTC";
  const currency = raw.meta?.currency?.trim().toUpperCase() || null;
  const points = (raw.quotes ?? [])
    .map((quote) => {
      if (!(quote.date instanceof Date)) return null;
      const price = toFiniteNumber(quote.close);
      return {
        time: quote.date.toISOString(),
        timezone,
        currency,
        price,
      } satisfies IntradayChartPoint;
    })
    .filter((point): point is IntradayChartPoint => point !== null)
    .sort((left, right) => left.time.localeCompare(right.time));

  return { timezone, currency, points };
};

const loadDaily = async (
  supabase: SupabaseServerClient,
  providerKey: string,
  range: Exclude<StockChartRange, "1D">
): Promise<{
  timezone: string;
  currency: string | null;
  points: readonly DailyChartPoint[];
}> => {
  const from = rangeStartDate(range);
  const to = new Date();
  const fromDate = toIsoDate(from);
  const toDate = toIsoDate(to);

  const seriesByKey = await preloadInstrumentDailySeries(
    supabase,
    [{ instrumentId: providerKey, provider: "yahoo", providerKey }],
    fromDate,
    toDate,
    5_000
  );

  const rows = (seriesByKey.get(providerKey) ?? [])
    .filter((row) => row.price_date >= fromDate && row.price_date <= toDate)
    .sort((left, right) => left.price_date.localeCompare(right.price_date));
  const uniqueRowsByDate = new Map<string, (typeof rows)[number]>();
  rows.forEach((row) => {
    // Cache preload can merge cached + freshly fetched rows for same date.
    // Keep one row per market date to avoid duplicate points on chart.
    uniqueRowsByDate.set(row.price_date, row);
  });
  const dedupedRows = Array.from(uniqueRowsByDate.values()).sort((left, right) =>
    left.price_date.localeCompare(right.price_date)
  );

  const timezone = dedupedRows[0]?.exchange_timezone ?? "UTC";
  const currency = dedupedRows[0]?.currency ?? null;
  const points = dedupedRows.map((row) => {
    const close = toFiniteNumber(row.close);
    const adjClose = toFiniteNumber(row.adj_close);
    return {
      time: `${row.price_date}T00:00:00.000Z`,
      date: row.price_date,
      timezone: row.exchange_timezone,
      currency: row.currency,
      close,
      adjClose,
      price: adjClose ?? close,
    } satisfies DailyChartPoint;
  });

  return {
    timezone,
    currency,
    points,
  };
};

export async function getStockChartSeries(
  supabase: SupabaseServerClient,
  providerKey: string,
  range: StockChartRange
): Promise<StockChartSeries> {
  if (range === "1D") {
    const intraday = await loadIntraday(providerKey);
    if (intraday.points.length > 0) {
      return {
        requestedRange: range,
        resolvedRange: "1D",
        timezone: intraday.timezone,
        currency: intraday.currency,
        hasIntraday: true,
        intradayPoints: intraday.points,
        dailyPoints: [],
      };
    }

    const fallback = await loadDaily(supabase, providerKey, "1M");
    return {
      requestedRange: range,
      resolvedRange: "1M",
      timezone: fallback.timezone,
      currency: fallback.currency,
      hasIntraday: false,
      intradayPoints: [],
      dailyPoints: fallback.points,
    };
  }

  const daily = await loadDaily(supabase, providerKey, range);
  if (range === "10Y" && !hasTenYearCoverage(daily.points)) {
    return {
      requestedRange: range,
      resolvedRange: "ALL",
      timezone: daily.timezone,
      currency: daily.currency,
      hasIntraday: false,
      intradayPoints: [],
      dailyPoints: daily.points,
    };
  }

  return {
    requestedRange: range,
    resolvedRange: range,
    timezone: daily.timezone,
    currency: daily.currency,
    hasIntraday: false,
    intradayPoints: [],
    dailyPoints: daily.points,
  };
}
