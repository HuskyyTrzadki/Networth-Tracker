"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { isDemoAccount } from "./demo-account";
import { getAuthUser, signInAnonymously, signOut } from "./service";

export async function startRealPortfolioFromDemoAction() {
  const cookieStore = await cookies();
  const user = await getAuthUser(cookieStore);

  if (!user) {
    redirect("/onboarding");
  }

  if (!user.is_anonymous) {
    redirect("/onboarding");
  }

  const demoGuest = await isDemoAccount(user.id).catch(() => false);

  if (!demoGuest) {
    redirect("/onboarding");
  }

  await signOut(cookieStore);
  await signInAnonymously(cookieStore);

  redirect("/onboarding");
}
