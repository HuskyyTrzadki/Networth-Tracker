import { createAdminClient } from "@/lib/supabase/admin";

export async function listDemoPortfolioIds(
  portfolioIds: readonly string[]
): Promise<ReadonlySet<string>> {
  if (portfolioIds.length === 0) {
    return new Set();
  }

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("demo_bundle_instance_portfolios")
    .select("portfolio_id")
    .in("portfolio_id", portfolioIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Set((data ?? []).map((row) => row.portfolio_id));
}
