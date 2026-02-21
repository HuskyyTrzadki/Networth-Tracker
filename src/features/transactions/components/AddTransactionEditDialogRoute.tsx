"use client";

import { useRouter } from "next/navigation";

import { AddTransactionDialog } from "./AddTransactionDialog";
import type { FormValues } from "./AddTransactionDialogContent";
import type { InstrumentSearchResult } from "../lib/instrument-search";

export function AddTransactionEditDialogRoute({
  transactionId,
  portfolios,
  cashBalancesByPortfolio,
  assetBalancesByPortfolio,
  initialPortfolioId,
  initialValues,
  initialInstrument,
}: Readonly<{
  transactionId: string;
  portfolios: readonly { id: string; name: string; baseCurrency: string }[];
  cashBalancesByPortfolio: Readonly<Record<string, Readonly<Record<string, string>>>>;
  assetBalancesByPortfolio: Readonly<Record<string, Readonly<Record<string, string>>>>;
  initialPortfolioId: string;
  initialValues?: Partial<FormValues>;
  initialInstrument?: InstrumentSearchResult;
}>) {
  const router = useRouter();

  return (
    <AddTransactionDialog
      open
      mode="edit"
      editTransactionId={transactionId}
      initialValues={initialValues}
      initialInstrument={initialInstrument}
      portfolios={portfolios}
      cashBalancesByPortfolio={cashBalancesByPortfolio}
      assetBalancesByPortfolio={assetBalancesByPortfolio}
      initialPortfolioId={initialPortfolioId}
      forcedPortfolioId={initialPortfolioId}
      onSubmitSuccess={() => {
        router.refresh();
      }}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) router.back();
      }}
    />
  );
}
