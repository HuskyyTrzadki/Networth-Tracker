import type { SupabaseClient } from "@supabase/supabase-js";

import { getBucketDate } from "./bucket-date";

type CronStateRow = Readonly<{
  job_date: string;
  cursor_user_id: string | null;
  done: boolean;
}>;

type CronStateResult = Readonly<{
  state: CronStateRow;
  isNew: boolean;
}>;

export async function getOrCreateCronState(
  supabase: SupabaseClient,
  jobDate: Date
): Promise<CronStateResult> {
  const bucketDate = getBucketDate(jobDate);

  const { data, error } = await supabase
    .from("cron_portfolio_snapshots_state")
    .select("job_date,cursor_user_id,done")
    .eq("job_date", bucketDate)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    return { state: data as CronStateRow, isNew: false };
  }

  const { error: insertError } = await supabase
    .from("cron_portfolio_snapshots_state")
    .insert({ job_date: bucketDate, done: false, cursor_user_id: null });

  if (insertError && insertError.code !== "23505") {
    throw new Error(insertError.message);
  }

  const { data: created, error: selectError } = await supabase
    .from("cron_portfolio_snapshots_state")
    .select("job_date,cursor_user_id,done")
    .eq("job_date", bucketDate)
    .maybeSingle();

  if (selectError || !created) {
    throw new Error(selectError?.message ?? "Failed to read cron state.");
  }

  return { state: created as CronStateRow, isNew: true };
}

export async function updateCronState(
  supabase: SupabaseClient,
  jobDate: Date,
  cursorUserId: string | null,
  done: boolean
): Promise<void> {
  const bucketDate = getBucketDate(jobDate);
  const { error } = await supabase
    .from("cron_portfolio_snapshots_state")
    .update({
      cursor_user_id: cursorUserId,
      done,
      updated_at: new Date().toISOString(),
    })
    .eq("job_date", bucketDate);

  if (error) {
    throw new Error(error.message);
  }
}
