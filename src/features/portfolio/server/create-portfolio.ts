import type { PostgrestError } from "@supabase/supabase-js";

import type { createClient } from "@/lib/supabase/server";

import type { CreatePortfolioInput } from "../lib/create-portfolio-schema";

type SupabaseServerClient = ReturnType<typeof createClient>;

type PortfolioRow = Readonly<{
  id: string;
  name: string;
  base_currency: string;
}>;

export type CreatePortfolioResult = Readonly<{
  id: string;
  name: string;
  baseCurrency: string;
}>;

const getErrorMessage = (error: PostgrestError | null) => {
  // Postgres code 23505 = unique_violation (np. duplikat nazwy portfela).
  if (error?.code === "23505") {
    return "Masz już portfel o takiej nazwie.";
  }

  if (error?.message) {
    return error.message;
  }

  return "Nie udało się utworzyć portfela.";
};

export async function createPortfolioStrict(
  supabase: SupabaseServerClient,
  userId: string,
  input: CreatePortfolioInput
): Promise<CreatePortfolioResult> {
  // Server helper: create a portfolio for the authenticated user.
  const { data, error } = await supabase
    .from("portfolios")
    .insert({
      user_id: userId,
      name: input.name,
      base_currency: input.baseCurrency,
    })
    .select("id, name, base_currency")
    .single();

  if (error || !data) {
    throw new Error(getErrorMessage(error));
  }

  const row = data as PortfolioRow;

  return {
    id: row.id,
    name: row.name,
    baseCurrency: row.base_currency,
  };
}
