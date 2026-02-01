import type { SupabaseClient } from "@supabase/supabase-js";

import { computePortfolioSnapshot } from "./compute-portfolio-snapshot";
import { upsertPortfolioSnapshot } from "./upsert-portfolio-snapshot";
import type { SnapshotScope } from "./types";

type BootstrapResult = Readonly<{
  status: "ok" | "skipped";
  hasHoldings: boolean;
}>;

type PortfolioRow = Readonly<{ id: string }>;

const toBucketDate = (value: Date) => value.toISOString().slice(0, 10);

const ensurePortfolioAccess = async (
  supabase: SupabaseClient,
  portfolioId: string,
  userId: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .from("portfolios")
    .select("id")
    .eq("id", portfolioId)
    .eq("user_id", userId)
    .is("archived_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data as PortfolioRow | null);
};

export async function bootstrapPortfolioSnapshot(
  supabaseUser: SupabaseClient,
  supabaseAdmin: SupabaseClient,
  userId: string,
  scope: SnapshotScope,
  portfolioId: string | null
): Promise<BootstrapResult> {
  // Backend bootstrap: create today's snapshot once, then let the UI refetch.
  if (scope === "PORTFOLIO" && !portfolioId) {
    throw new Error("Missing portfolioId for PORTFOLIO scope.");
  }

  if (scope === "ALL" && portfolioId) {
    throw new Error("PortfolioId not allowed for ALL scope.");
  }

  if (scope === "PORTFOLIO" && portfolioId) {
    const hasAccess = await ensurePortfolioAccess(
      supabaseUser,
      portfolioId,
      userId
    );

    if (!hasAccess) {
      throw new Error("Portfolio not found.");
    }
  }

  const bucketDate = toBucketDate(new Date());
  const result = await computePortfolioSnapshot(
    supabaseAdmin,
    userId,
    scope,
    portfolioId,
    bucketDate
  );

  if (!result.hasHoldings || !result.hasAnyValue) {
    return { status: "skipped", hasHoldings: result.hasHoldings };
  }

  await upsertPortfolioSnapshot(supabaseAdmin, result.row);

  return { status: "ok", hasHoldings: result.hasHoldings };
}
