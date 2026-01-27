import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = ReturnType<typeof createClient>;

const DEFAULT_PORTFOLIO_NAME = "Główny";
const DEFAULT_BASE_CURRENCY = "PLN";

type PortfolioRow = Readonly<{ id: string }>;

export async function ensureDefaultPortfolioExists(
  supabase: SupabaseServerClient,
  userId: string
): Promise<string> {
  // Auth flow helper: guarantee every user has at least one portfolio.
  const { data: existing, error: existingError } = await supabase
    .from("portfolios")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    return (existing as PortfolioRow).id;
  }

  const { data: created, error: createdError } = await supabase
    .from("portfolios")
    .upsert(
      {
        user_id: userId,
        name: DEFAULT_PORTFOLIO_NAME,
        base_currency: DEFAULT_BASE_CURRENCY,
      },
      { onConflict: "user_id,name" }
    )
    .select("id")
    .single();

  if (createdError || !created) {
    throw new Error(createdError?.message ?? "Nie udało się utworzyć portfela.");
  }

  return (created as PortfolioRow).id;
}

export async function getDefaultPortfolioId(
  supabase: SupabaseServerClient,
  userId: string
): Promise<string> {
  // UI/server helper: assume portfolio exists (created during auth).
  const { data, error } = await supabase
    .from("portfolios")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Brak portfela dla użytkownika.");
  }

  return (data as PortfolioRow).id;
}
