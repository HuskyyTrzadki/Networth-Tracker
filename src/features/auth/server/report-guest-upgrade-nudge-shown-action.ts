"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

import { recordGuestUpgradeNudgeShown } from "./guest-upgrade-nudge-events";

const reportGuestUpgradeNudgeShownSchema = z.union([z.literal(5), z.literal(15)]);

export async function reportGuestUpgradeNudgeShownAction(step: 5 | 15) {
  const parsed = reportGuestUpgradeNudgeShownSchema.safeParse(step);
  if (!parsed.success) {
    throw new Error("Nieprawidlowy prog powiadomienia.");
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.auth.getUser();
  const user = data.user ?? null;

  if (error || !user || !user.is_anonymous) {
    return;
  }

  await recordGuestUpgradeNudgeShown(supabase, user.id, parsed.data);
}
