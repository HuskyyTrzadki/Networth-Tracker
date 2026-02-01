import type { SupabaseClient } from "@supabase/supabase-js";

import { runDailySnapshotsForUser } from "./run-daily-snapshots-for-user";
import { getOrCreateCronState, updateCronState } from "./cron-state";
import { getBucketDate } from "./bucket-date";

type ActiveUserRow = Readonly<{ user_id: string }>;

type CronRunResult = Readonly<{
  processedUsers: number;
  processedPortfolios: number;
  done: boolean;
}>;

type CronRunOptions = Readonly<{
  limit: number;
  timeBudgetMs: number;
  retentionDays: number;
}>;

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

const listActiveUsers = async (
  supabase: SupabaseClient,
  cursorUserId: string | null,
  limit: number
): Promise<readonly ActiveUserRow[]> => {
  const cutoff = new Date(Date.now() - SIXTY_DAYS_MS).toISOString();

  let query = supabase
    .from("profiles")
    .select("user_id")
    .gte("last_active_at", cutoff)
    .order("user_id", { ascending: true })
    .limit(limit);

  if (cursorUserId) {
    query = query.gt("user_id", cursorUserId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ActiveUserRow[];
};

const runRetention = async (
  supabase: SupabaseClient,
  jobDate: Date,
  retentionDays: number
) => {
  const cutoff = new Date(jobDate);
  cutoff.setUTCDate(cutoff.getUTCDate() - retentionDays);
  const cutoffBucket = getBucketDate(cutoff);

  const { error } = await supabase
    .from("portfolio_snapshots")
    .delete()
    .lt("bucket_date", cutoffBucket);

  if (error) {
    throw new Error(error.message);
  }
};

export async function runPortfolioSnapshotsCron(
  supabase: SupabaseClient,
  options: CronRunOptions
): Promise<CronRunResult> {
  // Cron worker: progress through users until time budget is reached.
  const jobDate = new Date();
  const { state, isNew } = await getOrCreateCronState(supabase, jobDate);

  if (state.done) {
    return { processedUsers: 0, processedPortfolios: 0, done: true };
  }

  if (isNew) {
    await runRetention(supabase, jobDate, options.retentionDays);
  }

  const startedAt = Date.now();
  let cursorUserId = state.cursor_user_id;
  let processedUsers = 0;
  let processedPortfolios = 0;
  let done = false;

  while (Date.now() - startedAt < options.timeBudgetMs) {
    const users = await listActiveUsers(
      supabase,
      cursorUserId,
      options.limit
    );

    if (users.length === 0) {
      done = true;
      break;
    }

    for (const user of users) {
      const result = await runDailySnapshotsForUser(
        supabase,
        user.user_id,
        jobDate
      );
      processedUsers += 1;
      processedPortfolios += result.processedPortfolios;
      cursorUserId = user.user_id;

      if (Date.now() - startedAt >= options.timeBudgetMs) {
        break;
      }
    }

    if (users.length < options.limit) {
      done = true;
      break;
    }
  }

  await updateCronState(supabase, jobDate, cursorUserId ?? null, done);

  return { processedUsers, processedPortfolios, done };
}
