import type { Json } from "@/lib/supabase/database.types";

export type CurrencyExposureScope = "ALL" | "PORTFOLIO";

export type CurrencySplit = Readonly<{
  currencyCode: string;
  sharePct: number;
}>;

export type CachedAssetBreakdown = Readonly<{
  instrumentId: string;
  currencyExposure: readonly CurrencySplit[];
  rationale: string | null;
}>;

export type CurrencyExposureCacheRow = Readonly<{
  id: string;
  result_json: Json;
}>;
