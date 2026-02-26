import { z } from "zod";

import { parseDecimalString } from "@/lib/decimal";
import { isSupportedCashCurrency } from "@/features/transactions/lib/system-currencies";

const rawHoldingSchema = z.object({
  ticker: z.string().optional(),
  quantity: z.union([z.string(), z.number()]).optional(),
});

const rawHoldingsSchema = z.union([
  z.array(rawHoldingSchema),
  z.object({ holdings: z.array(rawHoldingSchema) }),
]);

export type ScreenshotHolding = Readonly<{
  ticker: string;
  quantity: string;
}>;

export type ScreenshotHoldingDraft = Readonly<{
  ticker: string;
  quantity: string;
}>;

const normalizeTicker = (value: string) =>
  value.trim().replace(/\s+/g, "").toUpperCase();

const normalizeQuantity = (value: string | number) => {
  const parsed = parseDecimalString(value);
  if (!parsed || parsed.lte(0)) return null;
  return parsed.toString();
};

const coerceHoldingsArray = (input: unknown) => {
  const parsed = rawHoldingsSchema.safeParse(input);
  if (!parsed.success) return null;
  return Array.isArray(parsed.data) ? parsed.data : parsed.data.holdings;
};

export const normalizeScreenshotHoldingsForReview = (
  input: unknown
): ScreenshotHoldingDraft[] => {
  const rows = coerceHoldingsArray(input);
  if (!rows) return [];

  const results: ScreenshotHoldingDraft[] = [];
  const seen = new Set<string>();

  rows.forEach((row) => {
    const tickerRaw = row.ticker?.trim() ?? "";
    const quantityRaw = row.quantity;
    const ticker = tickerRaw ? normalizeTicker(tickerRaw) : "";
    const quantity =
      quantityRaw === undefined || quantityRaw === null
        ? ""
        : normalizeQuantity(quantityRaw) ?? "";

    if (!ticker && !quantity) {
      return;
    }

    const key = ticker && quantity ? `${ticker}:${quantity}` : null;
    if (key && seen.has(key)) {
      return;
    }

    if (key) {
      seen.add(key);
    }

    results.push({ ticker, quantity });
  });

  return results;
};

export const normalizeScreenshotHoldings = (input: unknown): ScreenshotHolding[] => {
  const rows = coerceHoldingsArray(input);
  if (!rows) return [];

  const results: ScreenshotHolding[] = [];
  const seen = new Set<string>();

  rows.forEach((row) => {
    const tickerRaw = row.ticker?.trim();
    const quantityRaw = row.quantity;
    if (!tickerRaw || quantityRaw === undefined || quantityRaw === null) {
      return;
    }

    const ticker = normalizeTicker(tickerRaw);
    const quantity = normalizeQuantity(quantityRaw);
    if (!ticker || !quantity) {
      return;
    }

    const key = `${ticker}:${quantity}`;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    results.push({ ticker, quantity });
  });

  return results;
};

export const isCashHolding = (holding: ScreenshotHolding) =>
  isSupportedCashCurrency(holding.ticker);
