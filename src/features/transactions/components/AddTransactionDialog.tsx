"use client";

import {
  Dialog,
  DialogContent,
} from "@/features/design-system/components/ui/dialog";

import type { InstrumentSearchResult } from "../lib/instrument-search";
import type { InstrumentSearchClient } from "../client/search-instruments";
import {
  AddTransactionDialogContent,
  type FormValues,
} from "./AddTransactionDialogContent";

export function AddTransactionDialog({
  initialValues,
  initialInstrument,
  searchClient,
  portfolios,
  cashBalancesByPortfolio,
  initialPortfolioId,
  forcedPortfolioId,
  open,
  onOpenChange,
}: Readonly<{
  initialValues?: Partial<FormValues>;
  initialInstrument?: InstrumentSearchResult;
  searchClient?: InstrumentSearchClient;
  portfolios: readonly { id: string; name: string; baseCurrency: string }[];
  cashBalancesByPortfolio: Readonly<Record<string, Readonly<Record<string, string>>>>;
  initialPortfolioId: string;
  forcedPortfolioId: string | null;
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
}>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] p-0 sm:max-w-xl">
        <AddTransactionDialogContent
          cashBalancesByPortfolio={cashBalancesByPortfolio}
          forcedPortfolioId={forcedPortfolioId}
          initialInstrument={initialInstrument}
          initialPortfolioId={initialPortfolioId}
          initialValues={initialValues}
          onClose={() => onOpenChange(false)}
          portfolios={portfolios}
          searchClient={searchClient}
        />
      </DialogContent>
    </Dialog>
  );
}
