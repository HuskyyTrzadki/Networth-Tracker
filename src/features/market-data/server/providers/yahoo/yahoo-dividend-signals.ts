import { yahooFinance } from "./yahoo-client";

type YahooHistoricalDividendRow = Readonly<{
  date: Date;
  dividends: number;
}>;

type YahooQuoteSummaryLike = Readonly<{
  calendarEvents?: Readonly<{
    dividendDate?: unknown;
    exDividendDate?: unknown;
  }>;
}>;

export type YahooDividendSignals = Readonly<{
  pastEvents: readonly Readonly<{
    eventDate: string;
    amountPerShare: string;
  }>[];
  upcomingEvent: Readonly<{
    eventDate: string;
    amountPerShare: string | null;
  }> | null;
}>;

const toIsoDate = (value: unknown): string | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    // Yahoo can return unix seconds in raw payload variants.
    return new Date(value * 1000).toISOString().slice(0, 10);
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }

  if (value && typeof value === "object" && "raw" in value) {
    const raw = (value as { raw?: unknown }).raw;
    return toIsoDate(raw);
  }

  return null;
};

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number) =>
  Promise.race([
    promise,
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), timeoutMs);
    }),
  ]);

const fetchHistoricalDividends = async (
  providerKey: string,
  period1: string,
  period2: string,
  timeoutMs: number
) => {
  const request = yahooFinance.historical(
    providerKey,
    {
      period1,
      period2,
      events: "dividends",
      interval: "1d",
    },
    { validateResult: false }
  );

  const raw = await withTimeout(request, timeoutMs);
  if (!raw || !Array.isArray(raw)) {
    return [] as YahooHistoricalDividendRow[];
  }

  return (raw as YahooHistoricalDividendRow[])
    .filter(
      (row) =>
        row.date instanceof Date &&
        !Number.isNaN(row.date.getTime()) &&
        typeof row.dividends === "number" &&
        Number.isFinite(row.dividends) &&
        row.dividends > 0
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};

const fetchUpcomingDividendDate = async (
  providerKey: string,
  timeoutMs: number
) => {
  const request = yahooFinance.quoteSummary(
    providerKey,
    { modules: ["calendarEvents"] },
    { validateResult: false }
  );

  const raw = await withTimeout(request, timeoutMs);
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const summary = raw as YahooQuoteSummaryLike;
  return (
    toIsoDate(summary.calendarEvents?.exDividendDate) ??
    toIsoDate(summary.calendarEvents?.dividendDate)
  );
};

export async function fetchYahooDividendSignals(
  providerKey: string,
  input: Readonly<{
    pastFromDate: string;
    pastToDate: string;
    futureToDate: string;
    historicalLookbackFromDate: string;
    timeoutMs: number;
  }>
): Promise<YahooDividendSignals> {
  const [historicalRows, upcomingDate] = await Promise.all([
    fetchHistoricalDividends(
      providerKey,
      input.historicalLookbackFromDate,
      input.pastToDate,
      input.timeoutMs
    ),
    fetchUpcomingDividendDate(providerKey, input.timeoutMs),
  ]);

  const pastEvents = historicalRows
    .filter((row) => {
      const eventDate = row.date.toISOString().slice(0, 10);
      return eventDate >= input.pastFromDate && eventDate <= input.pastToDate;
    })
    .map((row) => ({
      eventDate: row.date.toISOString().slice(0, 10),
      amountPerShare: row.dividends.toString(),
    }));

  const latestAmountPerShare =
    historicalRows.length > 0
      ? historicalRows[historicalRows.length - 1].dividends.toString()
      : null;

  const upcomingEvent =
    upcomingDate && upcomingDate > input.pastToDate && upcomingDate <= input.futureToDate
      ? {
          eventDate: upcomingDate,
          amountPerShare: latestAmountPerShare,
        }
      : null;

  return {
    pastEvents,
    upcomingEvent,
  };
}
