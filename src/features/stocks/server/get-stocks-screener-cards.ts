import type { createClient } from "@/lib/supabase/server";

import { getInstrumentQuotesCached } from "@/features/market-data";
import { subtractIsoDays } from "@/features/market-data/server/lib/date-utils";
import { getPortfolioHoldings } from "@/features/portfolio/server/get-portfolio-holdings";
import { preloadInstrumentDailySeries } from "@/features/portfolio/server/snapshots/range-market-data";

import type { StockScreenerCard } from "./types";

type SupabaseServerClient = ReturnType<typeof createClient>;

type HoldingKey = Readonly<{
  instrumentId: string;
  providerKey: string;
  symbol: string;
  name: string;
  logoUrl: string | null;
}>;

const WEEK_LOOKBACK_DAYS = 7;

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const toFiniteNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return null;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const toWeekChangePercent = (series: readonly number[]) => {
  const start = series[0] ?? null;
  const end = series.at(-1) ?? null;
  if (start === null || end === null || start === 0) return null;
  return (end - start) / start;
};

export async function getStocksScreenerCards(
  supabase: SupabaseServerClient
): Promise<readonly StockScreenerCard[]> {
  // Server-side screener source: aggregate holdings across all portfolios.
  const holdings = await getPortfolioHoldings(supabase, null);

  const byProviderKey = new Map<string, HoldingKey>();
  holdings.forEach((holding) => {
    if (holding.instrumentType !== "EQUITY") return;
    if (holding.provider !== "yahoo") return;
    if (!holding.providerKey) return;
    if (byProviderKey.has(holding.providerKey)) return;

    byProviderKey.set(holding.providerKey, {
      instrumentId: holding.instrumentId,
      providerKey: holding.providerKey,
      symbol: holding.symbol,
      name: holding.name,
      logoUrl: holding.logoUrl ?? null,
    });
  });

  const quoteRequests = Array.from(byProviderKey.values()).map((holding) => ({
    instrumentId: holding.instrumentId,
    provider: "yahoo" as const,
    providerKey: holding.providerKey,
  }));

  const quotesByInstrument = await getInstrumentQuotesCached(supabase, quoteRequests);
  const nowDate = toIsoDate(new Date());
  const weekStartDate = subtractIsoDays(nowDate, WEEK_LOOKBACK_DAYS);
  const dailySeriesByProviderKey = await preloadInstrumentDailySeries(
    supabase,
    quoteRequests,
    weekStartDate,
    nowDate
  );

  const weekSeriesByProviderKey = new Map<string, readonly number[]>();
  dailySeriesByProviderKey.forEach((rows, providerKey) => {
    const closesByDate = new Map<string, number>();
    rows
      .filter(
        (row) => row.price_date >= weekStartDate && row.price_date <= nowDate
      )
      .sort((left, right) => left.price_date.localeCompare(right.price_date))
      .forEach((row) => {
        const price = toFiniteNumber(row.adj_close ?? row.close);
        if (price === null) return;
        closesByDate.set(row.price_date, price);
      });

    const series = Array.from(closesByDate.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, close]) => close);

    if (series.length === 1) {
      weekSeriesByProviderKey.set(providerKey, [series[0], series[0]]);
      return;
    }

    weekSeriesByProviderKey.set(providerKey, series);
  });

  return Array.from(byProviderKey.values())
    .map((holding) => {
      const quote = quotesByInstrument.get(holding.instrumentId) ?? null;
      const quotePrice = toFiniteNumber(quote?.price);
      const weekSparklineBase = weekSeriesByProviderKey.get(holding.providerKey) ?? [];
      const weekSparkline =
        weekSparklineBase.length >= 2
          ? weekSparklineBase
          : quotePrice === null
            ? [0, 0]
            : [quotePrice, quotePrice];
      return {
        providerKey: holding.providerKey,
        symbol: holding.symbol,
        name: holding.name,
        logoUrl: holding.logoUrl,
        currency: quote?.currency ?? "-",
        price: quote?.price ?? null,
        weekChangePercent: toWeekChangePercent(weekSparklineBase),
        weekSparkline,
        asOf: quote?.asOf ?? null,
      } satisfies StockScreenerCard;
    })
    .sort((left, right) => left.symbol.localeCompare(right.symbol, "pl-PL"));
}
