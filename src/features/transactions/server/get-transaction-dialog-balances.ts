import type { createClient } from "@/lib/supabase/server";

import { getAssetBalancesByPortfolio } from "./get-asset-balances";
import { getCashBalancesByPortfolio } from "./get-cash-balances";

type SupabaseServerClient = ReturnType<typeof createClient>;

export type TransactionDialogBalances = Readonly<{
  portfolioId: string;
  cashBalances: Readonly<Record<string, string>>;
  assetBalances: Readonly<Record<string, string>>;
}>;

export async function getTransactionDialogBalances(
  supabase: SupabaseServerClient,
  portfolioId: string
): Promise<TransactionDialogBalances> {
  const [cashBalancesByPortfolio, assetBalancesByPortfolio] = await Promise.all([
    getCashBalancesByPortfolio(supabase, [portfolioId]),
    getAssetBalancesByPortfolio(supabase, [portfolioId]),
  ]);

  return {
    portfolioId,
    cashBalances: cashBalancesByPortfolio[portfolioId] ?? {},
    assetBalances: assetBalancesByPortfolio[portfolioId] ?? {},
  };
}
