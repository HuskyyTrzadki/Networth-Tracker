import { touchProfileLastActive } from "@/features/auth/server/profiles";
import { getBucketDate } from "@/features/portfolio/server/snapshots/bucket-date";
import { markSnapshotRebuildDirty } from "@/features/portfolio/server/snapshots/rebuild-state";

type SupabaseServerClient = import("./create-transaction-context").SupabaseServerClient;
type TransactionRow = import("./create-transaction-context").TransactionRow;

export type PersistedAssetRow = Readonly<{
  id: string;
  instrument_id: string;
}>;

type InsertedTransactionRow = Readonly<{
  id: string;
  instrument_id: string;
  leg_key: TransactionRow["leg_key"];
}>;

export const shouldMarkSnapshotHistoryDirty = (
  tradeDate: string,
  todayBucket: string
) => tradeDate <= todayBucket;

const markSnapshotDirtyAfterTransaction = async (
  supabaseAdmin: SupabaseServerClient,
  userId: string,
  portfolioId: string,
  tradeDate: string
) => {
  // Unified rule: every write dated today or earlier is rebuilt through
  // the dirty-range pipeline so UI state/progress is consistent.
  const todayBucket = getBucketDate(new Date());
  if (!shouldMarkSnapshotHistoryDirty(tradeDate, todayBucket)) {
    return;
  }

  // For today, dirty_from = today, so the queued rebuild is a one-day range.
  await Promise.all([
    markSnapshotRebuildDirty(supabaseAdmin, {
      userId,
      portfolioId,
      scope: "PORTFOLIO",
      dirtyFrom: tradeDate,
    }),
    markSnapshotRebuildDirty(supabaseAdmin, {
      userId,
      portfolioId: null,
      scope: "ALL",
      dirtyFrom: tradeDate,
    }),
  ]);
};

const findAssetLegRow = (rows: readonly InsertedTransactionRow[]) => {
  const assetRow = rows.find((row) => row.leg_key === "ASSET");
  if (!assetRow) {
    throw new Error("Brak głównego lega transakcji po zapisie.");
  }

  return {
    id: assetRow.id,
    instrument_id: assetRow.instrument_id,
  } as PersistedAssetRow;
};

const findExistingAssetLegForDuplicate = async (input: Readonly<{
  supabaseUser: SupabaseServerClient;
  userId: string;
  clientRequestId: string;
}>): Promise<PersistedAssetRow> => {
  const { data, error } = await input.supabaseUser
    .from("transactions")
    .select("id, instrument_id")
    .eq("user_id", input.userId)
    .eq("client_request_id", input.clientRequestId)
    .eq("leg_key", "ASSET")
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Missing transaction after duplicate insert.");
  }

  return data;
};

export const insertTransactionRows = async (input: Readonly<{
  supabaseUser: SupabaseServerClient;
  rows: readonly TransactionRow[];
  userId: string;
  clientRequestId: string;
}>): Promise<Readonly<{ assetRow: PersistedAssetRow; deduped: boolean }>> => {
  const { data, error } = await input.supabaseUser
    .from("transactions")
    .insert(input.rows)
    .select("id, instrument_id, leg_key");

  if (!error) {
    const insertedRows = (data ?? []) as InsertedTransactionRow[];
    return {
      assetRow: findAssetLegRow(insertedRows),
      deduped: false,
    };
  }

  if (error.code !== "23505") {
    throw new Error(error.message);
  }

  return {
    assetRow: await findExistingAssetLegForDuplicate({
      supabaseUser: input.supabaseUser,
      userId: input.userId,
      clientRequestId: input.clientRequestId,
    }),
    deduped: true,
  };
};

export const runPostWriteSideEffects = async (input: Readonly<{
  supabaseUser: SupabaseServerClient;
  supabaseAdmin: SupabaseServerClient;
  userId: string;
  portfolioId: string;
  tradeDate: string;
}>) => {
  // Best-effort side-effects; they should not block transaction commit response.
  await Promise.all([
    touchProfileLastActive(input.supabaseUser, input.userId).catch(() => undefined),
    markSnapshotDirtyAfterTransaction(
      input.supabaseAdmin,
      input.userId,
      input.portfolioId,
      input.tradeDate
    ).catch(() => undefined),
  ]);
};
