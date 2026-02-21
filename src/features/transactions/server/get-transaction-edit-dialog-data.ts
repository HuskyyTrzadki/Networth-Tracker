import type { createClient } from "@/lib/supabase/server";

import { listPortfolios } from "@/features/portfolio/server/list-portfolios";

import { getAssetBalancesByPortfolio } from "./get-asset-balances";
import { getCashBalancesByPortfolio } from "./get-cash-balances";
import { getTransactionGroupByTransactionId } from "./get-transaction-group";
import { buildTransactionEditPreset } from "./get-transaction-edit-preset";

type SupabaseServerClient = ReturnType<typeof createClient>;

export async function getTransactionEditDialogData(
  supabase: SupabaseServerClient,
  userId: string,
  transactionId: string
) {
  const [portfolios, group] = await Promise.all([
    listPortfolios(supabase),
    getTransactionGroupByTransactionId(supabase, userId, transactionId),
  ]);

  const portfolioOptions = portfolios.map((portfolio) => ({
    id: portfolio.id,
    name: portfolio.name,
    baseCurrency: portfolio.baseCurrency,
  }));

  if (portfolioOptions.length === 0) {
    throw new Error("Brak portfela dla użytkownika.");
  }

  const selectedPortfolio = portfolioOptions.find(
    (portfolio) => portfolio.id === group.assetLeg.portfolioId
  );
  if (!selectedPortfolio) {
    throw new Error("Portfel transakcji nie istnieje albo jest niedostępny.");
  }

  const preset = buildTransactionEditPreset(group);
  const portfolioIds = portfolioOptions.map((portfolio) => portfolio.id);
  const [cashBalancesByPortfolio, assetBalancesByPortfolio] = await Promise.all([
    getCashBalancesByPortfolio(supabase, portfolioIds),
    getAssetBalancesByPortfolio(supabase, portfolioIds),
  ]);

  return {
    transactionId,
    portfolios: portfolioOptions,
    cashBalancesByPortfolio,
    assetBalancesByPortfolio,
    initialPortfolioId: selectedPortfolio.id,
    initialValues: preset.initialValues,
    initialInstrument: preset.initialInstrument,
  };
}
