import { cookies } from "next/headers";

import { AddTransactionDialogStandaloneRoute } from "@/features/transactions";
import { getDefaultPortfolioId } from "@/features/portfolio/server/default-portfolio";
import { createClient } from "@/lib/supabase/server";
export const metadata = {
  title: "Dodaj transakcję",
};

export default async function TransactionNewPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return (
      <main className="px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Transakcje</h1>
        <div className="mt-6 rounded-lg border border-border bg-card px-6 py-6 text-sm text-muted-foreground">
          Zaloguj się, aby dodać transakcję.
        </div>
      </main>
    );
  }

  const portfolioId = await getDefaultPortfolioId(supabase, data.user.id);

  return <AddTransactionDialogStandaloneRoute portfolioId={portfolioId} />;
}
