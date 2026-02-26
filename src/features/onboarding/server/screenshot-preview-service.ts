import type { SupabaseClient } from "@supabase/supabase-js";

import { getFxRatesCached, type FxPair, type InstrumentQuote } from "@/features/market-data";
import { fetchYahooQuotes, normalizeYahooQuote } from "@/features/market-data/server/providers/yahoo/yahoo-quote";
import { buildPortfolioSummary } from "@/features/portfolio/server/valuation";
import type { PortfolioHolding } from "@/features/portfolio/server/get-portfolio-holdings";
import type { InstrumentSearchResult } from "@/features/transactions/lib/instrument-search";
import { buildInstrumentId } from "@/features/transactions/server/search/search-utils";

export type ScreenshotPreviewHolding = Readonly<{
  instrument: InstrumentSearchResult;
  quantity: string;
}>;

export type ScreenshotPreviewResult = Readonly<{
  totalUsd: string | null;
  missingQuotes: number;
  missingFx: number;
  asOf: string | null;
  holdings: readonly Readonly<{
    instrumentId: string;
    price: string | null;
    currency: string;
  }>[];
}>;

const USD = "USD";

const normalizeCurrency = (value: string) => value.trim().toUpperCase();

const buildPreviewInstrumentId = (instrument: InstrumentSearchResult) =>
  buildInstrumentId({
    provider: instrument.provider,
    providerKey: instrument.providerKey,
  });

const toHolding = (input: ScreenshotPreviewHolding): PortfolioHolding => ({
  instrumentId: buildPreviewInstrumentId(input.instrument),
  symbol: input.instrument.symbol,
  name: input.instrument.name,
  currency: normalizeCurrency(input.instrument.currency),
  exchange: input.instrument.exchange ?? null,
  provider: input.instrument.provider,
  providerKey: input.instrument.providerKey,
  logoUrl: input.instrument.logoUrl ?? null,
  instrumentType: input.instrument.instrumentType ?? null,
  quantity: input.quantity.trim(),
});

const buildFxPairs = (holdings: readonly PortfolioHolding[]) => {
  const pairs = new Set<string>();
  holdings.forEach((holding) => {
    if (!holding.currency || holding.currency === USD) return;
    pairs.add(`${holding.currency}:${USD}`);
  });
  return Array.from(pairs).map((key) => {
    const [from, to] = key.split(":");
    return { from, to } as FxPair;
  });
};

export async function previewScreenshotHoldingsValueUsd(
  supabase: SupabaseClient,
  holdings: readonly ScreenshotPreviewHolding[]
): Promise<ScreenshotPreviewResult> {
  const normalizedHoldings = holdings.map(toHolding);

  const quoteKeys = Array.from(
    new Set(
      holdings
        .filter(
          (holding) =>
            holding.instrument.provider === "yahoo" &&
            holding.instrument.instrumentType !== "CURRENCY"
        )
        .flatMap((holding) => {
          const candidates = [
            holding.instrument.providerKey,
            holding.instrument.symbol,
            holding.instrument.ticker,
          ]
            .map((value) => value.trim())
            .filter(Boolean);
          return Array.from(new Set(candidates));
        })
    )
  );

  const quotesByInstrument = new Map<string, InstrumentQuote | null>();
  if (quoteKeys.length > 0) {
    const bySymbol = await fetchYahooQuotes(quoteKeys, 4000);
    const fetchedAt = new Date().toISOString();
    holdings.forEach((holding) => {
      if (
        holding.instrument.provider !== "yahoo" ||
        holding.instrument.instrumentType === "CURRENCY"
      ) {
        return;
      }

      const candidates = [
        holding.instrument.providerKey,
        holding.instrument.symbol,
        holding.instrument.ticker,
      ]
        .map((value) => value.trim())
        .filter(Boolean);
      const uniqueCandidates = Array.from(new Set(candidates));
      const normalized =
        uniqueCandidates
          .map((key) => normalizeYahooQuote(key, bySymbol[key]))
          .find(Boolean) ?? null;
      const instrumentId = buildInstrumentId({
        provider: "yahoo",
        providerKey: holding.instrument.providerKey,
      });
      if (!normalized) {
        quotesByInstrument.set(instrumentId, null);
        return;
      }
      quotesByInstrument.set(instrumentId, {
        instrumentId,
        currency: normalized.currency,
        price: normalized.price,
        dayChange: normalized.dayChange ?? null,
        dayChangePercent: normalized.dayChangePercent ?? null,
        asOf: normalized.asOf,
        fetchedAt,
      });
    });
  }

  const fxPairs = buildFxPairs(normalizedHoldings);
  const fxByPair = await getFxRatesCached(supabase, fxPairs);

  const summary = buildPortfolioSummary({
    baseCurrency: USD,
    holdings: normalizedHoldings,
    quotesByInstrument,
    fxByPair,
  });

  return {
    totalUsd: summary.totalValueBase,
    missingQuotes: summary.missingQuotes,
    missingFx: summary.missingFx,
    asOf: summary.asOf,
    holdings: summary.holdings.map((holding) => ({
      instrumentId: holding.instrumentId,
      price: holding.price,
      currency: holding.currency,
    })),
  };
}
