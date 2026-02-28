import type { createClient } from "@/lib/supabase/server";
import type { GuestUpgradeNudgeStep } from "@/features/auth/lib/guest-upgrade-nudge";

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

export async function dismissGuestUpgradeNudgeStep(
  supabase: SupabaseServerClient,
  userId: string,
  step: GuestUpgradeNudgeStep
) {
  const dismissedAt = toIsoNow();
  const column =
    step === 5
      ? "guest_upgrade_nudge_5_dismissed_at"
      : "guest_upgrade_nudge_15_dismissed_at";

  const { error } = await supabase
    .from("profiles")
    .update({
      [column]: dismissedAt,
      last_active_at: dismissedAt,
    })
    .eq("user_id", userId)
    .is(column, null);

  if (error) {
    throw new Error(error.message);
  }
}
