import { cookies } from "next/headers";
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";

import { Button } from "@/features/design-system/components/ui/button";
import { CreateFirstPortfolioAction } from "@/features/portfolio";
import { listPortfolios } from "@/features/portfolio/server/list-portfolios";
import { cn } from "@/lib/cn";
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

  // Compute first-run setup status to make onboarding progress explicit.
  const [portfolios, transactionCount, hasValuation] = await Promise.all([
    listPortfolios(supabase),
    countUserTransactions(supabase, data.user.id),
    checkUserHasSnapshots(supabase, data.user.id),
  ]);
  const firstPortfolioId = portfolios[0]?.id ?? null;
  const steps = [
    {
      id: "portfolio",
      label: "Utwórz portfel",
      description: "Załóż pierwszy portfel inwestycyjny.",
      done: portfolios.length > 0,
    },
    {
      id: "transaction",
      label: "Dodaj transakcję",
      description: "Dodaj pierwsze kupno albo depozyt gotówki.",
      done: transactionCount > 0,
    },
    {
      id: "valuation",
      label: "Sprawdź wycenę",
      description: "Zweryfikuj dashboard i historię wyceny portfela.",
      done: hasValuation,
    },
  ] as const;
  const completedSteps = steps.filter((step) => step.done).length;

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
        <div className="mt-6 rounded-lg border border-border/80 bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">Postęp wdrożenia</h2>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {completedSteps}/3
            </span>
          </div>
          <ol className="mt-3 space-y-2.5">
            {steps.map((step) => (
              <li
                key={step.id}
                className={cn(
                  "flex items-start gap-2.5 rounded-md border border-border/70 px-3 py-2",
                  step.done ? "bg-primary/[0.06]" : "bg-card"
                )}
              >
                {step.done ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                ) : (
                  <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

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

const countUserTransactions = async (
  supabase: ReturnType<typeof createClient>,
  userId: string
) => {
  const { count } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
};

const checkUserHasSnapshots = async (
  supabase: ReturnType<typeof createClient>,
  userId: string
) => {
  const { count } = await supabase
    .from("portfolio_snapshots")
    .select("bucket_date", { count: "exact", head: true })
    .eq("user_id", userId)
    .limit(1);
  return (count ?? 0) > 0;
};
