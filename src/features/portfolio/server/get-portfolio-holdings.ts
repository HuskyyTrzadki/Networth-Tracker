import type { createClient } from "@/lib/supabase/server";
import type { InstrumentType } from "@/features/market-data";

export type PortfolioHolding = Readonly<{
  instrumentId: string;
  symbol: string;
  name: string;
  currency: string;
  exchange: string | null;
  provider: string;
  providerKey: string;
  logoUrl: string | null;
  instrumentType: InstrumentType | null;
  quantity: string;
}>;

type SupabaseServerClient = ReturnType<typeof createClient>;

type PortfolioHoldingRow = Readonly<{
  instrument_id: string;
  symbol: string;
  name: string;
  currency: string;
  exchange: string | null;
  provider: string;
  provider_key: string;
  logo_url: string | null;
  instrument_type: InstrumentType | null;
  quantity: string | number;
}>;

const normalizeNumeric = (value: string | number) =>
  typeof value === "number" ? value.toString() : value;

type CustomHoldingRow = Readonly<{
  custom_instrument_id: string;
  name: string;
  currency: string;
  quantity: string | number;
}>;

export async function getPortfolioAssetHoldings(
  supabase: SupabaseServerClient,
  portfolioId: string | null
): Promise<readonly PortfolioHolding[]> {
  // Server helper: fetch pre-aggregated holdings across asset classes.
  const { data, error } = await supabase.rpc("get_portfolio_holdings", {
    p_portfolio_id: portfolioId ?? undefined,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as PortfolioHoldingRow[];

  const quotedHoldings = rows.map((row) => ({
    instrumentId: row.instrument_id,
    symbol: row.symbol,
    name: row.name,
    currency: row.currency,
    exchange: row.exchange ?? null,
    provider: row.provider,
    providerKey: row.provider_key,
    logoUrl: row.logo_url ?? null,
    instrumentType: row.instrument_type ?? null,
    // Supabase numeric values may arrive as string or number depending on runtime.
    quantity: normalizeNumeric(row.quantity),
  }));

  const { data: customData, error: customError } = await supabase.rpc(
    "get_custom_portfolio_holdings",
    {
      p_portfolio_id: portfolioId ?? undefined,
    }
  );

  if (customError) {
    throw new Error(customError.message);
  }

  const customRows = (customData ?? []) as CustomHoldingRow[];
  const customHoldings = customRows.map((row) => ({
    instrumentId: `custom:${row.custom_instrument_id}`,
    symbol: "CUSTOM",
    name: row.name,
    currency: row.currency,
    exchange: null,
    provider: "custom",
    providerKey: row.custom_instrument_id,
    logoUrl: null,
    instrumentType: null,
    quantity: normalizeNumeric(row.quantity),
  })) satisfies PortfolioHolding[];

  return [...quotedHoldings, ...customHoldings];
}

// Backward-compatible alias; this helper already returns all asset classes.
export const getPortfolioHoldings = getPortfolioAssetHoldings;
