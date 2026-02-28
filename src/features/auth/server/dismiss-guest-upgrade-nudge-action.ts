"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { recordGuestUpgradeNudgeDismissed } from "./guest-upgrade-nudge-events";
import { dismissGuestUpgradeNudgeForCurrentUser } from "./guest-upgrade-nudges";

const dismissGuestUpgradeNudgeSchema = z.union([z.literal(5), z.literal(15)]);

export async function dismissGuestUpgradeNudgeAction(step: 5 | 15) {
  const parsed = dismissGuestUpgradeNudgeSchema.safeParse(step);
  if (!parsed.success) {
    throw new Error("Nieprawidlowy prog powiadomienia.");
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.auth.getUser();
  const user = data.user ?? null;

  if (error || !user || !user.is_anonymous) {
    throw new Error("UNAUTHORIZED");
  }

  await Promise.all([
    dismissGuestUpgradeNudgeForCurrentUser(cookieStore, parsed.data),
    recordGuestUpgradeNudgeDismissed(supabase, user.id, parsed.data),
  ]);

  refresh();
}
