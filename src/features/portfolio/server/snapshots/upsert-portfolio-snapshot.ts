import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import type { SnapshotRowInsert } from "./types";

const buildMatchFilter = (row: SnapshotRowInsert) => {
  if (row.scope === "ALL") {
    return { user_id: row.user_id, scope: row.scope, bucket_date: row.bucket_date };
  }

  return {
    user_id: row.user_id,
    scope: row.scope,
    bucket_date: row.bucket_date,
    portfolio_id: row.portfolio_id,
  };
};

const isUniqueViolation = (error: PostgrestError) => error.code === "23505";

export async function upsertPortfolioSnapshot(
  supabase: SupabaseClient,
  row: SnapshotRowInsert
): Promise<void> {
  // Admin-side write: emulate upsert to support partial unique indexes.
  const match = buildMatchFilter(row);

  const { data, error } = await supabase
    .from("portfolio_snapshots")
    .select("id")
    .match(match)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data?.id) {
    const { error: updateError } = await supabase
      .from("portfolio_snapshots")
      .update(row)
      .match({ id: data.id });

    if (updateError) {
      throw new Error(updateError.message);
    }
    return;
  }

  const { error: insertError } = await supabase
    .from("portfolio_snapshots")
    .insert(row);

  if (!insertError) {
    return;
  }

  if (!isUniqueViolation(insertError)) {
    throw new Error(insertError.message);
  }

  const { data: existing, error: retrySelectError } = await supabase
    .from("portfolio_snapshots")
    .select("id")
    .match(match)
    .maybeSingle();

  if (retrySelectError) {
    throw new Error(retrySelectError.message);
  }

  if (!existing?.id) {
    throw new Error("Snapshot insert failed without a retrievable row.");
  }

  const { error: retryUpdateError } = await supabase
    .from("portfolio_snapshots")
    .update(row)
    .match({ id: existing.id });

  if (retryUpdateError) {
    throw new Error(retryUpdateError.message);
  }
}
