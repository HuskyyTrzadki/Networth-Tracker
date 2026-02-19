import type { SupabaseClient } from "@supabase/supabase-js";

import type { InstrumentQuote } from "@/features/market-data";

import type { PortfolioHolding } from "../get-portfolio-holdings";
import { computeCompoundedAnnualRateQuote } from "../custom-instruments/compound-annual-rate";

type CustomHoldingRow = Readonly<{
  custom_instrument_id: string;
  name: string;
  currency: string;
  quantity: string | number;
}>;

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

const normalizeCurrency = (value: string) => value.trim().toUpperCase();

export async function fetchCustomHoldingsAdminAsOf(input: Readonly<{
  supabase: SupabaseClient;
  userId: string;
  portfolioId: string | null;
  bucketDate: string;
}>): Promise<
  Readonly<{
    holdings: readonly PortfolioHolding[];
    quotesByInstrument: ReadonlyMap<string, InstrumentQuote | null>;
  }>
> {
  const { data: customHoldingsData, error: customHoldingsError } = await input.supabase.rpc(
    "get_custom_portfolio_holdings_admin_as_of",
    {
      p_user_id: input.userId,
      p_bucket_date: input.bucketDate,
      p_portfolio_id: input.portfolioId ?? undefined,
    }
  );
  if (customHoldingsError) {
    throw new Error(customHoldingsError.message);
  }

  const customRows = (customHoldingsData ?? []) as CustomHoldingRow[];
  const customIds = Array.from(
    new Set(customRows.map((row) => row.custom_instrument_id))
  );

  if (customIds.length === 0) {
    return { holdings: [], quotesByInstrument: new Map() };
  }

  const { data: customAnchorsData, error: customAnchorsError } = await input.supabase.rpc(
    "get_custom_portfolio_anchors_admin_as_of",
    {
      p_user_id: input.userId,
      p_bucket_date: input.bucketDate,
      p_portfolio_id: input.portfolioId ?? undefined,
      p_custom_instrument_ids: customIds,
    }
  );
  if (customAnchorsError) {
    throw new Error(customAnchorsError.message);
  }

  const anchors = (customAnchorsData ?? []) as CustomAnchorRow[];
  const anchorById = new Map(anchors.map((row) => [row.custom_instrument_id, row]));

  const asOf = `${input.bucketDate}T00:00:00.000Z`;
  const fetchedAt = new Date().toISOString();
  const quotesByInstrument = new Map<string, InstrumentQuote | null>();

  const holdings: PortfolioHolding[] = customRows.map((row) => {
    const instrumentId = `custom:${row.custom_instrument_id}`;
    const holding: PortfolioHolding = {
      instrumentId,
      symbol: "CUSTOM",
      name: row.name,
      currency: normalizeCurrency(row.currency),
      exchange: null,
      provider: "custom",
      providerKey: row.custom_instrument_id,
      logoUrl: null,
      instrumentType: null,
      quantity: normalizeNumeric(row.quantity),
    };

    const anchor = anchorById.get(row.custom_instrument_id);
    if (!anchor) {
      quotesByInstrument.set(instrumentId, null);
      return holding;
    }

    const quote = computeCompoundedAnnualRateQuote({
      anchorPrice: normalizeNumeric(anchor.price),
      anchorDate: anchor.trade_date,
      annualRatePct: normalizeNumeric(anchor.annual_rate_pct),
      asOfDate: input.bucketDate,
    });

    quotesByInstrument.set(instrumentId, {
      instrumentId,
      currency: holding.currency,
      price: quote.price,
      dayChange: quote.dayChange,
      dayChangePercent: quote.dayChangePercent,
      asOf,
      fetchedAt,
    });

    return holding;
  });

  return { holdings, quotesByInstrument };
}
