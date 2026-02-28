import type { createClient } from "@/lib/supabase/server";

import { getInstrumentQuotesCached } from "@/features/market-data";
import { subtractIsoDays } from "@/features/market-data/server/lib/date-utils";
import { getPortfolioHoldings } from "@/features/portfolio/server/get-portfolio-holdings";
import { preloadInstrumentDailySeries } from "@/features/portfolio/server/snapshots/range-market-data";
import { listStockWatchlist } from "./stock-watchlist";

import type { StockScreenerCard } from "./types";

type SupabaseServerClient = ReturnType<typeof createClient>;

type HoldingKey = Readonly<{
  instrumentId: string | null;
  providerKey: string;
  symbol: string;
  name: string;
  currency: string;
  logoUrl: string | null;
  inPortfolio: boolean;
  isFavorite: boolean;
}>;

type InstrumentLookupRow = Readonly<{
  id: string;
  provider_key: string;
  symbol: string;
  name: string;
  currency: string;
  logo_url: string | null;
}>;

const MONTH_LOOKBACK_DAYS = 31;

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const toFiniteNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return null;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const toPeriodChangePercent = (series: readonly number[]) => {
  const start = series[0] ?? null;
  const end = series.at(-1) ?? null;
  if (start === null || end === null || start === 0) return null;
  return (end - start) / start;
};

export async function getStocksScreenerCards(
  supabase: SupabaseServerClient
): Promise<readonly StockScreenerCard[]> {
  // Server-side screener source: aggregate holdings + user watchlist.
  const [holdings, watchlist] = await Promise.all([
    getPortfolioHoldings(supabase, null),
    listStockWatchlist(supabase),
  ]);

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
      currency: holding.currency,
      logoUrl: holding.logoUrl ?? null,
      inPortfolio: true,
      isFavorite: false,
    });
  });

  watchlist.forEach((stock) => {
    const existing = byProviderKey.get(stock.providerKey);
    if (existing) {
      byProviderKey.set(stock.providerKey, {
        ...existing,
        isFavorite: true,
      });
      return;
    }

    byProviderKey.set(stock.providerKey, {
      instrumentId: null,
      providerKey: stock.providerKey,
      symbol: stock.symbol,
      name: stock.name,
      currency: stock.currency,
      logoUrl: stock.logoUrl,
      inPortfolio: false,
      isFavorite: true,
    });
  });

  const providerKeysMissingInstrumentId = Array.from(byProviderKey.values())
    .filter((row) => !row.instrumentId)
    .map((row) => row.providerKey);

  if (providerKeysMissingInstrumentId.length > 0) {
    const { data: instrumentRows } = await supabase
      .from("instruments")
      .select("id,provider_key,symbol,name,currency,logo_url")
      .eq("provider", "yahoo")
      .in("provider_key", providerKeysMissingInstrumentId);

    const byProviderKeyLookup = new Map(
      ((instrumentRows ?? []) as InstrumentLookupRow[]).map((row) => [
        row.provider_key,
        row,
      ])
    );

    providerKeysMissingInstrumentId.forEach((providerKey) => {
      const instrument = byProviderKeyLookup.get(providerKey);
      if (!instrument) return;
      const existing = byProviderKey.get(providerKey);
      if (!existing) return;

      byProviderKey.set(providerKey, {
        ...existing,
        instrumentId: instrument.id,
        symbol: instrument.symbol || existing.symbol,
        name: instrument.name || existing.name,
        currency: instrument.currency || existing.currency,
        logoUrl: instrument.logo_url ?? existing.logoUrl,
      });
    });
  }

  const quoteRequests = Array.from(byProviderKey.values()).map((holding) => ({
    instrumentId: holding.instrumentId,
    provider: "yahoo" as const,
    providerKey: holding.providerKey,
  }))
    .filter((item): item is {
      instrumentId: string;
      provider: "yahoo";
      providerKey: string;
    } => Boolean(item.instrumentId));

  const quotesByInstrument = await getInstrumentQuotesCached(supabase, quoteRequests);
  const nowDate = toIsoDate(new Date());
  const monthStartDate = subtractIsoDays(nowDate, MONTH_LOOKBACK_DAYS);
  const dailySeriesByProviderKey = await preloadInstrumentDailySeries(
    supabase,
    quoteRequests,
    monthStartDate,
    nowDate
  );

  const monthSeriesByProviderKey = new Map<
    string,
    readonly Readonly<{ date: string; price: number }>[]
  >();
  dailySeriesByProviderKey.forEach((rows, providerKey) => {
    const closesByDate = new Map<string, number>();
    rows
      .filter(
        (row) => row.price_date >= monthStartDate && row.price_date <= nowDate
      )
      .sort((left, right) => left.price_date.localeCompare(right.price_date))
      .forEach((row) => {
        const price = toFiniteNumber(row.adj_close ?? row.close);
        if (price === null) return;
        closesByDate.set(row.price_date, price);
      });

    const series = Array.from(closesByDate.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, price]) => ({ date, price }));

    if (series.length === 1) {
      monthSeriesByProviderKey.set(providerKey, [
        series[0],
        { date: nowDate, price: series[0].price },
      ]);
      return;
    }

    monthSeriesByProviderKey.set(providerKey, series);
  });

  return Array.from(byProviderKey.values())
    .map((holding) => {
      const quote =
        holding.instrumentId === null
          ? null
          : (quotesByInstrument.get(holding.instrumentId) ?? null);
      const quotePrice = toFiniteNumber(quote?.price);
      const monthChartBase = monthSeriesByProviderKey.get(holding.providerKey) ?? [];
      const monthChart =
        monthChartBase.length >= 2
          ? monthChartBase
          : quotePrice === null
            ? [
                { date: monthStartDate, price: 0 },
                { date: nowDate, price: 0 },
              ]
            : [
                { date: monthStartDate, price: quotePrice },
                { date: nowDate, price: quotePrice },
              ];
      return {
        providerKey: holding.providerKey,
        symbol: holding.symbol,
        name: holding.name,
        logoUrl: holding.logoUrl,
        inPortfolio: holding.inPortfolio,
        isFavorite: holding.isFavorite,
        currency: quote?.currency ?? holding.currency ?? "-",
        price: quote?.price ?? null,
        monthChangePercent: toPeriodChangePercent(monthChartBase.map((point) => point.price)),
        monthChart,
        asOf: quote?.asOf ?? null,
      } satisfies StockScreenerCard;
    })
    .sort((left, right) => left.symbol.localeCompare(right.symbol, "pl-PL"));
}
