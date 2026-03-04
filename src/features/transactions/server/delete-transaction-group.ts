import type { SupabaseClient } from "@supabase/supabase-js";

import { getBucketDate } from "@/features/portfolio/server/snapshots/bucket-date";
import { markSnapshotRebuildDirty } from "@/features/portfolio/server/snapshots/rebuild-state";
import { internalServerError, notFoundError } from "@/lib/http/app-error";

type SupabaseServerClient = SupabaseClient;

type DeleteTransactionGroupResult = Readonly<{
  deletedCount: number;
  portfolioId: string;
  tradeDate: string;
}>;

const shouldMarkSnapshotHistoryDirty = (tradeDate: string, todayBucket: string) =>
  tradeDate <= todayBucket;

const markSnapshotDirtyAfterDelete = async (
  supabaseAdmin: SupabaseServerClient,
  userId: string,
  portfolioId: string,
  tradeDate: string
) => {
  const todayBucket = getBucketDate(new Date());
  if (!shouldMarkSnapshotHistoryDirty(tradeDate, todayBucket)) {
    return;
  }

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

type TransactionIdentityRow = Readonly<{
  group_id: string;
  portfolio_id: string;
  trade_date: string;
}>;

export async function deleteTransactionGroupByTransactionId(
  supabaseUser: SupabaseServerClient,
  supabaseAdmin: SupabaseServerClient,
  userId: string,
  transactionId: string
): Promise<DeleteTransactionGroupResult> {
  const { data: transactionRow, error: transactionError } = await supabaseUser
    .from("transactions")
    .select("group_id, portfolio_id, trade_date")
    .eq("id", transactionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (transactionError) {
    throw internalServerError("Failed to load transaction group.", {
      code: "TRANSACTION_GROUP_LOOKUP_FAILED",
      cause: transactionError,
    });
  }

  if (!transactionRow) {
    throw notFoundError("Transakcja nie istnieje albo nie masz do niej dostępu.", {
      code: "TRANSACTION_NOT_FOUND",
    });
  }

  const identity = transactionRow as TransactionIdentityRow;

  const { count, error: deleteError } = await supabaseUser
    .from("transactions")
    .delete({ count: "exact" })
    .eq("user_id", userId)
    .eq("group_id", identity.group_id);

  if (deleteError) {
    throw internalServerError("Failed to delete transaction group.", {
      code: "TRANSACTION_DELETE_FAILED",
      cause: deleteError,
    });
  }

  await markSnapshotDirtyAfterDelete(
    supabaseAdmin,
    userId,
    identity.portfolio_id,
    identity.trade_date
  ).catch(() => undefined);

  return {
    deletedCount: count ?? 0,
    portfolioId: identity.portfolio_id,
    tradeDate: identity.trade_date,
  };
}
