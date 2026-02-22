import type { createClient } from "@/lib/supabase/server";

export type PortfolioSummary = Readonly<{
  id: string;
  name: string;
  baseCurrency: string;
  isTaxAdvantaged: boolean;
  createdAt: string;
}>;

type SupabaseServerClient = ReturnType<typeof createClient>;

type PortfolioRow = Readonly<{
  id: string;
  name: string;
  base_currency: string;
  is_tax_advantaged: boolean;
  created_at: string;
}>;

export async function listPortfolios(
  supabase: SupabaseServerClient
): Promise<readonly PortfolioSummary[]> {
  // Server helper: list active portfolios (RLS enforces ownership).
  const { data, error } = await supabase
    .from("portfolios")
    .select("id, name, base_currency, is_tax_advantaged, created_at")
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as PortfolioRow[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    baseCurrency: row.base_currency,
    isTaxAdvantaged: row.is_tax_advantaged,
    createdAt: row.created_at,
  }));
}
