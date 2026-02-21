"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/features/design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/design-system/components/ui/dialog";

import type { InstrumentSearchResult } from "../lib/instrument-search";
import type { InstrumentSearchClient } from "../client/search-instruments";
import {
  AddTransactionDialogContent,
  type FormValues,
} from "./AddTransactionDialogContent";

export function AddTransactionDialog({
  mode = "create",
  editTransactionId,
  initialValues,
  initialInstrument,
  searchClient,
  portfolios,
  cashBalancesByPortfolio,
  assetBalancesByPortfolio,
  initialPortfolioId,
  forcedPortfolioId,
  onSubmitSuccess,
  open,
  onOpenChange,
}: Readonly<{
  mode?: "create" | "edit";
  editTransactionId?: string;
  initialValues?: Partial<FormValues>;
  initialInstrument?: InstrumentSearchResult;
  searchClient?: InstrumentSearchClient;
  portfolios: readonly { id: string; name: string; baseCurrency: string }[];
  cashBalancesByPortfolio: Readonly<Record<string, Readonly<Record<string, string>>>>;
  assetBalancesByPortfolio: Readonly<Record<string, Readonly<Record<string, string>>>>;
  initialPortfolioId: string;
  forcedPortfolioId: string | null;
  onSubmitSuccess?: () => void;
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
}>) {
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  const closeDialog = useCallback(() => {
    setConfirmDiscardOpen(false);
    setIsDirty(false);
    setIsSubmitting(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const requestClose = useCallback(
    (options?: { force?: boolean }) => {
      if (isSubmitting && !options?.force) {
        return;
      }

      if (options?.force || !isDirty) {
        closeDialog();
        return;
      }

      setConfirmDiscardOpen(true);
    },
    [closeDialog, isDirty, isSubmitting]
  );

  useEffect(() => {
    if (!open) return;

    const onGlobalClose = () => requestClose();
    window.addEventListener("app:close-modal", onGlobalClose);
    return () => window.removeEventListener("app:close-modal", onGlobalClose);
  }, [open, requestClose]);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            onOpenChange(true);
            return;
          }
          requestClose();
        }}
      >
        <DialogContent className="max-h-[92dvh] overflow-hidden rounded-lg border-border/80 bg-card p-0 sm:max-w-[1080px]">
          <AddTransactionDialogContent
            assetBalancesByPortfolio={assetBalancesByPortfolio}
            cashBalancesByPortfolio={cashBalancesByPortfolio}
            mode={mode}
            editTransactionId={editTransactionId}
            forcedPortfolioId={forcedPortfolioId}
            initialInstrument={initialInstrument}
            initialPortfolioId={initialPortfolioId}
            initialValues={initialValues}
            onDirtyChange={setIsDirty}
            onSubmittingChange={setIsSubmitting}
            onSubmitSuccess={onSubmitSuccess}
            onClose={requestClose}
            portfolios={portfolios}
            searchClient={searchClient}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDiscardOpen} onOpenChange={setConfirmDiscardOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Odrzucić niezapisane zmiany?</DialogTitle>
            <DialogDescription>
              Formularz zawiera niezapisane dane. Czy na pewno chcesz zamknąć okno?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDiscardOpen(false)}
            >
              Wróć do edycji
            </Button>
            <Button type="button" variant="destructive" onClick={() => requestClose({ force: true })}>
              Odrzuć zmiany
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
