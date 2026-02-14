import type { createClient } from "@/lib/supabase/server";

import type { StockTradeMarker } from "./types";

type SupabaseServerClient = ReturnType<typeof createClient>;

type TradeMarkerRow = Readonly<{
  id: string;
  trade_date: string;
  side: "BUY" | "SELL";
  price: string | number;
  quantity: string | number;
  portfolio_id: string;
  portfolio:
    | Readonly<{
        name: string;
      }>
    | Readonly<{
        name: string;
      }>[]
    | null;
  instrument:
    | Readonly<{
        provider_key: string;
      }>
    | Readonly<{
        provider_key: string;
      }>[]
    | null;
}>;

const asNumber = (value: string | number) =>
  typeof value === "number" ? value : Number.parseFloat(value);

export async function listStockTradeMarkers(
  supabase: SupabaseServerClient,
  providerKey: string
): Promise<readonly StockTradeMarker[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id,trade_date,side,price,quantity,portfolio_id,portfolio:portfolios(name),instrument:instruments!inner(provider_key)"
    )
    .eq("leg_role", "ASSET")
    .eq("instrument.provider_key", providerKey)
    .order("trade_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as TradeMarkerRow[];
  return rows
    .map((row) => {
      const portfolio = Array.isArray(row.portfolio)
        ? row.portfolio[0] ?? null
        : row.portfolio;

      const price = asNumber(row.price);
      const quantity = asNumber(row.quantity);

      if (!Number.isFinite(price) || !Number.isFinite(quantity)) {
        return null;
      }

      return {
        id: row.id,
        tradeDate: row.trade_date,
        side: row.side,
        price,
        quantity,
        portfolioId: row.portfolio_id,
        portfolioName: portfolio?.name ?? "Portfel",
      } satisfies StockTradeMarker;
    })
    .filter((row): row is StockTradeMarker => row !== null);
}
