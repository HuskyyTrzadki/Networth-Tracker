import type { createClient } from "@/lib/supabase/server";
import type { InstrumentQuote } from "@/features/market-data";

import { computeCompoundedAnnualRateQuote } from "./compound-annual-rate";

type SupabaseServerClient = ReturnType<typeof createClient>;

type CustomAnchorRow = Readonly<{
  custom_instrument_id: string;
  currency: string;
  annual_rate_pct: string | number;
  trade_date: string;
  price: string | number;
  created_at: string;
}>;

const normalizeNumeric = (value: string | number) =>
  typeof value === "number" ? value.toString() : value;

export async function getCustomInstrumentQuotesForPortfolio(
  supabase: SupabaseServerClient,
  input: Readonly<{
    portfolioId: string | null;
    customInstrumentIds: readonly string[];
    asOfDate: string;
  }>
): Promise<ReadonlyMap<string, InstrumentQuote | null>> {
  const customIds = Array.from(new Set(input.customInstrumentIds));
  if (customIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase.rpc("get_custom_portfolio_anchors", {
    p_portfolio_id: input.portfolioId,
    p_custom_instrument_ids: customIds,
  });

  if (error) {
    throw new Error(error.message);
  }

  const anchors = (data ?? []) as CustomAnchorRow[];
  const anchorById = new Map(anchors.map((row) => [row.custom_instrument_id, row]));

  const asOf = `${input.asOfDate}T00:00:00.000Z`;
  const fetchedAt = new Date().toISOString();
  const quotesByInstrument = new Map<string, InstrumentQuote | null>();

  customIds.forEach((customId) => {
    const anchor = anchorById.get(customId);
    if (!anchor) {
      quotesByInstrument.set(`custom:${customId}`, null);
      return;
    }

    const quote = computeCompoundedAnnualRateQuote({
      anchorPrice: normalizeNumeric(anchor.price),
      anchorDate: anchor.trade_date,
      annualRatePct: normalizeNumeric(anchor.annual_rate_pct),
      asOfDate: input.asOfDate,
    });

    quotesByInstrument.set(`custom:${customId}`, {
      instrumentId: `custom:${customId}`,
      currency: anchor.currency,
      price: quote.price,
      dayChange: quote.dayChange,
      dayChangePercent: quote.dayChangePercent,
      asOf,
      fetchedAt,
    });
  });

  return quotesByInstrument;
}
