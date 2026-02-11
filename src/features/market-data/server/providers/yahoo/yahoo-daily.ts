import { yahooFinance } from "./yahoo-client";
import { formatDateInTimeZone } from "../../lib/date-utils";

type YahooChartQuote = Readonly<{
  date: Date;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  adjclose?: number | null;
  volume: number | null;
}>;

type YahooChartResponse = Readonly<{
  meta: Readonly<{
    currency?: string;
    exchangeTimezoneName?: string;
  }>;
  quotes?: YahooChartQuote[];
}>;

export type YahooDailyCandle = Readonly<{
  date: string;
  open: string | null;
  high: string | null;
  low: string | null;
  close: string;
  adjClose: string | null;
  volume: string | null;
  asOf: string;
}>;

export type YahooDailySeries = Readonly<{
  providerKey: string;
  currency: string;
  exchangeTimezone: string;
  candles: readonly YahooDailyCandle[];
}>;

const normalizeNullableNumber = (value: number | null) =>
  typeof value === "number" ? value.toString() : null;

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number) =>
  Promise.race([
    promise,
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), timeoutMs);
    }),
  ]);

export async function fetchYahooDailySeries(
  providerKey: string,
  fromDate: string,
  toDateInclusive: string,
  timeoutMs: number
): Promise<YahooDailySeries | null> {
  // Provider fetch: get daily candles in exchange timezone for historical valuation.
  const period1 = new Date(`${fromDate}T00:00:00Z`);
  const period2 = new Date(`${toDateInclusive}T23:59:59.999Z`);

  const request = yahooFinance.chart(
    providerKey,
    {
      period1,
      period2,
      interval: "1d",
      events: "history",
    },
    // Daily chart payloads can be partial for thin instruments; skip strict validation.
    { validateResult: false }
  );

  const raw = await withTimeout(request, timeoutMs);
  if (!raw) {
    return null;
  }

  const result = raw as YahooChartResponse;
  const currency = result.meta.currency?.trim().toUpperCase();
  if (!currency) {
    return null;
  }

  const exchangeTimezone = result.meta.exchangeTimezoneName?.trim() || "UTC";

  const candles = (result.quotes ?? [])
    .map((quote) => {
      if (!(quote.date instanceof Date)) {
        return null;
      }

      if (quote.close === null || Number.isNaN(quote.close)) {
        return null;
      }

      return {
        date: formatDateInTimeZone(quote.date, exchangeTimezone),
        open: normalizeNullableNumber(quote.open),
        high: normalizeNullableNumber(quote.high),
        low: normalizeNullableNumber(quote.low),
        close: quote.close.toString(),
        adjClose: normalizeNullableNumber(quote.adjclose ?? null),
        volume: normalizeNullableNumber(quote.volume),
        asOf: quote.date.toISOString(),
      } satisfies YahooDailyCandle;
    })
    .filter((item): item is YahooDailyCandle => Boolean(item));

  return {
    providerKey,
    currency,
    exchangeTimezone,
    candles,
  };
}

export const __test__ = { normalizeNullableNumber };
