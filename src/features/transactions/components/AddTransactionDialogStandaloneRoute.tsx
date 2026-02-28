"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { AddTransactionDialog } from "./AddTransactionDialog";
import type { FormValues } from "./AddTransactionDialogContent";
import type { InstrumentSearchResult } from "../lib/instrument-search";

export function AddTransactionDialogStandaloneRoute({
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPortfolioSwitchPending, startTransition] = useTransition();

  const handlePortfolioSelectionChange = (nextPortfolioId: string) => {
    const currentPortfolioId =
      searchParams.get("portfolioId") ?? searchParams.get("portfolio");
    if (currentPortfolioId === nextPortfolioId) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("portfolioId", nextPortfolioId);
    params.delete("portfolio");

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
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
      initialPortfolioId={initialPortfolioId}
      forcedPortfolioId={forcedPortfolioId}
      isPortfolioSwitchPending={isPortfolioSwitchPending}
      onPortfolioSelectionChange={handlePortfolioSelectionChange}
      onSubmitSuccess={() => {
        router.refresh();
      }}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) router.replace("/transactions");
      }}
    />
  );
}
