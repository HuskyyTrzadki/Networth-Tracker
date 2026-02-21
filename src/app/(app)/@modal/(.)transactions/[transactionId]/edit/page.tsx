import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { AddTransactionEditDialogRoute } from "@/features/transactions";
import { getTransactionEditDialogData } from "@/features/transactions/server/get-transaction-edit-dialog-data";
import { createClient } from "@/lib/supabase/server";

type Props = Readonly<{
  params: Promise<{
    transactionId: string;
  }>;
}>;

export default async function TransactionEditModalPage({ params }: Props) {
  const { transactionId } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return null;
  }

  const dialogData = await loadTransactionDialogDataOrThrow({
    supabase,
    userId: data.user.id,
    transactionId,
  });

  return (
    <AddTransactionEditDialogRoute
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
