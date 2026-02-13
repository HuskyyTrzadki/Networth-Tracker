import { cookies } from "next/headers";
import Link from "next/link";

import { Button } from "@/features/design-system/components/ui/button";
import { CreateFirstPortfolioAction } from "@/features/portfolio";
import { listPortfolios } from "@/features/portfolio/server/list-portfolios";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Onboarding",
};

export default async function OnboardingPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  // Resolve authenticated user on the server to keep onboarding deterministic.
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return (
      <main className="px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Onboarding</h1>
        <div className="mt-6 rounded-lg border border-border bg-card px-6 py-6 text-sm text-muted-foreground">
          Zaloguj się, aby przejść onboarding.
        </div>
      </main>
    );
  }

  // Check whether the user already has any portfolio to show the right CTA.
  const portfolios = await listPortfolios(supabase);
  const firstPortfolioId = portfolios[0]?.id ?? null;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-3xl flex-col px-6 py-10">
      <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
          Start
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Skonfiguruj konto
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Zacznij od utworzenia pierwszego portfela. Potem dodasz transakcje i
          uruchomisz wycenę.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          {firstPortfolioId ? (
            <Button asChild className="h-11 w-full sm:w-auto">
              <Link href={`/portfolio/${firstPortfolioId}`}>
                Przejdź do portfela
              </Link>
            </Button>
          ) : (
            <CreateFirstPortfolioAction />
          )}
          <Button asChild className="h-11 w-full sm:w-auto" variant="outline">
            <Link href="/settings">Ustawienia konta</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
