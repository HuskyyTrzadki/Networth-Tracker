import type { SupabaseClient } from "@supabase/supabase-js";

import { getSnapshotRebuildState } from "@/features/portfolio/server/snapshots/rebuild-state";
import { runSnapshotRebuild } from "@/features/portfolio/server/snapshots/run-snapshot-rebuild";
import type { Database } from "@/lib/supabase/database.types";

type SupabaseTypedClient = SupabaseClient<Database>;

const REBUILD_ITERATIONS = 4;
const REBUILD_MAX_DAYS_PER_RUN = 365;
const REBUILD_TIME_BUDGET_MS = 8_000;

async function drainScope(
  supabaseAdmin: SupabaseTypedClient,
  userId: string,
  scope: "PORTFOLIO" | "ALL",
  portfolioId: string | null
) {
  for (let attempt = 0; attempt < REBUILD_ITERATIONS; attempt += 1) {
    const result = await runSnapshotRebuild(supabaseAdmin, {
      userId,
      scope,
      portfolioId,
      maxDaysPerRun: REBUILD_MAX_DAYS_PER_RUN,
      timeBudgetMs: REBUILD_TIME_BUDGET_MS,
    });

    if (!result.state?.dirtyFrom) {
      return;
    }

    if (result.processedDays === 0) {
      const latestState = await getSnapshotRebuildState(
        supabaseAdmin,
        userId,
        scope,
        portfolioId
      );

      if (!latestState?.dirtyFrom || latestState.status === "failed") {
        return;
      }
    }
  }
}

export async function rebuildDemoSnapshots(
  supabaseAdmin: SupabaseTypedClient,
  userId: string,
  portfolioIds: readonly string[]
) {
  await Promise.all([
    ...portfolioIds.map((portfolioId) =>
      drainScope(supabaseAdmin, userId, "PORTFOLIO", portfolioId)
    ),
    drainScope(supabaseAdmin, userId, "ALL", null),
  ]);
}
