import type { createClient } from "@/lib/supabase/server";

import {
  getFxRatesCached,
  getInstrumentQuotesCached,
  type CurrencyCode,
  type FxPair,
  type InstrumentQuoteRequest,
} from "@/features/market-data";

import { getBucketDate } from "./snapshots/bucket-date";
import {
  SNAPSHOT_CURRENCIES,
  type SnapshotCurrency,
} from "../lib/supported-currencies";
import { getPortfolioHoldings } from "./get-portfolio-holdings";
import { buildPortfolioSummary } from "./valuation";
import { getCustomInstrumentQuotesForPortfolio } from "./custom-instruments/get-custom-instrument-quotes";

type SupabaseServerClient = ReturnType<typeof createClient>;

export type LiveTotals = Readonly<{
  totalValue: number | null;
  isPartial: boolean;
  missingQuotes: number;
  missingFx: number;
  asOf: string | null;
}>;

export type LiveTotalsResult = Readonly<{
  hasHoldings: boolean;
  todayBucketDate: string;
  totalsByCurrency: Readonly<Record<SnapshotCurrency, LiveTotals>>;
}>;

type Input = Readonly<{
  portfolioId: string | null;
}>;

const toNumber = (value: string | number | null) => {
  if (value === null) return null;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const buildFxPairs = (
  holdings: readonly { currency: CurrencyCode }[]
): FxPair[] => {
  const pairs = new Set<string>();

  holdings.forEach((holding) => {
    SNAPSHOT_CURRENCIES.forEach((currency) => {
      if (holding.currency === currency) return;
      pairs.add(`${holding.currency}:${currency}`);
    });
  });

  return Array.from(pairs).map((key) => {
    const [from, to] = key.split(":");
    return { from, to };
  });
};

export async function getPortfolioLiveTotals(
  supabase: SupabaseServerClient,
  input: Input
): Promise<LiveTotalsResult> {
  // Server helper: compute "today" totals across snapshot currencies.
  const holdings = await getPortfolioHoldings(supabase, input.portfolioId);
  const hasHoldings = holdings.length > 0;

  const quoteRequests: InstrumentQuoteRequest[] = holdings
    .filter((holding) => holding.provider === "yahoo" && holding.instrumentType !== "CURRENCY")
    .map((holding) => ({
      instrumentId: holding.instrumentId,
      provider: "yahoo",
      providerKey: holding.providerKey,
    }));

  const quotesByInstrument = await getInstrumentQuotesCached(
    supabase,
    quoteRequests
  );

  const todayBucketDate = getBucketDate(new Date());
  const customQuotesByInstrument = await getCustomInstrumentQuotesForPortfolio(
    supabase,
    {
      portfolioId: input.portfolioId,
      customInstrumentIds: holdings
        .filter((holding) => holding.provider === "custom")
        .map((holding) => holding.providerKey),
      asOfDate: todayBucketDate,
    }
  );

  const fxPairs = buildFxPairs(holdings);
  const fxByPair = await getFxRatesCached(supabase, fxPairs);

  const mergedQuotesByInstrument = new Map(quotesByInstrument);
  customQuotesByInstrument.forEach((quote, instrumentId) => {
    mergedQuotesByInstrument.set(instrumentId, quote);
  });

  const totalsByCurrency = SNAPSHOT_CURRENCIES.reduce(
    (acc, currency) => {
      const summary = buildPortfolioSummary({
        baseCurrency: currency,
        holdings,
        quotesByInstrument: mergedQuotesByInstrument,
        fxByPair,
      });

      acc[currency] = {
        totalValue: toNumber(summary.totalValueBase),
        isPartial: summary.isPartial,
        missingQuotes: summary.missingQuotes,
        missingFx: summary.missingFx,
        asOf: summary.asOf,
      };
      return acc;
    },
    {} as Record<SnapshotCurrency, LiveTotals>
  );

  return {
    hasHoldings,
    todayBucketDate,
    totalsByCurrency,
  };
}
