import type { SupabaseClient } from "@supabase/supabase-js";

type SupabaseServerClient = SupabaseClient;

type OwnedPortfolioRow = Readonly<{
  id: string;
  name: string;
}>;

export type DeletePortfolioResult = Readonly<{
  portfolioId: string;
  deletedTransactionsCount: number;
}>;

export async function deletePortfolioById(
  supabaseUser: SupabaseServerClient,
  supabaseAdmin: SupabaseServerClient,
  userId: string,
  portfolioId: string
): Promise<DeletePortfolioResult> {
  const { data: portfolioRow, error: portfolioError } = await supabaseUser
    .from("portfolios")
    .select("id, name")
    .match({ id: portfolioId, user_id: userId })
    .is("archived_at", null)
    .maybeSingle();

  if (portfolioError) {
    throw new Error(portfolioError.message);
  }

  if (!portfolioRow) {
    throw new Error("Portfel nie istnieje albo nie masz do niego dostępu.");
  }

  const portfolio = portfolioRow as OwnedPortfolioRow;

  const { count: deletedTransactionsCount, error: transactionsDeleteError } =
    await supabaseAdmin
      .from("transactions")
      .delete({ count: "exact" })
      .match({ user_id: userId, portfolio_id: portfolio.id });

  if (transactionsDeleteError) {
    throw new Error(transactionsDeleteError.message);
  }

  const { count: deletedPortfolioCount, error: deletePortfolioError } =
    await supabaseAdmin
      .from("portfolios")
      .delete({ count: "exact" })
      .match({ id: portfolio.id, user_id: userId })
      .is("archived_at", null);

  if (deletePortfolioError) {
    throw new Error(deletePortfolioError.message);
  }

  if (!deletedPortfolioCount) {
    throw new Error("Portfel nie istnieje albo został już usunięty.");
  }

  return {
    portfolioId: portfolio.id,
    deletedTransactionsCount: deletedTransactionsCount ?? 0,
  };
}
