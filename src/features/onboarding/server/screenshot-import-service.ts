import type { SupabaseClient } from "@supabase/supabase-js";

import { getBucketDate } from "@/features/portfolio/server/snapshots/bucket-date";
import { getInstrumentDailyPricesCached } from "@/features/market-data";
import {
  searchInstruments,
  getDisplayTicker,
} from "@/features/transactions/server/search-instruments";
import { createTransaction } from "@/features/transactions/server/create-transaction";
import {
  buildCashInstrument,
  isSupportedCashCurrency,
} from "@/features/transactions/lib/system-currencies";
import type { InstrumentSearchResult } from "@/features/transactions/lib/instrument-search";

import {
  normalizeScreenshotHoldings,
  type ScreenshotHolding,
} from "../lib/screenshot-holdings";

const PICK_TIMEOUT_MS = 3500;

const normalizeTicker = (value: string) => value.trim().toUpperCase();

const pickBestInstrument = (
  ticker: string,
  results: InstrumentSearchResult[]
) => {
  const normalizedTicker = normalizeTicker(ticker);
  const match = results.find((result) => {
    const symbol = result.symbol.toUpperCase();
    const display = getDisplayTicker(result.symbol, result.instrumentType).toUpperCase();
    const tickerValue = result.ticker.toUpperCase();
    return (
      symbol === normalizedTicker ||
      display === normalizedTicker ||
      tickerValue === normalizedTicker
    );
  });

  return match ?? results[0] ?? null;
};

const resolveInstruments = async (
  supabase: SupabaseClient,
  tickers: readonly string[]
) => {
  const resolved = new Map<string, InstrumentSearchResult>();
  const missing: string[] = [];

  await Promise.all(
    tickers.map(async (ticker) => {
      if (resolved.has(ticker)) return;

      try {
        const response = await searchInstruments(supabase, {
          query: ticker,
          limit: 6,
          timeoutMs: PICK_TIMEOUT_MS,
          mode: "auto",
        });

        const match = pickBestInstrument(ticker, response.results);
        if (match) {
          resolved.set(ticker, match);
        } else {
          missing.push(ticker);
        }
      } catch {
        missing.push(ticker);
      }
    })
  );

  return { resolved, missing };
};

const splitHoldings = (holdings: readonly ScreenshotHolding[]) => {
  const cash: ScreenshotHolding[] = [];
  const assets: ScreenshotHolding[] = [];

  holdings.forEach((holding) => {
    if (isSupportedCashCurrency(holding.ticker)) {
      cash.push(holding);
    } else {
      assets.push(holding);
    }
  });

  return { cash, assets };
};

export type ScreenshotImportOutcome = Readonly<
  | { ok: true; createdHoldings: number }
  | { ok: false; message: string; missingTickers?: readonly string[] }
>;

export async function importScreenshotHoldings(input: Readonly<{
  supabaseUser: SupabaseClient;
  supabaseAdmin: SupabaseClient;
  userId: string;
  portfolioId: string;
  holdings: readonly ScreenshotHolding[];
  notesTag: string;
}>): Promise<ScreenshotImportOutcome> {
  const normalizedHoldings = normalizeScreenshotHoldings(input.holdings);
  if (normalizedHoldings.length === 0) {
    return {
      ok: false,
      message: "Nie znaleźliśmy żadnych poprawnych pozycji.",
    };
  }

  const { assets, cash } = splitHoldings(normalizedHoldings);
  const uniqueTickers = Array.from(
    new Set(assets.map((holding) => normalizeTicker(holding.ticker)))
  );

  const { resolved, missing } = await resolveInstruments(
    input.supabaseUser,
    uniqueTickers
  );

  if (missing.length > 0) {
    return {
      ok: false,
      message: "Nie znaleźliśmy części tickerów. Popraw je w podglądzie.",
      missingTickers: missing,
    };
  }

  const priceDate = getBucketDate(new Date());
  const priceRequests = uniqueTickers
    .map((ticker) => {
      const instrument = resolved.get(ticker);
      if (!instrument) return null;
      if (instrument.provider !== "yahoo") return null;
      return {
        instrumentId: instrument.providerKey,
        provider: instrument.provider,
        providerKey: instrument.providerKey,
      } as const;
    })
    .filter(
      (
        request
      ): request is Readonly<{
        instrumentId: string;
        provider: "yahoo";
        providerKey: string;
      }> => Boolean(request)
    );

  const pricesByInstrument = await getInstrumentDailyPricesCached(
    input.supabaseUser,
    priceRequests,
    priceDate,
    {
      lookbackDays: 45,
      fetchRangeEnd: priceDate,
    }
  );

  const missingPrices: string[] = [];
  const priceByTicker = new Map<string, string>();

  uniqueTickers.forEach((ticker) => {
    const instrument = resolved.get(ticker);
    if (!instrument || instrument.provider !== "yahoo") {
      missingPrices.push(ticker);
      return;
    }

    const price = pricesByInstrument.get(instrument.providerKey) ?? null;
    if (!price) {
      missingPrices.push(ticker);
      return;
    }

    priceByTicker.set(ticker, price.close);
  });

  if (missingPrices.length > 0) {
    return {
      ok: false,
      message: "Nie udało się pobrać ceny dla części pozycji.",
      missingTickers: missingPrices,
    };
  }

  for (const holding of cash) {
    const currency = holding.ticker;
    if (!isSupportedCashCurrency(currency)) {
      continue;
    }

    const instrument = buildCashInstrument(currency);
    await createTransaction(input.supabaseUser, input.supabaseAdmin, input.userId, {
      type: "BUY",
      date: priceDate,
      quantity: holding.quantity,
      price: "1",
      fee: "0",
      notes: input.notesTag,
      customAnnualRatePct: undefined,
      consumeCash: false,
      cashflowType: "DEPOSIT",
      portfolioId: input.portfolioId,
      clientRequestId: crypto.randomUUID(),
      instrument: {
        provider: instrument.provider,
        providerKey: instrument.providerKey,
        symbol: instrument.symbol,
        name: instrument.name,
        currency: instrument.currency,
        instrumentType: instrument.instrumentType,
        exchange: instrument.exchange ?? undefined,
        region: instrument.region ?? undefined,
        logoUrl: instrument.logoUrl ?? undefined,
      },
    });
  }

  for (const holding of assets) {
    const ticker = normalizeTicker(holding.ticker);
    const instrument = resolved.get(ticker);
    const price = priceByTicker.get(ticker);
    if (!instrument || !price) {
      continue;
    }

    await createTransaction(input.supabaseUser, input.supabaseAdmin, input.userId, {
      type: "BUY",
      date: priceDate,
      quantity: holding.quantity,
      price,
      fee: "0",
      notes: input.notesTag,
      customAnnualRatePct: undefined,
      consumeCash: false,
      portfolioId: input.portfolioId,
      clientRequestId: crypto.randomUUID(),
      instrument: {
        provider: instrument.provider,
        providerKey: instrument.providerKey,
        symbol: instrument.symbol,
        name: instrument.name,
        currency: instrument.currency,
        instrumentType: instrument.instrumentType ?? undefined,
        exchange: instrument.exchange ?? undefined,
        region: instrument.region ?? undefined,
        logoUrl: instrument.logoUrl ?? undefined,
      },
    });
  }

  return { ok: true, createdHoldings: normalizedHoldings.length };
}
