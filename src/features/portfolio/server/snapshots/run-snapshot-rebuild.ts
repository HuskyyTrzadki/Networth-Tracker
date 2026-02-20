import type { SupabaseClient } from "@supabase/supabase-js";

import { getBucketDate } from "./bucket-date";
import { resolveChunkToDate } from "./rebuild-chunk-window";
import {
  getSnapshotRebuildState,
  type SnapshotRebuildState,
  updateSnapshotRebuildState,
} from "./rebuild-state";
import { createSnapshotRebuildRangeSession } from "./snapshot-rebuild-range-session";
import type { SnapshotRowInsert, SnapshotScope } from "./types";
import { roundSnapshotRowForStorage } from "./snapshot-row-storage-rounding";

type RunInput = Readonly<{
  userId: string;
  scope: SnapshotScope;
  portfolioId: string | null;
  maxDaysPerRun: number;
  timeBudgetMs: number;
}>;

export type SnapshotRebuildRunResult = Readonly<{
  state: SnapshotRebuildState | null;
  processedDays: number;
}>;

const RUNNING_STALE_AFTER_MS = 90_000;

const isRunningStale = (updatedAt: string) => {
  const updatedAtMs = Date.parse(updatedAt);
  if (!Number.isFinite(updatedAtMs)) {
    return true;
  }

  return Date.now() - updatedAtMs > RUNNING_STALE_AFTER_MS;
};

const minIsoDate = (left: string, right: string) =>
  left.localeCompare(right) <= 0 ? left : right;

const resolveMergedProgress = (
  currentDirtyFrom: string,
  nextDirtyFromFromChunk: string | null,
  fromDate: string,
  toDate: string,
  lastProcessed: string,
  latestState: SnapshotRebuildState | null
) => {
  const latestDirtyFrom = latestState?.dirtyFrom ?? null;
  const hasConcurrentDirtyUpdate =
    Boolean(latestDirtyFrom) && latestDirtyFrom !== currentDirtyFrom;

  const mergedDirtyFrom = (() => {
    if (nextDirtyFromFromChunk === null) {
      return hasConcurrentDirtyUpdate ? latestDirtyFrom : null;
    }

    if (!hasConcurrentDirtyUpdate || !latestDirtyFrom) {
      return nextDirtyFromFromChunk;
    }

    return minIsoDate(nextDirtyFromFromChunk, latestDirtyFrom);
  })();

  if (mergedDirtyFrom === null) {
    return {
      dirtyFrom: null,
      fromDate: null,
      toDate: null,
      processedUntil: null,
      status: "idle" as const,
    };
  }

  const mergedFromDate = hasConcurrentDirtyUpdate
    ? latestState?.fromDate
      ? minIsoDate(latestState.fromDate, mergedDirtyFrom)
      : mergedDirtyFrom
    : minIsoDate(fromDate, mergedDirtyFrom);

  const mergedToDate = hasConcurrentDirtyUpdate
    ? latestState?.toDate ?? toDate
    : toDate;

  const mergedProcessedUntil =
    nextDirtyFromFromChunk !== null && mergedDirtyFrom === nextDirtyFromFromChunk
      ? lastProcessed
      : null;

  return {
    dirtyFrom: mergedDirtyFrom,
    fromDate: mergedFromDate,
    toDate: mergedToDate,
    processedUntil: mergedProcessedUntil,
    status: "queued" as const,
  };
};

const replaceSnapshotChunk = async (
  supabase: SupabaseClient,
  userId: string,
  scope: SnapshotScope,
  portfolioId: string | null,
  fromDate: string,
  toDate: string,
  rows: readonly SnapshotRowInsert[]
) => {
  // Chunk rewrite: clear target days once, then insert fresh rows for deterministic rebuild.
  let query = supabase
    .from("portfolio_snapshots")
    .delete()
    .eq("user_id", userId)
    .eq("scope", scope)
    .gte("bucket_date", fromDate)
    .lte("bucket_date", toDate);

  if (scope === "ALL") {
    query = query.is("portfolio_id", null);
  } else {
    query = query.eq("portfolio_id", portfolioId);
  }

  const { error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  if (rows.length === 0) {
    return;
  }

  const roundedRows = rows.map(roundSnapshotRowForStorage);

  const { error: insertError } = await supabase
    .from("portfolio_snapshots")
    .insert(roundedRows);

  if (insertError) {
    throw new Error(insertError.message);
  }
};

const markFailed = async (
  supabase: SupabaseClient,
  state: SnapshotRebuildState,
  error: unknown
) => {
  const message = error instanceof Error ? error.message : "Snapshot rebuild failed.";
  await updateSnapshotRebuildState(supabase, {
    id: state.id,
    status: "failed",
    dirtyFrom: state.dirtyFrom,
    fromDate: state.fromDate,
    toDate: state.toDate,
    processedUntil: state.processedUntil,
    message,
  });
};

export async function runSnapshotRebuild(
  supabase: SupabaseClient,
  input: RunInput
): Promise<SnapshotRebuildRunResult> {
  // Backend worker: rebuild dirty range in deterministic chunks until time budget is consumed.
  const state = await getSnapshotRebuildState(
    supabase,
    input.userId,
    input.scope,
    input.portfolioId
  );

  if (!state || !state.dirtyFrom) {
    return { state, processedDays: 0 };
  }

  if (state.status === "running" && !isRunningStale(state.updatedAt)) {
    return { state, processedDays: 0 };
  }

  const todayBucketDate = getBucketDate(new Date());
  const fromDate = state.fromDate ?? state.dirtyFrom;
  const toDate =
    state.toDate && state.toDate > todayBucketDate ? state.toDate : todayBucketDate;

  await updateSnapshotRebuildState(supabase, {
    id: state.id,
    status: "running",
    dirtyFrom: state.dirtyFrom,
    fromDate,
    toDate,
    processedUntil: state.processedUntil,
    message: null,
  });
  const runDeadline = Date.now() + Math.max(1, Math.floor(input.timeBudgetMs));
  let processedDaysTotal = 0;
  let latestRunState: SnapshotRebuildState | null = {
    ...state,
    status: "running",
    fromDate,
    toDate,
  };
  const rebuildSession = await createSnapshotRebuildRangeSession(
    supabase,
    input.userId,
    input.scope,
    input.portfolioId,
    state.dirtyFrom,
    toDate
  );

  try {
    while (
      latestRunState?.dirtyFrom &&
      latestRunState.dirtyFrom <= toDate &&
      (processedDaysTotal === 0 || Date.now() < runDeadline)
    ) {
      const chunkFromDate = latestRunState.dirtyFrom;
      const sessionNextDirtyFrom = rebuildSession.getNextDirtyFrom();
      if (!sessionNextDirtyFrom || sessionNextDirtyFrom !== chunkFromDate) {
        // Session inputs are stale (concurrent dirty update); stop and let next run rebuild from new state.
        break;
      }

      const chunk = rebuildSession.processNextChunk(input.maxDaysPerRun);
      if (!chunk) {
        break;
      }

      const rowsToInsert = chunk.dayResults
        .map((dayResult) => dayResult.row)
        .filter((row): row is NonNullable<typeof row> => Boolean(row));

      await replaceSnapshotChunk(
        supabase,
        input.userId,
        input.scope,
        input.portfolioId,
        chunk.chunkFromDate,
        chunk.chunkToDate,
        rowsToInsert
      );

      processedDaysTotal += chunk.processedDays;

      const latestState = await getSnapshotRebuildState(
        supabase,
        input.userId,
        input.scope,
        input.portfolioId
      );

      const mergedProgress = resolveMergedProgress(
        chunkFromDate,
        chunk.nextDirtyFrom,
        fromDate,
        toDate,
        chunk.lastProcessed,
        latestState
      );

      await updateSnapshotRebuildState(supabase, {
        id: state.id,
        status: mergedProgress.status,
        dirtyFrom: mergedProgress.dirtyFrom,
        fromDate: mergedProgress.fromDate,
        toDate: mergedProgress.toDate,
        processedUntil: mergedProgress.processedUntil,
        message: null,
      });

      latestRunState = await getSnapshotRebuildState(
        supabase,
        input.userId,
        input.scope,
        input.portfolioId
      );

      const expectedNextDirtyFrom = rebuildSession.getNextDirtyFrom();
      if ((latestRunState?.dirtyFrom ?? null) !== expectedNextDirtyFrom) {
        // State moved differently than this session expected (usually concurrent write); continue in next request.
        break;
      }
    }

    return {
      state: latestRunState,
      processedDays: processedDaysTotal,
    };
  } catch (error) {
    await markFailed(
      supabase,
      {
        ...state,
        fromDate,
        toDate,
      },
      error
    );
    throw error;
  }
}

export const __test__ = {
  resolveChunkToDate,
  resolveMergedProgress,
};
