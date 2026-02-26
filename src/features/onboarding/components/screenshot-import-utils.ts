import type { InstrumentSearchClient } from "@/features/transactions/client/search-instruments";
import type { InstrumentSearchResult } from "@/features/transactions/lib/instrument-search";
import { isSupportedCashCurrency } from "@/features/transactions/lib/system-currencies";
import { parseDecimalString } from "@/lib/decimal";

import type { ScreenshotHoldingDraft } from "../lib/screenshot-holdings";
import type { HoldingRow } from "./ScreenshotHoldingsTable";

export const MAX_SCREENSHOT_FILES = 6;

export const normalizeTicker = (value: string) => value.trim().toUpperCase();
export const isSearchableTicker = (value: string) => value.trim().length >= 2;

const getDisplayTicker = (symbol: string, instrumentType?: string | null) => {
  if (symbol.endsWith(".WA")) {
    return symbol.slice(0, -3);
  }

  if (symbol.includes(".")) {
    return symbol.split(".")[0] ?? symbol;
  }

  if (instrumentType === "CRYPTOCURRENCY" && symbol.includes("-")) {
    return symbol.split("-")[0] ?? symbol;
  }

  return symbol;
};

const pickBestInstrument = (
  ticker: string,
  results: InstrumentSearchResult[]
) => {
  const normalized = normalizeTicker(ticker);
  const match = results.find((result) => {
    const symbol = normalizeTicker(result.symbol);
    const display = normalizeTicker(
      getDisplayTicker(result.symbol, result.instrumentType ?? null)
    );
    const resultTicker = normalizeTicker(result.ticker);
    return (
      symbol === normalized ||
      display === normalized ||
      resultTicker === normalized
    );
  });

  return match ?? results[0] ?? null;
};

const buildTickerVariants = (value: string) => {
  const normalized = normalizeTicker(value);
  if (!normalized) return [];

  const compact = normalized.replace(/\s+/g, "");
  const variants = new Set<string>([normalized, compact]);

  if (compact.endsWith(".WA")) {
    variants.add(compact.slice(0, -3));
  }

  if (compact.includes(".")) {
    variants.add(compact.replace(/\./g, ""));
    variants.add(compact.replace(/\./g, "-"));
    const first = compact.split(".")[0];
    if (first) variants.add(first);
  }

  if (compact.includes("-")) {
    variants.add(compact.replace(/-/g, ""));
    const first = compact.split("-")[0];
    if (first) variants.add(first);
  }

  variants.add(compact.replace(/[^A-Z0-9]/g, ""));

  return Array.from(variants).filter(isSearchableTicker);
};

export const resolveInstrumentMatch = async (
  ticker: string,
  searchClientToUse: InstrumentSearchClient,
  signal?: AbortSignal
) => {
  const variants = buildTickerVariants(ticker);
  let fallback: InstrumentSearchResult | null = null;

  for (const variant of variants) {
    if (signal?.aborted) return null;
    const results = await searchClientToUse(
      variant,
      { limit: 6, mode: "auto" },
      signal
    );
    if (results.length === 0) continue;
    const match =
      pickBestInstrument(ticker, results) ?? pickBestInstrument(variant, results);
    if (match) return match;
    fallback ??= results[0] ?? null;
  }

  return fallback;
};

export const buildRowId = () => crypto.randomUUID();

export const toRow = (holding: ScreenshotHoldingDraft): HoldingRow => ({
  id: buildRowId(),
  ticker: holding.ticker,
  quantity: holding.quantity,
  instrument: null,
});

export const buildRowValidation = (rows: readonly HoldingRow[]) => {
  const invalidIds = new Set<string>();
  rows.forEach((row) => {
    const ticker = normalizeTicker(row.ticker);
    const quantity = row.quantity.trim();
    if (!ticker) {
      invalidIds.add(row.id);
      return;
    }
    const parsedQuantity = quantity ? parseDecimalString(quantity) : null;
    if (!parsedQuantity || parsedQuantity.lte(0)) {
      invalidIds.add(row.id);
    }
  });

  return {
    invalidIds,
    isValid: invalidIds.size === 0 && rows.length > 0,
  };
};

export const resolveUnresolvedTickers = (rows: readonly HoldingRow[]) => {
  const pending = new Set<string>();
  rows.forEach((row) => {
    const normalized = normalizeTicker(row.ticker);
    if (!normalized) return;
    if (isSupportedCashCurrency(normalized)) return;
    if (row.instrument) return;
    pending.add(normalized);
  });
  return Array.from(pending);
};

export const resolveHighlightedTickers = (
  unresolvedTickers: readonly string[],
  missingTickers: readonly string[]
) => {
  const unresolvedSet = new Set(unresolvedTickers);
  const merged = new Set<string>();
  missingTickers.forEach((ticker) => {
    const normalized = normalizeTicker(ticker);
    if (!normalized) return;
    if (unresolvedSet.has(normalized)) {
      merged.add(normalized);
    }
  });
  unresolvedTickers.forEach((ticker) => merged.add(ticker));
  return Array.from(merged);
};

export const buildPreviewHoldings = (rows: readonly HoldingRow[]) =>
  rows
    .map((row) => {
      if (!row.instrument) return null;
      const normalized = normalizeTicker(row.ticker);
      if (!normalized || isSupportedCashCurrency(normalized)) return null;
      const quantity = row.quantity.trim();
      if (!quantity) return null;
      return { instrument: row.instrument, quantity };
    })
    .filter(Boolean) as {
    instrument: InstrumentSearchResult;
    quantity: string;
  }[];

export const buildPreviewFingerprint = (
  holdings: ReadonlyArray<{ instrument: InstrumentSearchResult; quantity: string }>
) =>
  holdings
    .map((holding) => `${holding.instrument.id}:${holding.quantity}`)
    .sort()
    .join("|");
