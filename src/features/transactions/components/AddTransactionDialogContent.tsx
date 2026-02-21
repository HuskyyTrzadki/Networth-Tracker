"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { LoaderCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/features/design-system/components/ui/button";
import { AnimatedReveal } from "@/features/design-system";
import { DialogClose, DialogDescription, DialogTitle } from "@/features/design-system/components/ui/dialog";
import { dispatchSnapshotRebuildTriggeredEvent } from "@/features/portfolio/lib/snapshot-rebuild-events";
import { Form } from "@/features/design-system/components/ui/form";
import { dispatchAppToast } from "@/features/app-shell/lib/app-toast-events";

import { createAddTransactionFormSchema, type AssetMode, type TransactionType } from "../lib/add-transaction-form-schema";
import { DEFAULT_CUSTOM_ASSET_TYPE, type CustomAssetType } from "../lib/custom-asset-types";
import type { CashflowTypeUi } from "../lib/cashflow-types";
import type { InstrumentSearchResult } from "../lib/instrument-search";
import { SUPPORTED_CASH_CURRENCIES, isSupportedCashCurrency, type CashCurrency } from "../lib/system-currencies";
import { createTransaction } from "../client/create-transaction";
import { deleteTransaction } from "../client/delete-transaction";
import { updateTransaction } from "../client/update-transaction";
import type { InstrumentSearchClient } from "../client/search-instruments";
import { buildSubmitPayloadFields, triggerSnapshotRebuild } from "./add-transaction/submit-helpers";
import { resolveInitialTab, type AssetTab } from "./add-transaction/constants";
import { AddTransactionDialogFields } from "./add-transaction/AddTransactionDialogFields";

export type FormValues = Readonly<{
  assetMode: AssetMode;
  type: TransactionType;
  portfolioId: string;
  assetId: string;
  currency: string;
  consumeCash: boolean;
  cashCurrency: string;
  fxFee: string;
  cashflowType?: CashflowTypeUi;
  date: string;
  quantity: string;
  price: string;
  fee: string;
  notes: string;
  customAssetType?: CustomAssetType;
  customName?: string;
  customCurrency?: string;
  customAnnualRatePct?: string;
}>;

export function AddTransactionDialogContent({
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
  onClose,
  onDirtyChange,
  onSubmittingChange,
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
  onClose: (options?: { force?: boolean }) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
}>) {
  const schema = createAddTransactionFormSchema();
  const isEditMode = mode === "edit";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedInstrument, setSelectedInstrument] =
    useState<InstrumentSearchResult | null>(initialInstrument ?? null);
  const [activeTab, setActiveTab] = useState<AssetTab>(() =>
    initialValues?.assetMode ?? resolveInitialTab(initialInstrument)
  );

  const initialAssetId = initialInstrument?.id ?? "";
  const initialCurrency = initialInstrument?.currency ?? "";
  const initialPortfolio = portfolios.find(
    (portfolio) => portfolio.id === initialPortfolioId
  );
  const initialInstrumentCurrency =
    initialInstrument && isSupportedCashCurrency(initialInstrument.currency)
      ? initialInstrument.currency
      : null;
  const initialCashCurrency: CashCurrency =
    (initialInstrumentCurrency ??
      (initialPortfolio && isSupportedCashCurrency(initialPortfolio.baseCurrency)
        ? initialPortfolio.baseCurrency
        : SUPPORTED_CASH_CURRENCIES[0])) ?? "USD";

  const initialCashflowType =
    initialInstrument?.instrumentType === "CURRENCY"
      ? (initialValues?.type === "SELL" ? "WITHDRAWAL" : "DEPOSIT")
      : undefined;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      assetMode: initialValues?.assetMode ?? resolveInitialTab(initialInstrument),
      type: "BUY",
      portfolioId: initialPortfolioId,
      assetId: initialAssetId,
      currency: initialCurrency,
      consumeCash: false,
      cashCurrency: initialCashCurrency,
      fxFee: "",
      cashflowType: initialCashflowType,
      date: format(new Date(), "yyyy-MM-dd"),
      quantity: "",
      price: initialInstrument?.instrumentType === "CURRENCY" ? "1" : "",
      fee: initialInstrument?.instrumentType === "CURRENCY" ? "0" : "",
      notes: "",
      customAssetType: DEFAULT_CUSTOM_ASSET_TYPE,
      customName: "",
      customCurrency: initialCashCurrency,
      customAnnualRatePct: "",
      ...initialValues,
    },
    mode: "onChange",
  });

  const consumeCash = useWatch({ control: form.control, name: "consumeCash" });
  const cashCurrency = useWatch({ control: form.control, name: "cashCurrency" });
  const cashflowType = useWatch({ control: form.control, name: "cashflowType" });

  const isCashTab = activeTab === "CASH";
  const isCustomTab = activeTab === "CUSTOM";
  const isSubmittable =
    (isCustomTab || Boolean(selectedInstrument)) &&
    form.formState.isValid &&
    (!consumeCash || Boolean(cashCurrency)) &&
    (!isCashTab || Boolean(cashflowType));

  const triggerRebuildSignals = (portfolioId: string) => {
    dispatchSnapshotRebuildTriggeredEvent({
      scope: "PORTFOLIO",
      portfolioId,
    });
    dispatchSnapshotRebuildTriggeredEvent({
      scope: "ALL",
      portfolioId: null,
    });
    triggerSnapshotRebuild("PORTFOLIO", portfolioId);
    triggerSnapshotRebuild("ALL", null);
  };

  const submitTransaction = form.handleSubmit(async (values) => {
    if (!isCustomTab && !selectedInstrument) {
      form.setError("assetId", { message: "Wybierz instrument." });
      return;
    }

    setIsSubmitting(true);
    form.clearErrors("root");
    const resolvedPortfolioId = forcedPortfolioId ?? values.portfolioId;
    const payloadFields = buildSubmitPayloadFields(values, isCashTab);
    if (isEditMode) {
      if (!editTransactionId) {
        form.setError("root", { message: "Brak identyfikatora transakcji do edycji." });
        setIsSubmitting(false);
        return;
      }

      const updated = await updateTransaction(editTransactionId, {
        type: values.type,
        date: values.date,
        quantity: values.quantity,
        ...payloadFields,
        notes: values.notes,
        ...(isCustomTab
          ? { customAnnualRatePct: values.customAnnualRatePct ?? "" }
          : {}),
      }).catch((error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : "Nie udało się zaktualizować transakcji.";
        form.setError("root", { message });
        return null;
      });

      if (!updated) {
        setIsSubmitting(false);
        return;
      }

      triggerRebuildSignals(updated.portfolioId);
      dispatchAppToast({
        title: "Transakcja zaktualizowana.",
        description: "Zmiany zostały zapisane.",
        tone: "success",
      });
    } else {
      const createResult = await createTransaction({
        type: values.type,
        date: values.date,
        quantity: values.quantity,
        ...payloadFields,
        notes: values.notes,
        portfolioId: resolvedPortfolioId,
        clientRequestId: crypto.randomUUID(),
        ...(isCustomTab
          ? {
              customInstrument: {
                name: values.customName ?? "",
                currency: values.customCurrency ?? "",
                notes: values.notes,
                kind: values.customAssetType ?? DEFAULT_CUSTOM_ASSET_TYPE,
                valuationKind: "COMPOUND_ANNUAL_RATE" as const,
                annualRatePct: values.customAnnualRatePct ?? "0",
              },
            }
          : {
              instrument: {
                provider: selectedInstrument!.provider,
                providerKey: selectedInstrument!.providerKey,
                symbol: selectedInstrument!.symbol,
                name: selectedInstrument!.name,
                currency: selectedInstrument!.currency,
                instrumentType: selectedInstrument!.instrumentType ?? undefined,
                exchange: selectedInstrument!.exchange ?? undefined,
                region: selectedInstrument!.region ?? undefined,
                logoUrl: selectedInstrument!.logoUrl ?? undefined,
              },
            }),
      }).catch((error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : "Nie udało się zapisać transakcji.";
        form.setError("root", { message });
        return null;
      });
      if (!createResult) {
        setIsSubmitting(false);
        return;
      }

      triggerRebuildSignals(resolvedPortfolioId);
      dispatchAppToast({
        title: "Transakcja zapisana.",
        description: "Możesz cofnąć zmianę przez 10 sekund.",
        tone: "success",
        durationMs: 10_000,
        action: {
          label: "Cofnij",
          onClick: async () => {
            try {
              const undoResult = await deleteTransaction(createResult.transactionId);
              triggerRebuildSignals(undoResult.portfolioId);
              dispatchAppToast({
                title: "Cofnięto transakcję.",
                description: "Zmiana została anulowana.",
                tone: "success",
              });
            } catch (undoError) {
              const message =
                undoError instanceof Error
                  ? undoError.message
                  : "Nie udało się cofnąć transakcji.";
              dispatchAppToast({
                title: "Nie udało się cofnąć transakcji.",
                description: message,
                tone: "destructive",
              });
            }
          },
        },
      });
    }

    onSubmitSuccess?.();

    // Close dialog after submit side effects are scheduled.
    onClose({ force: true });
    setIsSubmitting(false);
  });

  const rootError = form.formState.errors.root?.message;
  const isDirty = form.formState.isDirty;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    onSubmittingChange?.(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  return (
    <Form {...form}>
      <AnimatedReveal y={8}>
        <form
          className="flex max-h-[92dvh] flex-col"
          onSubmit={submitTransaction}
        >
          <header className="flex items-start justify-between gap-3 border-b border-border/70 bg-background px-5 py-3.5 md:px-6 md:py-4">
            <div className="min-w-0">
              <DialogTitle className="truncate text-base font-semibold tracking-tight">
                {isEditMode ? "Edytuj transakcję" : "Dodaj transakcję"}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-[11px] text-muted-foreground/90">
                {isEditMode
                  ? "Zaktualizuj dane i zapisz zmiany w transakcji."
                  : "Uzupełnij dane i zapisz transakcję w portfelu."}
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button
                aria-label="Zamknij"
                className="h-9 w-9 p-0"
                type="button"
                variant="ghost"
                disabled={isSubmitting}
              >
                <X className="size-5 opacity-70" aria-hidden />
              </Button>
            </DialogClose>
          </header>

          <AddTransactionDialogFields
            activeTab={activeTab}
            assetBalancesByPortfolio={assetBalancesByPortfolio}
            cashBalancesByPortfolio={cashBalancesByPortfolio}
            forcedPortfolioId={forcedPortfolioId}
            form={form}
            initialCashCurrency={initialCashCurrency}
            portfolios={portfolios}
            searchClient={searchClient}
            isEditMode={isEditMode}
            selectedInstrument={selectedInstrument}
            setActiveTab={setActiveTab}
            setSelectedInstrument={setSelectedInstrument}
          />

          <footer className="sticky bottom-0 z-10 border-t border-border bg-muted/35 px-5 py-3.5 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur md:static md:px-6 md:py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-h-5 text-sm text-destructive">
                {rootError ?? ""}
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  onClick={() => onClose()}
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  className="h-10 px-6"
                >
                  Anuluj
                </Button>
                <Button
                  disabled={!isSubmittable || isSubmitting}
                  type="submit"
                  className="h-10 min-w-32 px-6"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" aria-hidden />
                      Zapisywanie...
                    </>
                  ) : (
                    isEditMode ? "Zapisz zmiany" : "Zapisz"
                  )}
                </Button>
              </div>
            </div>
          </footer>
        </form>
      </AnimatedReveal>
    </Form>
  );
}
