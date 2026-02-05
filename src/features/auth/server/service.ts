import { createClient } from "@/lib/supabase/server";
import type { cookies } from "next/headers";

import { ensureDefaultPortfolioExists } from "@/features/portfolio/server/default-portfolio";
import { ensureProfileExists, markProfileUpgradedIfNeeded } from "./profiles";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

type SupabaseServerClient = ReturnType<typeof createClient>;

export async function signInAnonymously(cookieStore: CookieStore) {
  // Server-side anonymous session creation so cookies are set securely.
  const supabase: SupabaseServerClient = createClient(cookieStore);
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) throw new Error(error.message);
  const user = data?.user;
  if (!user) throw new Error("Missing user after anonymous sign-in.");

  await ensureProfileExists(supabase, user.id);
  // Guarantee a first portfolio for every new session (anon or signed-in).
  await ensureDefaultPortfolioExists(supabase, user.id);

  return {
    userId: user.id,
    isAnonymous: Boolean(user.is_anonymous),
  } as const;
}

export async function exchangeOAuthCodeForSession(
  cookieStore: CookieStore,
  code: string
) {
  // OAuth callback: exchange the code for a session and set cookies.
  const supabase: SupabaseServerClient = createClient(cookieStore);
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) throw new Error(error.message);
  const user = data?.user;
  if (!user) throw new Error("Missing user after OAuth callback.");

  await ensureProfileExists(supabase, user.id);
  // Ensure portfolio exists for users coming from OAuth.
  await ensureDefaultPortfolioExists(supabase, user.id);
  if (!user.is_anonymous) {
    await markProfileUpgradedIfNeeded(supabase, user.id);
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
  const { data, error } = await supabase.auth.updateUser(input);

  if (error) throw new Error(error.message);
  const user = data?.user;
  if (!user) throw new Error("Missing user after email/password upgrade.");

  await ensureProfileExists(supabase, user.id);
  // Users upgrading from anonymous already have a portfolio, but we keep it safe.
  await ensureDefaultPortfolioExists(supabase, user.id);
  await markProfileUpgradedIfNeeded(supabase, user.id);

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
  await ensureDefaultPortfolioExists(supabase, user.id);
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
    await ensureDefaultPortfolioExists(supabase, user.id);
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
