import type { createClient } from "@/lib/supabase/server";

export type AssetBalancesByPortfolio = Readonly<
  Record<string, Readonly<Record<string, string>>>
>;

type SupabaseServerClient = ReturnType<typeof createClient>;

type PortfolioHoldingsRow = Readonly<{
  provider: string;
  provider_key: string | null;
  symbol: string;
  instrument_type: string | null;
  quantity: string | number;
}>;

const normalizeNumeric = (value: string | number) =>
  typeof value === "number" ? value.toString() : value;

const buildSearchInstrumentId = (input: Readonly<{
  provider: string;
  providerKey: string;
}>) => `${input.provider}:${input.providerKey}`;

export async function getAssetBalancesByPortfolio(
  supabase: SupabaseServerClient,
  portfolioIds: readonly string[]
): Promise<AssetBalancesByPortfolio> {
  // Server helper: collect current position quantities for quick SELL hints in the form.
  const result: Record<string, Record<string, string>> = {};

  portfolioIds.forEach((portfolioId) => {
    result[portfolioId] = {};
  });

  const holdingsByPortfolio = await Promise.all(
    portfolioIds.map(async (portfolioId) => {
      const { data, error } = await supabase.rpc("get_portfolio_holdings", {
        p_portfolio_id: portfolioId,
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        portfolioId,
        rows: (data ?? []) as PortfolioHoldingsRow[],
      };
    })
  );

  holdingsByPortfolio.forEach(({ portfolioId, rows }) => {
    rows.forEach((row) => {
      if (row.instrument_type === "CURRENCY") {
        return;
      }

      const providerKey = row.provider_key ?? row.symbol;
      const instrumentId = buildSearchInstrumentId({
        provider: row.provider,
        providerKey,
      });
      result[portfolioId][instrumentId] = normalizeNumeric(row.quantity);
    });
  });

  return result;
}
