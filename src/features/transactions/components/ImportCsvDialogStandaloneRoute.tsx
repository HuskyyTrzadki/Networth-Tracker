"use client";

import { useRouter } from "next/navigation";

import { ImportCsvDialog } from "./ImportCsvDialog";

export function ImportCsvDialogStandaloneRoute({
  portfolios,
  initialPortfolioId,
  forcedPortfolioId,
}: Readonly<{
  portfolios: readonly { id: string; name: string; baseCurrency: string }[];
  initialPortfolioId: string;
  forcedPortfolioId: string | null;
}>) {
  const router = useRouter();

  return (
    <ImportCsvDialog
      open
      portfolios={portfolios}
      initialPortfolioId={initialPortfolioId}
      forcedPortfolioId={forcedPortfolioId}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) router.replace("/transactions");
      }}
    />
  );
}
