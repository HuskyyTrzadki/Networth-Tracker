"use client";

import { useRouter } from "next/navigation";

import { AddTransactionDialog } from "./AddTransactionDialog";
import type { FormValues } from "./AddTransactionDialogContent";
import type { InstrumentSearchResult } from "../lib/instrument-search";

export function AddTransactionDialogRoute({
  portfolios,
  cashBalancesByPortfolio,
  assetBalancesByPortfolio,
  initialPortfolioId,
  forcedPortfolioId,
  initialValues,
  initialInstrument,
}: Readonly<{
  portfolios: readonly { id: string; name: string; baseCurrency: string }[];
  cashBalancesByPortfolio: Readonly<Record<string, Readonly<Record<string, string>>>>;
  assetBalancesByPortfolio: Readonly<Record<string, Readonly<Record<string, string>>>>;
  initialPortfolioId: string;
  forcedPortfolioId: string | null;
  initialValues?: Partial<FormValues>;
  initialInstrument?: InstrumentSearchResult;
}>) {
  const router = useRouter();

  return (
    <AddTransactionDialog
      open
      initialValues={initialValues}
      initialInstrument={initialInstrument}
      portfolios={portfolios}
      cashBalancesByPortfolio={cashBalancesByPortfolio}
      assetBalancesByPortfolio={assetBalancesByPortfolio}
      initialPortfolioId={initialPortfolioId}
      forcedPortfolioId={forcedPortfolioId}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) router.back();
      }}
    />
  );
}
