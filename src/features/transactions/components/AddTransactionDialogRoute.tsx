"use client";

import { useRouter } from "next/navigation";

import { AddTransactionDialog } from "./AddTransactionDialog";

export function AddTransactionDialogRoute({
  portfolios,
  cashBalancesByPortfolio,
  initialPortfolioId,
  forcedPortfolioId,
}: Readonly<{
  portfolios: readonly { id: string; name: string; baseCurrency: string }[];
  cashBalancesByPortfolio: Readonly<Record<string, Readonly<Record<string, string>>>>;
  initialPortfolioId: string;
  forcedPortfolioId: string | null;
}>) {
  const router = useRouter();

  return (
    <AddTransactionDialog
      open
      portfolios={portfolios}
      cashBalancesByPortfolio={cashBalancesByPortfolio}
      initialPortfolioId={initialPortfolioId}
      forcedPortfolioId={forcedPortfolioId}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) router.back();
      }}
    />
  );
}
