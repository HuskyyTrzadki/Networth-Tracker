import type { cookies } from "next/headers";

import {
  resolveGuestUpgradeBanner,
  type GuestUpgradeBanner,
  type GuestUpgradeNudgeStep,
} from "@/features/auth/lib/guest-upgrade-nudge";
import { createClient } from "@/lib/supabase/server";

import { dismissGuestUpgradeNudgeStep } from "./profiles";

type CookieStore = Awaited<ReturnType<typeof cookies>>;
type SupabaseServerClient = ReturnType<typeof createClient>;

type ProfileNudgeRow = Readonly<{
  guest_upgrade_nudge_5_dismissed_at: string | null;
  guest_upgrade_nudge_15_dismissed_at: string | null;
}>;

export type GuestUpgradeNudgeState = Readonly<{
  isGuest: boolean;
  showSettingsBadge: boolean;
  banner: GuestUpgradeBanner | null;
}>;

async function getAuthenticatedContext(cookieStore: CookieStore) {
  const supabase: SupabaseServerClient = createClient(cookieStore);
  const { data, error } = await supabase.auth.getUser();
  const user = data.user ?? null;

  if (error || !user) {
    return null;
  }

  return { supabase, user };
}

export async function getGuestUpgradeNudgeState(
  cookieStore: CookieStore
): Promise<GuestUpgradeNudgeState> {
  const context = await getAuthenticatedContext(cookieStore);

  if (!context || !context.user.is_anonymous) {
    return {
      isGuest: false,
      showSettingsBadge: false,
      banner: null,
    };
  }

  const [{ data: profile }, { count, error: countError }] = await Promise.all([
    context.supabase
      .from("profiles")
      .select(
        "guest_upgrade_nudge_5_dismissed_at, guest_upgrade_nudge_15_dismissed_at"
      )
      .eq("user_id", context.user.id)
      .maybeSingle<ProfileNudgeRow>(),
    context.supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("leg_role", "ASSET"),
  ]);

  if (countError) {
    throw new Error(countError.message);
  }

  const transactionCount = count ?? 0;
  const banner = resolveGuestUpgradeBanner({
    transactionCount,
    dismissedStep5At: profile?.guest_upgrade_nudge_5_dismissed_at ?? null,
    dismissedStep15At: profile?.guest_upgrade_nudge_15_dismissed_at ?? null,
  });

  return {
    isGuest: true,
    showSettingsBadge: true,
    banner,
  };
}

export async function dismissGuestUpgradeNudgeForCurrentUser(
  cookieStore: CookieStore,
  step: GuestUpgradeNudgeStep
) {
  const context = await getAuthenticatedContext(cookieStore);

  if (!context || !context.user.is_anonymous) {
    throw new Error("UNAUTHORIZED");
  }

  await dismissGuestUpgradeNudgeStep(context.supabase, context.user.id, step);
}
