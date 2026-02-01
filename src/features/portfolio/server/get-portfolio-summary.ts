import type { createClient } from "@/lib/supabase/server";

import {
  getFxRatesCached,
  getInstrumentQuotesCached,
  type CurrencyCode,
  type FxPair,
  type InstrumentQuoteRequest,
} from "@/features/market-data";

import { getPortfolioHoldings } from "./get-portfolio-holdings";
import { buildPortfolioSummary, type PortfolioSummary } from "./valuation";

type SupabaseServerClient = ReturnType<typeof createClient>;

type Input = Readonly<{
  portfolioId: string | null;
  baseCurrency: CurrencyCode;
}>;

export async function getPortfolioSummary(
  supabase: SupabaseServerClient,
  input: Input
): Promise<PortfolioSummary> {
  // Server helper: fetch holdings, quotes, and FX in one flow for the dashboard.
  const holdings = await getPortfolioHoldings(supabase, input.portfolioId);

  // For every holding we need a quote in its native currency.
  const quoteRequests: InstrumentQuoteRequest[] = holdings.map((holding) => ({
    instrumentId: holding.instrumentId,
    provider: "yahoo",
    providerKey: holding.providerKey,
  }));

  const quotesByInstrument = await getInstrumentQuotesCached(
    supabase,
    quoteRequests
  );

  // FX pairs are only needed when holding currency differs from base.
  const fxPairs = Array.from(
    new Set(
      holdings
        .map((holding) => holding.currency)
        .filter((currency) => currency !== input.baseCurrency)
    )
  ).map((currency) => ({
    from: currency,
    to: input.baseCurrency,
  })) satisfies FxPair[];

  const fxByPair = await getFxRatesCached(supabase, fxPairs);

  return buildPortfolioSummary({
    baseCurrency: input.baseCurrency,
    holdings,
    quotesByInstrument,
    fxByPair,
  });
}
