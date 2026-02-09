import type { createClient } from "@/lib/supabase/server";

import {
  computeAverageBuyPriceByInstrument,
  type AveragePriceTransaction,
} from "./average-buy-price";

type SupabaseServerClient = ReturnType<typeof createClient>;

type PortfolioRow = Readonly<{
  id: string;
}>;

type TransactionRow = Readonly<{
  instrument_id: string | null;
  side: "BUY" | "SELL";
  quantity: string | number;
  price: string | number;
}>;

const normalizeNumeric = (value: string | number) =>
  typeof value === "number" ? value.toString() : value;

export async function getPortfolioAverageBuyPrices(
  supabase: SupabaseServerClient,
  portfolioId: string | null
): Promise<ReadonlyMap<string, string>> {
  // Server helper: read active portfolios first, so aggregate mode ignores archived ones.
  const portfolioQuery = supabase
    .from("portfolios")
    .select("id")
    .is("archived_at", null);

  const { data: portfolios, error: portfolioError } = portfolioId
    ? await portfolioQuery.eq("id", portfolioId)
    : await portfolioQuery;

  if (portfolioError) throw new Error(portfolioError.message);

  const portfolioIds = ((portfolios ?? []) as PortfolioRow[]).map(
    (portfolio) => portfolio.id
  );

  if (portfolioIds.length === 0) {
    return new Map<string, string>();
  }

  // Server helper: load ordered ASSET legs to compute weighted-average buy cost.
  const { data, error } = await supabase
    .from("transactions")
    .select("instrument_id, side, quantity, price")
    .eq("leg_role", "ASSET")
    .in("portfolio_id", portfolioIds)
    .order("trade_date", { ascending: true })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as TransactionRow[];
  const transactions: AveragePriceTransaction[] = rows.flatMap((row) => {
    if (!row.instrument_id) return [];
    return [
      {
        instrumentId: row.instrument_id,
        side: row.side,
        quantity: normalizeNumeric(row.quantity),
        price: normalizeNumeric(row.price),
      },
    ];
  });

  return computeAverageBuyPriceByInstrument(transactions);
}
