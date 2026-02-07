import type { SupabaseClient } from "@supabase/supabase-js";

import type { SnapshotScope } from "./types";
import {
  createSnapshotRebuildRangeSession,
  type SnapshotRangeDayResult,
} from "./snapshot-rebuild-range-session";

const toIsoDayTimestamp = (value: string) => Date.parse(`${value}T00:00:00Z`);

const computeInclusiveDayCount = (fromDate: string, toDate: string) => {
  const fromMs = toIsoDayTimestamp(fromDate);
  const toMs = toIsoDayTimestamp(toDate);
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || fromMs > toMs) {
    return 1;
  }

  return Math.floor((toMs - fromMs) / 86_400_000) + 1;
};

export type { SnapshotRangeDayResult };

export async function computePortfolioSnapshotRange(
  supabase: SupabaseClient,
  userId: string,
  scope: SnapshotScope,
  portfolioId: string | null,
  fromDate: string,
  toDate: string
): Promise<readonly SnapshotRangeDayResult[]> {
  // Utility path: compute full range in one pass using the shared rebuild session engine.
  const session = await createSnapshotRebuildRangeSession(
    supabase,
    userId,
    scope,
    portfolioId,
    fromDate,
    toDate
  );

  const dayResults: SnapshotRangeDayResult[] = [];
  const dayCount = computeInclusiveDayCount(fromDate, toDate);

  for (;;) {
    const chunk = session.processNextChunk(dayCount);
    if (!chunk) {
      return dayResults;
    }

    dayResults.push(...chunk.dayResults);
  }
}
