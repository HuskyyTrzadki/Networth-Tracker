"use client";

import { useRouter } from "next/navigation";

import type { BrokerImportProviderId } from "../lib/broker-import-providers";
import { ImportCsvDialog } from "./ImportCsvDialog";

export function ImportCsvDialogStandaloneRoute({
  provider,
  portfolios,
  initialPortfolioId,
  forcedPortfolioId,
}: Readonly<{
  provider: BrokerImportProviderId;
  portfolios: readonly { id: string; name: string; baseCurrency: string }[];
  initialPortfolioId: string;
  forcedPortfolioId: string | null;
}>) {
  const router = useRouter();

  return (
    <ImportCsvDialog
      open
      provider={provider}
      portfolios={portfolios}
      initialPortfolioId={initialPortfolioId}
      forcedPortfolioId={forcedPortfolioId}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) router.replace("/transactions");
      }}
    />
  );
}
