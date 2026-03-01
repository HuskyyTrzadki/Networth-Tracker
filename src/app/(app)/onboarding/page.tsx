import { cookies } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";

import { isDemoAccount } from "@/features/auth/server/demo-account";
import { Button } from "@/features/design-system/components/ui/button";
import { OnboardingWizard } from "@/features/onboarding";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Onboarding",
};

type Props = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

const getFirstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function OnboardingPage({ searchParams }: Props) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  // Resolve authenticated user on the server to keep onboarding deterministic.
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return (
      <main className="px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Onboarding</h1>
        <div className="mt-6 rounded-lg border border-border bg-card px-6 py-6 text-sm text-muted-foreground">
          Zaloguj się, aby kontynuować.
        </div>
        <Button asChild className="mt-4 h-11">
          <Link
            href={{
              pathname: "/login",
              query: { next: "/onboarding" },
            }}
          >
            Zaloguj się
          </Link>
        </Button>
      </main>
    );
  }

  const demoGuest = data.user.is_anonymous
    ? await isDemoAccount(data.user.id).catch(() => false)
    : false;
  const initialMode =
    getFirstParam(params.quickStart) === "1" ||
    getFirstParam(params.mode) === "screenshot"
      ? "screenshot"
      : "choice";

  return (
    <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-6xl flex-col px-6 py-10">
      <OnboardingWizard
        initialMode={initialMode}
        showDemoPortfolioCta={!demoGuest}
      />
    </main>
  );
}
