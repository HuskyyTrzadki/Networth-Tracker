import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/features/design-system/components/ui/button";
import { AddTransactionDialogStandaloneRoute } from "@/features/transactions/components/AddTransactionDialogStandaloneRoute";
import { getCreateTransactionDialogData } from "@/features/transactions/server/get-create-transaction-dialog-data";

type Props = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export const metadata: Metadata = {
  title: "Dodaj transakcję",
};

export default async function TransactionNewPage({ searchParams }: Props) {
  const params = await searchParams;
  const dialogData = await getCreateTransactionDialogData(params);

  if (dialogData.status === "unauthenticated") {
    return (
      <main className="mx-auto w-full max-w-[1560px] px-6 py-8">
        <section className="max-w-[720px] rounded-xl border border-border/75 bg-card/94 p-6 shadow-[var(--surface-shadow)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
            Dostęp wymagany
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Dodaj transakcję
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Zaloguj się, aby dodać transakcję.
          </p>
          <Button asChild className="mt-5 h-11">
            <Link
              href={{
                pathname: "/login",
                query: { next: "/transactions/new" },
              }}
            >
              Zaloguj się
            </Link>
          </Button>
        </section>
      </main>
    );
  }

  if (dialogData.status === "empty") {
    redirect("/onboarding");
  }

  return (
    <AddTransactionDialogStandaloneRoute
      portfolios={dialogData.portfolios}
      initialPortfolioId={dialogData.initialPortfolioId}
      forcedPortfolioId={null}
      initialInstrument={dialogData.initialInstrument}
      initialValues={dialogData.initialValues}
    />
  );
}
