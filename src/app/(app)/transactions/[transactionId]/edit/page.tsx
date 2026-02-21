import { cookies } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/features/design-system/components/ui/button";
import { AddTransactionEditDialogStandaloneRoute } from "@/features/transactions";
import { getTransactionEditDialogData } from "@/features/transactions/server/get-transaction-edit-dialog-data";
import { createClient } from "@/lib/supabase/server";

type Props = Readonly<{
  params: Promise<{
    transactionId: string;
  }>;
}>;

export const metadata: Metadata = {
  title: "Edytuj transakcję",
};

export default async function TransactionEditPage({ params }: Props) {
  const { transactionId } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return (
      <main className="mx-auto w-full max-w-[1560px] px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Transakcje</h1>
        <div className="mt-6 rounded-lg border border-border bg-card px-6 py-6 text-sm text-muted-foreground">
          Zaloguj się, aby edytować transakcję.
        </div>
        <Button asChild className="mt-4 h-11">
          <Link
            href={{
              pathname: "/login",
              query: { next: `/transactions/${transactionId}/edit` },
            }}
          >
            Zaloguj się
          </Link>
        </Button>
      </main>
    );
  }

  const dialogData = await loadTransactionDialogDataOrThrow({
    supabase,
    userId: data.user.id,
    transactionId,
  });

  return (
    <AddTransactionEditDialogStandaloneRoute
      transactionId={dialogData.transactionId}
      portfolios={dialogData.portfolios}
      cashBalancesByPortfolio={dialogData.cashBalancesByPortfolio}
      assetBalancesByPortfolio={dialogData.assetBalancesByPortfolio}
      initialPortfolioId={dialogData.initialPortfolioId}
      initialValues={dialogData.initialValues}
      initialInstrument={dialogData.initialInstrument}
    />
  );
}

const loadTransactionDialogDataOrThrow = async (input: Readonly<{
  supabase: ReturnType<typeof createClient>;
  userId: string;
  transactionId: string;
}>) => {
  try {
    return await getTransactionEditDialogData(
      input.supabase,
      input.userId,
      input.transactionId
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Brak portfela")) {
      redirect("/onboarding");
    }
    if (message.includes("nie istnieje") || message.includes("dostępu")) {
      notFound();
    }
    throw error;
  }
};
