import type { createClient } from "@/lib/supabase/server";

import { getDefaultPortfolioId } from "@/features/portfolio/server/default-portfolio";

type SupabaseServerClient = ReturnType<typeof createClient>;
type SearchParams = Readonly<Record<string, string | string[] | undefined>>;

const getFirstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const parsePortfolioParam = (searchParams: SearchParams) => {
  const raw = getFirstParam(searchParams.portfolio)?.trim();
  if (!raw || raw === "all") return null;
  return raw;
};

export async function resolvePortfolioId({
  searchParams,
  supabase,
  userId,
}: Readonly<{
  searchParams: SearchParams;
  supabase: SupabaseServerClient;
  userId: string;
}>): Promise<string> {
  // Server helper: use explicit ?portfolio=..., fall back to default when missing.
  const selected = parsePortfolioParam(searchParams);
  if (selected) return selected;

  return getDefaultPortfolioId(supabase, userId);
}
