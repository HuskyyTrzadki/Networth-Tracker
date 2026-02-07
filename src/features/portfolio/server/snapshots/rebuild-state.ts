import type { SupabaseClient } from "@supabase/supabase-js";

import { getBucketDate } from "./bucket-date";
import type { SnapshotScope } from "./types";

export type SnapshotRebuildStatus = "idle" | "queued" | "running" | "failed";

export type SnapshotRebuildState = Readonly<{
  id: string;
  userId: string;
  scope: SnapshotScope;
  portfolioId: string | null;
  dirtyFrom: string | null;
  fromDate: string | null;
  toDate: string | null;
  processedUntil: string | null;
  status: SnapshotRebuildStatus;
  message: string | null;
  updatedAt: string;
}>;

type SnapshotRebuildRow = Readonly<{
  id: string;
  user_id: string;
  scope: SnapshotScope;
  portfolio_id: string | null;
  dirty_from: string | null;
  from_date: string | null;
  to_date: string | null;
  processed_until: string | null;
  status: SnapshotRebuildStatus;
  message: string | null;
  updated_at: string;
}>;

const mapRow = (row: SnapshotRebuildRow): SnapshotRebuildState => ({
  id: row.id,
  userId: row.user_id,
  scope: row.scope,
  portfolioId: row.portfolio_id,
  dirtyFrom: row.dirty_from,
  fromDate: row.from_date,
  toDate: row.to_date,
  processedUntil: row.processed_until,
  status: row.status,
  message: row.message,
  updatedAt: row.updated_at,
});

const isEarlierDate = (left: string, right: string) => left.localeCompare(right) < 0;

const buildMatch = (
  userId: string,
  scope: SnapshotScope,
  portfolioId: string | null
) => {
  if (scope === "ALL") {
    return { user_id: userId, scope, portfolio_id: null };
  }

  if (!portfolioId) {
    throw new Error("Missing portfolioId for PORTFOLIO scope.");
  }

  return { user_id: userId, scope, portfolio_id: portfolioId };
};

const selectState = async (
  supabase: SupabaseClient,
  userId: string,
  scope: SnapshotScope,
  portfolioId: string | null
) => {
  let query = supabase
    .from("portfolio_snapshot_rebuild_state")
    .select(
      "id,user_id,scope,portfolio_id,dirty_from,from_date,to_date,processed_until,status,message,updated_at"
    )
    .eq("user_id", userId)
    .eq("scope", scope)
    .limit(1);

  if (scope === "ALL") {
    query = query.is("portfolio_id", null);
  } else {
    query = query.eq("portfolio_id", portfolioId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new Error(error.message);
  }

  return (data as SnapshotRebuildRow | null) ?? null;
};

export async function getSnapshotRebuildState(
  supabase: SupabaseClient,
  userId: string,
  scope: SnapshotScope,
  portfolioId: string | null
): Promise<SnapshotRebuildState | null> {
  const row = await selectState(supabase, userId, scope, portfolioId);
  return row ? mapRow(row) : null;
}

export async function markSnapshotRebuildDirty(
  supabase: SupabaseClient,
  input: Readonly<{
    userId: string;
    scope: SnapshotScope;
    portfolioId: string | null;
    dirtyFrom: string;
  }>
): Promise<void> {
  // Backend state merge: keep the earliest dirty date so rebuilds are deterministic.
  const existing = await selectState(
    supabase,
    input.userId,
    input.scope,
    input.portfolioId
  );

  const now = new Date().toISOString();
  const todayBucketDate = getBucketDate(new Date());
  if (!existing) {
    const { error } = await supabase
      .from("portfolio_snapshot_rebuild_state")
      .insert({
        ...buildMatch(input.userId, input.scope, input.portfolioId),
        dirty_from: input.dirtyFrom,
        from_date: input.dirtyFrom,
        to_date: todayBucketDate,
        processed_until: null,
        status: "queued",
        message: null,
        updated_at: now,
      });

    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const mergedDirtyFrom = existing.dirty_from
    ? isEarlierDate(input.dirtyFrom, existing.dirty_from)
      ? input.dirtyFrom
      : existing.dirty_from
    : input.dirtyFrom;

  const nextStatus: SnapshotRebuildStatus =
    existing.status === "running" ? "running" : "queued";
  const mergedFromDate = existing.from_date
    ? isEarlierDate(mergedDirtyFrom, existing.from_date)
      ? mergedDirtyFrom
      : existing.from_date
    : mergedDirtyFrom;
  const mergedToDate = existing.to_date
    ? isEarlierDate(existing.to_date, todayBucketDate)
      ? todayBucketDate
      : existing.to_date
    : todayBucketDate;

  const { error } = await supabase
    .from("portfolio_snapshot_rebuild_state")
    .update({
      dirty_from: mergedDirtyFrom,
      from_date: mergedFromDate,
      to_date: mergedToDate,
      processed_until: null,
      status: nextStatus,
      message: null,
      updated_at: now,
    })
    .eq("id", existing.id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateSnapshotRebuildState(
  supabase: SupabaseClient,
  input: Readonly<{
    id: string;
    status: SnapshotRebuildStatus;
    dirtyFrom: string | null;
    fromDate?: string | null;
    toDate?: string | null;
    processedUntil?: string | null;
    message: string | null;
  }>
): Promise<void> {
  const updatePayload: Record<string, string | null> = {
    status: input.status,
    dirty_from: input.dirtyFrom,
    message: input.message,
    updated_at: new Date().toISOString(),
  };

  if ("fromDate" in input) {
    updatePayload.from_date = input.fromDate ?? null;
  }

  if ("toDate" in input) {
    updatePayload.to_date = input.toDate ?? null;
  }

  if ("processedUntil" in input) {
    updatePayload.processed_until = input.processedUntil ?? null;
  }

  const { error } = await supabase
    .from("portfolio_snapshot_rebuild_state")
    .update(updatePayload)
    .eq("id", input.id);

  if (error) {
    throw new Error(error.message);
  }
}
