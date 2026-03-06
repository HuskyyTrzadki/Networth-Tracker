import { redirect } from "next/navigation";

import { AddTransactionDialogRoute } from "@/features/transactions/components/AddTransactionDialogRoute";
import { getCreateTransactionDialogData } from "@/features/transactions/server/get-create-transaction-dialog-data";

type Props = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function AddTransactionModalPage({
  searchParams,
}: Props) {
  const params = await searchParams;
  const dialogData = await getCreateTransactionDialogData(params);

  if (dialogData.status === "unauthenticated") {
    return null;
  }

  if (dialogData.status === "empty") {
    redirect("/onboarding");
  }

  return (
    <AddTransactionDialogRoute
      portfolios={dialogData.portfolios}
      initialPortfolioId={dialogData.initialPortfolioId}
      forcedPortfolioId={null}
      initialInstrument={dialogData.initialInstrument}
      initialValues={dialogData.initialValues}
    />
  );
}
