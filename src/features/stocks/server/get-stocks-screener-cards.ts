import type { createClient } from "@/lib/supabase/server";

import { getInstrumentQuotesCached } from "@/features/market-data";
import { getPortfolioHoldings } from "@/features/portfolio/server/get-portfolio-holdings";

import type { StockScreenerCard } from "./types";

type SupabaseServerClient = ReturnType<typeof createClient>;

type HoldingKey = Readonly<{
  instrumentId: string;
  providerKey: string;
  symbol: string;
  name: string;
  logoUrl: string | null;
}>;

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

  return Array.from(byProviderKey.values())
    .map((holding) => {
      const quote = quotesByInstrument.get(holding.instrumentId) ?? null;
      return {
        providerKey: holding.providerKey,
        symbol: holding.symbol,
        name: holding.name,
        logoUrl: holding.logoUrl,
        currency: quote?.currency ?? "-",
        price: quote?.price ?? null,
        dayChangePercent:
          typeof quote?.dayChangePercent === "number" &&
          Number.isFinite(quote.dayChangePercent)
            ? quote.dayChangePercent
            : null,
        asOf: quote?.asOf ?? null,
      } satisfies StockScreenerCard;
    })
    .sort((left, right) => left.symbol.localeCompare(right.symbol, "pl-PL"));
}
