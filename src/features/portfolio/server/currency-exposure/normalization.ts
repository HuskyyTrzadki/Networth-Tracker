import { z } from "zod";

import type { Json } from "@/lib/supabase/database.types";

import type { CachedAssetBreakdown, CurrencySplit } from "./types";

const numericSchema = z.preprocess((value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }
  return value;
}, z.number().finite());

export const modelResponseSchema = z.object({
  assets: z.array(
    z.object({
      instrumentId: z.string().trim().min(1),
      currencyExposure: z
        .array(
          z.object({
            currencyCode: z.string().trim().min(1),
            sharePct: numericSchema,
          })
        )
        .min(1),
      rationale: z.string().trim().optional(),
    })
  ),
});

const cachedResultSchema = z.object({
  assetBreakdown: z.array(
    z.object({
      instrumentId: z.string().trim().min(1),
      currencyExposure: z
        .array(
          z.object({
            currencyCode: z.string().trim().min(1),
            sharePct: numericSchema,
          })
        )
        .min(1),
      rationale: z.string().trim().nullable().optional(),
    })
  ),
});

const CURRENCY_SYNONYM_MAP: Readonly<Record<string, string>> = {
  DOLLAR: "USD",
  "US DOLLAR": "USD",
  "DOLAR AMERYKAŃSKI": "USD",
  EURO: "EUR",
  "EUROPEAN EURO": "EUR",
  ZLOTY: "PLN",
  "POLISH ZLOTY": "PLN",
  "OTHER AMERICAS": "USD",
  "OTHER EUROPE": "EUR",
  "EMERGING MARKETS": "USD",
};

export const normalizeCurrencyCode = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "OTHER";

  const upper = trimmed.toUpperCase();
  if (/^[A-Z]{3}$/.test(upper)) {
    return upper;
  }

  const mapped = CURRENCY_SYNONYM_MAP[upper];
  if (mapped) return mapped;

  return "OTHER";
};

export const normalizeCurrencyExposure = (
  splits: readonly CurrencySplit[],
  fallbackCurrency: string
): readonly CurrencySplit[] => {
  const aggregated = new Map<string, number>();

  splits.forEach((split) => {
    if (!Number.isFinite(split.sharePct) || split.sharePct <= 0) {
      return;
    }

    const currencyCode = normalizeCurrencyCode(split.currencyCode);
    aggregated.set(currencyCode, (aggregated.get(currencyCode) ?? 0) + split.sharePct);
  });

  if (aggregated.size === 0) {
    return [{ currencyCode: normalizeCurrencyCode(fallbackCurrency), sharePct: 100 }];
  }

  const total = Array.from(aggregated.values()).reduce((sum, share) => sum + share, 0);
  if (!Number.isFinite(total) || total <= 0) {
    return [{ currencyCode: normalizeCurrencyCode(fallbackCurrency), sharePct: 100 }];
  }

  return Array.from(aggregated.entries())
    .map(([currencyCode, sharePct]) => ({
      currencyCode,
      sharePct: (sharePct / total) * 100,
    }))
    .sort((left, right) => right.sharePct - left.sharePct);
};

export const toJsonRecordNumber = (value: Json): Record<string, number> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce<Record<string, number>>((acc, [key, raw]) => {
    const parsed =
      typeof raw === "number"
        ? raw
        : typeof raw === "string"
          ? Number(raw)
          : Number.NaN;

    if (Number.isFinite(parsed)) {
      acc[key] = parsed;
    }

    return acc;
  }, {});
};

export const parseCachedBreakdown = (
  value: Json
): readonly CachedAssetBreakdown[] | null => {
  const parsed = cachedResultSchema.safeParse(value);
  if (!parsed.success) {
    return null;
  }

  return parsed.data.assetBreakdown.map((item) => ({
    instrumentId: item.instrumentId,
    currencyExposure: item.currencyExposure.map((entry) => ({
      currencyCode: normalizeCurrencyCode(entry.currencyCode),
      sharePct: entry.sharePct,
    })),
    rationale: item.rationale ?? null,
  }));
};
