import type { SupabaseClient } from "@supabase/supabase-js";

import { computePortfolioSnapshot } from "./compute-portfolio-snapshot";
import { upsertPortfolioSnapshot } from "./upsert-portfolio-snapshot";
import type { SnapshotScope } from "./types";

type PortfolioRow = Readonly<{ id: string }>;

type RunResult = Readonly<{
  processedPortfolios: number;
}>;

const toBucketDate = (value: Date) => value.toISOString().slice(0, 10);

const runSnapshot = async (
  supabase: SupabaseClient,
  userId: string,
  scope: SnapshotScope,
  portfolioId: string | null,
  bucketDate: string
) => {
  const result = await computePortfolioSnapshot(
    supabase,
    userId,
    scope,
    portfolioId,
    bucketDate
  );

  if (!result.hasHoldings || !result.hasAnyValue) {
    return;
  }

  await upsertPortfolioSnapshot(supabase, result.row);
};

export async function runDailySnapshotsForUser(
  supabase: SupabaseClient,
  userId: string,
  jobDate: Date
): Promise<RunResult> {
  // Admin-side batch: snapshot all active portfolios + ALL for a user.
  const bucketDate = toBucketDate(jobDate);
  const { data, error } = await supabase
    .from("portfolios")
    .select("id")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const portfolios = (data ?? []) as PortfolioRow[];

  for (const portfolio of portfolios) {
    await runSnapshot(supabase, userId, "PORTFOLIO", portfolio.id, bucketDate);
  }

  await runSnapshot(supabase, userId, "ALL", null, bucketDate);

  return { processedPortfolios: portfolios.length };
}
