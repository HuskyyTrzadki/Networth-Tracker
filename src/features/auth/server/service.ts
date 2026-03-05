import { createClient } from "@/lib/supabase/server";
import type { cookies } from "next/headers";

import { recordGuestUpgradeNudgesUpgraded } from "./guest-upgrade-nudge-events";
import { ensureProfileExists, markProfileUpgradedIfNeeded } from "./profiles";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

type SupabaseServerClient = ReturnType<typeof createClient>;
type OAuthStartResult = Readonly<{
  redirectUrl: string;
}>;

const readOAuthRedirectUrl = (
  result:
    | Awaited<ReturnType<SupabaseServerClient["auth"]["signInWithOAuth"]>>
    | Awaited<ReturnType<SupabaseServerClient["auth"]["linkIdentity"]>>
) => {
  if (result.error) {
    throw new Error(result.error.message);
  }

  const data = result.data;
  const redirectUrl =
    data && typeof data === "object" && "url" in data ? data.url : null;
  if (typeof redirectUrl !== "string" || redirectUrl.length === 0) {
    throw new Error("Missing OAuth redirect URL.");
  }

  return redirectUrl;
};

export async function signInAnonymously(cookieStore: CookieStore) {
  // Server-side anonymous session creation so cookies are set securely.
  const supabase: SupabaseServerClient = createClient(cookieStore);
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) throw new Error(error.message);
  const user = data?.user;
  if (!user) throw new Error("Missing user after anonymous sign-in.");

  await ensureProfileExists(supabase, user.id);

  return {
    userId: user.id,
    isAnonymous: Boolean(user.is_anonymous),
  } as const;
}

export async function startGoogleSignIn(
  cookieStore: CookieStore,
  redirectTo: string
): Promise<OAuthStartResult> {
  // Start OAuth flow from the server and return provider redirect URL.
  const supabase: SupabaseServerClient = createClient(cookieStore);
  const result = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  return {
    redirectUrl: readOAuthRedirectUrl(result),
  };
}

export async function startGoogleIdentityLink(
  cookieStore: CookieStore,
  redirectTo: string
): Promise<OAuthStartResult> {
  // Link Google identity for an authenticated user and return provider redirect URL.
  const supabase: SupabaseServerClient = createClient(cookieStore);
  const { data, error } = await supabase.auth.getUser();
  const user = data.user ?? null;
  if (error || !user) {
    throw new Error("Unauthorized.");
  }

  const result = await supabase.auth.linkIdentity({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  return {
    redirectUrl: readOAuthRedirectUrl(result),
  };
}

export async function exchangeOAuthCodeForSession(
  cookieStore: CookieStore,
  code: string
) {
  // OAuth callback: exchange the code for a session and set cookies.
  const supabase: SupabaseServerClient = createClient(cookieStore);
  const {
    data: { user: previousUser },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) throw new Error(error.message);
  const user = data?.user;
  if (!user) throw new Error("Missing user after OAuth callback.");

  await ensureProfileExists(supabase, user.id);
  if (!user.is_anonymous) {
    await markProfileUpgradedIfNeeded(supabase, user.id);
    if (previousUser?.is_anonymous) {
      await recordGuestUpgradeNudgesUpgraded(supabase, user.id);
    }
  }

  return {
    userId: user.id,
    isAnonymous: Boolean(user.is_anonymous),
  } as const;
}

export async function signOut(cookieStore: CookieStore) {
  // Clear auth cookies and session on the server.
  const supabase: SupabaseServerClient = createClient(cookieStore);
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function upgradeToEmailPassword(
  cookieStore: CookieStore,
  input: Readonly<{ email: string; password: string }>
) {
  // Link email/password credentials to the current session.
  const supabase: SupabaseServerClient = createClient(cookieStore);
  const {
    data: { user: previousUser },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase.auth.updateUser(input);

  if (error) throw new Error(error.message);
  const user = data?.user;
  if (!user) throw new Error("Missing user after email/password upgrade.");

  await ensureProfileExists(supabase, user.id);
  await markProfileUpgradedIfNeeded(supabase, user.id);
  if (previousUser?.is_anonymous && !user.is_anonymous) {
    await recordGuestUpgradeNudgesUpgraded(supabase, user.id);
  }

  return { userId: user.id } as const;
}

export async function signInWithEmailPassword(
  cookieStore: CookieStore,
  input: Readonly<{ email: string; password: string }>
) {
  // Sign in with email/password and keep profile + portfolio in sync.
  const supabase: SupabaseServerClient = createClient(cookieStore);
  const { data, error } = await supabase.auth.signInWithPassword(input);

  if (error) throw new Error(error.message);
  const user = data?.user;
  if (!user) throw new Error("Missing user after password sign-in.");

  await ensureProfileExists(supabase, user.id);
  if (!user.is_anonymous) {
    await markProfileUpgradedIfNeeded(supabase, user.id);
  }

  return {
    userId: user.id,
    isAnonymous: Boolean(user.is_anonymous),
  } as const;
}

export async function signUpWithEmailPassword(
  cookieStore: CookieStore,
  input: Readonly<{
    email: string;
    password: string;
    emailRedirectTo?: string;
  }>
) {
  // Sign up with email/password; session may be absent if email confirmation is on.
  const supabase: SupabaseServerClient = createClient(cookieStore);
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: input.emailRedirectTo
      ? { emailRedirectTo: input.emailRedirectTo }
      : undefined,
  });

  if (error) throw new Error(error.message);
  const user = data?.user;
  if (!user) throw new Error("Missing user after password sign-up.");

  const hasSession = Boolean(data?.session);
  if (hasSession) {
    await ensureProfileExists(supabase, user.id);
    if (!user.is_anonymous) {
      await markProfileUpgradedIfNeeded(supabase, user.id);
    }
  }

  return {
    userId: user.id,
    hasSession,
  } as const;
}

export async function getAuthUser(cookieStore: CookieStore) {
  // Lightweight helper to read the current user (if any).
  const supabase: SupabaseServerClient = createClient(cookieStore);
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data?.user ?? null;
}
