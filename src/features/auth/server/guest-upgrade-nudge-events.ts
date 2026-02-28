import type { GuestUpgradeNudgeStep } from "@/features/auth/lib/guest-upgrade-nudge";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = ReturnType<typeof createClient>;
type GuestUpgradeNudgeEventType = "shown" | "dismissed" | "upgraded";

type EventRow = Readonly<{
  step: GuestUpgradeNudgeStep;
  event_type: GuestUpgradeNudgeEventType;
}>;

async function insertEvent(
  supabase: SupabaseServerClient,
  userId: string,
  step: GuestUpgradeNudgeStep,
  eventType: GuestUpgradeNudgeEventType
) {
  const { error } = await supabase
    .from("guest_upgrade_nudge_events")
    .upsert(
      {
        user_id: userId,
        step,
        event_type: eventType,
      },
      {
        onConflict: "user_id,step,event_type",
        ignoreDuplicates: true,
      }
    );

  if (error) {
    throw new Error(error.message);
  }
}

export async function recordGuestUpgradeNudgeShown(
  supabase: SupabaseServerClient,
  userId: string,
  step: GuestUpgradeNudgeStep
) {
  await insertEvent(supabase, userId, step, "shown");
}

export async function recordGuestUpgradeNudgeDismissed(
  supabase: SupabaseServerClient,
  userId: string,
  step: GuestUpgradeNudgeStep
) {
  await insertEvent(supabase, userId, step, "dismissed");
}

export async function recordGuestUpgradeNudgesUpgraded(
  supabase: SupabaseServerClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("guest_upgrade_nudge_events")
    .select("step, event_type")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as EventRow[];
  const shownSteps = new Set<GuestUpgradeNudgeStep>();
  const upgradedSteps = new Set<GuestUpgradeNudgeStep>();

  for (const row of rows) {
    if (row.event_type === "shown") {
      shownSteps.add(row.step);
    }

    if (row.event_type === "upgraded") {
      upgradedSteps.add(row.step);
    }
  }

  await Promise.all(
    Array.from(shownSteps)
      .filter((step) => !upgradedSteps.has(step))
      .map((step) => insertEvent(supabase, userId, step, "upgraded"))
  );
}
