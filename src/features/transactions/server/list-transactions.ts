import type { createClient } from "@/lib/supabase/server";

import type { TransactionsFilters, TransactionSide } from "./filters";

type SupabaseServerClient = ReturnType<typeof createClient>;

type TransactionRow = Readonly<{
  id: string;
  trade_date: string;
  side: TransactionSide;
  quantity: string | number;
  price: string | number;
  fee: string | number | null;
  instrument:
    | Readonly<{
        symbol: string;
        name: string;
        currency: string;
        region: string | null;
        logo_url: string | null;
      }>
    | Readonly<{
        symbol: string;
        name: string;
        currency: string;
        region: string | null;
        logo_url: string | null;
      }>[]
    | null;
}>;

export type TransactionListItem = Readonly<{
  id: string;
  tradeDate: string;
  side: TransactionSide;
  quantity: string;
  price: string;
  fee: string;
  instrument: Readonly<{
    symbol: string;
    name: string;
    currency: string;
    region?: string;
    logoUrl?: string | null;
  }>;
}>;

export type TransactionsPage = Readonly<{
  items: readonly TransactionListItem[];
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}>;

const sanitizeSearchQuery = (query: string) => query.replace(/,/g, " ").trim();
const normalizeNumeric = (value: string | number | null | undefined) => {
  // Supabase numeric can arrive as string or number depending on runtime config.
  if (value === null || value === undefined) return "0";
  return typeof value === "number" ? value.toString() : value;
};

export async function listTransactions(
  supabase: SupabaseServerClient,
  userId: string,
  filters: TransactionsFilters
): Promise<TransactionsPage> {
  const offset = (filters.page - 1) * filters.pageSize;
  const rangeEnd = offset + filters.pageSize;
  const ascending = filters.sort === "date_asc";

  // Query only the current user data, with an inner join on instruments for filtering.
  let query = supabase
    .from("transactions")
    .select(
      "id, trade_date, side, quantity, price, fee, instrument:instruments!inner(symbol, name, currency, region, logo_url)"
    )
    .eq("user_id", userId)
    .order("trade_date", { ascending })
    .order("created_at", { ascending })
    // Fetch one extra row to detect if another page exists.
    .range(offset, rangeEnd);

  if (filters.type) {
    query = query.eq("side", filters.type);
  }

  if (filters.query) {
    const search = sanitizeSearchQuery(filters.query);

    if (search.length > 0) {
      query = query.or(
        `symbol.ilike.%${search}%,name.ilike.%${search}%`,
        { foreignTable: "instruments" }
      );
    }
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as TransactionRow[];
  const hasNextPage = rows.length > filters.pageSize;
  const trimmedRows = rows.slice(0, filters.pageSize);

  return {
    items: trimmedRows.map((row) => {
      const instrument = Array.isArray(row.instrument)
        ? row.instrument[0] ?? null
        : row.instrument;

      if (!instrument) {
        throw new Error("Missing instrument data for transaction row.");
      }

      return {
        id: row.id,
        tradeDate: row.trade_date,
        side: row.side,
        quantity: normalizeNumeric(row.quantity),
        price: normalizeNumeric(row.price),
        fee: normalizeNumeric(row.fee),
        instrument: {
          symbol: instrument.symbol,
          name: instrument.name,
          currency: instrument.currency,
          region: instrument.region ?? undefined,
          logoUrl: instrument.logo_url ?? null,
        },
      };
    }),
    page: filters.page,
    pageSize: filters.pageSize,
    hasNextPage,
  };
}
