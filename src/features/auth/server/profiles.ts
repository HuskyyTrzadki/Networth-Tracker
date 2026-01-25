import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = ReturnType<typeof createClient>;

type ProfileInsert = Readonly<{
  user_id: string;
  last_active_at: string;
}>;

const toIsoNow = () => new Date().toISOString();

export async function ensureProfileExists(
  supabase: SupabaseServerClient,
  userId: string
) {
  // Create or refresh a profile row so app-level metadata always exists.
  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        last_active_at: toIsoNow(),
      } satisfies ProfileInsert,
      { onConflict: "user_id" }
    );

  if (error) {
    throw new Error(error.message);
  }
}

export async function markProfileUpgradedIfNeeded(
  supabase: SupabaseServerClient,
  userId: string
) {
  // Mark the upgrade once, without overwriting existing timestamps.
  const now = toIsoNow();
  const { error } = await supabase
    .from("profiles")
    .update({ upgraded_at: now, last_active_at: now })
    .eq("user_id", userId)
    .is("upgraded_at", null);

  if (error) {
    throw new Error(error.message);
  }
}

export async function touchProfileLastActive(
  supabase: SupabaseServerClient,
  userId: string
) {
  // Best-effort update used by write actions (transactions/portfolio).
  const { error } = await supabase
    .from("profiles")
    .update({ last_active_at: toIsoNow() })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}
