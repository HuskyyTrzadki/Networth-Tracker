import { Suspense } from "react";
import { redirect } from "next/navigation";

import { ImportCsvDialogSkeleton } from "@/features/transactions/components/ImportCsvDialogSkeleton";
import { ImportCsvDialogRoute } from "@/features/transactions/components/ImportCsvDialogRoute";
import { getImportDialogData } from "@/features/transactions/server/get-import-dialog-data";

type Props = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function ImportCsvModalPage({ searchParams }: Props) {
  const params = await searchParams;
  const dialogData = await getImportDialogData(params);

  if (dialogData.status !== "ready") {
    redirect("/transactions/import");
  }

  return (
    <Suspense fallback={<ImportCsvDialogSkeleton fullscreen />}>
      <ImportCsvDialogRoute
        portfolios={dialogData.portfolios}
        initialPortfolioId={dialogData.initialPortfolioId}
        forcedPortfolioId={dialogData.forcedPortfolioId}
      />
    </Suspense>
  );
}
