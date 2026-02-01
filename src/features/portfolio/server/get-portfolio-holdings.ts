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

export async function getPortfolioHoldings(
  supabase: SupabaseServerClient,
  portfolioId: string | null
): Promise<readonly PortfolioHolding[]> {
  // Server helper: fetch pre-aggregated holdings (BUY - SELL) via RPC.
  const { data, error } = await supabase.rpc("get_portfolio_holdings", {
    p_portfolio_id: portfolioId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as PortfolioHoldingRow[];

  return rows.map((row) => ({
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
}
