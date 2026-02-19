import type { createClient } from "@/lib/supabase/server";

import {
  SUPPORTED_CASH_CURRENCIES,
  isSupportedCashCurrency,
  type CashCurrency,
} from "../lib/system-currencies";

export type CashBalancesByPortfolio = Readonly<
  Record<string, Readonly<Record<CashCurrency, string>>>
>;

type SupabaseServerClient = ReturnType<typeof createClient>;

const buildEmptyBalances = () =>
  SUPPORTED_CASH_CURRENCIES.reduce(
    (acc, code) => {
      acc[code] = "0";
      return acc;
    },
    {} as Record<CashCurrency, string>
  );

export async function getCashBalancesByPortfolio(
  supabase: SupabaseServerClient,
  portfolioIds: readonly string[]
): Promise<CashBalancesByPortfolio> {
  // Server helper: fetch cash balances per portfolio in a single RPC call.
  const result: Record<string, Record<CashCurrency, string>> = {};
  const { data, error } = await supabase.rpc("get_cash_balances", {
    p_portfolio_ids: portfolioIds.length > 0 ? [...portfolioIds] : undefined,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Array<{
    portfolio_id: string;
    currency: string;
    quantity: string | number;
  }>;

  portfolioIds.forEach((portfolioId) => {
    result[portfolioId] = buildEmptyBalances();
  });

  rows.forEach((row) => {
    if (!isSupportedCashCurrency(row.currency)) return;
    if (!result[row.portfolio_id]) {
      result[row.portfolio_id] = buildEmptyBalances();
    }
    result[row.portfolio_id][row.currency] =
      typeof row.quantity === "number" ? row.quantity.toString() : row.quantity;
  });

  return result;
}
