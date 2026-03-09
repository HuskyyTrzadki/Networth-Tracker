import { Suspense } from "react";
import { redirect } from "next/navigation";

import { ImportCsvDialogSkeleton } from "@/features/transactions/components/ImportCsvDialogSkeleton";
import { ImportCsvDialogRoute } from "@/features/transactions/components/ImportCsvDialogRoute";
import {
  DEFAULT_BROKER_IMPORT_PROVIDER,
  isBrokerImportProviderId,
} from "@/features/transactions/lib/broker-import-providers";
import { getImportDialogData } from "@/features/transactions/server/get-import-dialog-data";

type Props = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function ImportCsvModalPage({ searchParams }: Props) {
  const params = await searchParams;
  const providerParam = Array.isArray(params.provider) ? params.provider[0] : params.provider;
  const provider = isBrokerImportProviderId(providerParam)
    ? providerParam
    : DEFAULT_BROKER_IMPORT_PROVIDER;
  const dialogData = await getImportDialogData(params);

  if (dialogData.status !== "ready") {
    redirect("/transactions/import");
  }

  return (
    <Suspense fallback={<ImportCsvDialogSkeleton fullscreen />}>
      <ImportCsvDialogRoute
        provider={provider}
        portfolios={dialogData.portfolios}
        initialPortfolioId={dialogData.initialPortfolioId}
        forcedPortfolioId={dialogData.forcedPortfolioId}
      />
    </Suspense>
  );
}
