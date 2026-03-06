"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryStates } from "nuqs";

import { AddTransactionDialog } from "./AddTransactionDialog";
import { AddTransactionDialogSkeleton } from "./AddTransactionDialogSkeleton";
import type { FormValues } from "./AddTransactionDialogContent";
import type { InstrumentSearchResult } from "../lib/instrument-search";
import { addTransactionQueryStateParsers } from "../lib/add-transaction-query-state";
import { useTransactionDialogBalanceCache } from "./add-transaction/use-transaction-dialog-balance-cache";

type Props = Readonly<{
  portfolios: readonly { id: string; name: string; baseCurrency: string }[];
  initialPortfolioId: string;
  forcedPortfolioId: string | null;
  initialValues?: Partial<FormValues>;
  initialInstrument?: InstrumentSearchResult;
}>;

function AddTransactionDialogRouteInner({
  portfolios,
  initialPortfolioId,
  forcedPortfolioId,
  initialValues,
  initialInstrument,
}: Props) {
  const router = useRouter();
  const [, setQueryState] = useQueryStates(addTransactionQueryStateParsers, {
    history: "replace",
    shallow: true,
    scroll: false,
  });
  const {
    cashBalancesByPortfolio,
    assetBalancesByPortfolio,
    loadingPortfolioIds,
    balanceErrorMessagesByPortfolio,
    ensurePortfolioBalances,
  } = useTransactionDialogBalanceCache(initialPortfolioId);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(initialPortfolioId);
  const [hasPortfolioSelectionChanged, setHasPortfolioSelectionChanged] = useState(false);

  const handlePortfolioSelectionChange = (nextPortfolioId: string) => {
    setHasPortfolioSelectionChanged(true);
    setSelectedPortfolioId(nextPortfolioId);
    void ensurePortfolioBalances(nextPortfolioId);
    void setQueryState({
      portfolioId: nextPortfolioId,
      portfolio: null,
    });
  };

  return (
    <AddTransactionDialog
      open
      initialValues={initialValues}
      initialInstrument={initialInstrument}
      portfolios={portfolios}
      cashBalancesByPortfolio={cashBalancesByPortfolio}
      assetBalancesByPortfolio={assetBalancesByPortfolio}
      loadingPortfolioIds={loadingPortfolioIds}
      balanceErrorMessagesByPortfolio={balanceErrorMessagesByPortfolio}
      initialPortfolioId={initialPortfolioId}
      forcedPortfolioId={forcedPortfolioId}
      isPortfolioSwitchPending={
        hasPortfolioSelectionChanged && loadingPortfolioIds.includes(selectedPortfolioId)
      }
      onPortfolioSelectionChange={handlePortfolioSelectionChange}
      onSubmitSuccess={() => {
        router.refresh();
      }}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) router.back();
      }}
    />
  );
}

export function AddTransactionDialogRoute(props: Props) {
  return (
    <Suspense fallback={<AddTransactionDialogSkeleton fullscreen />}>
      <AddTransactionDialogRouteInner {...props} />
    </Suspense>
  );
}
