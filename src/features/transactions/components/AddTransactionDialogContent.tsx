"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/features/design-system/components/ui/button";
import { AnimatedReveal } from "@/features/design-system/components/AnimatedReveal";
import { DialogClose, DialogDescription, DialogTitle } from "@/features/design-system/components/ui/dialog";
import { dispatchSnapshotRebuildTriggeredEvent } from "@/features/portfolio/lib/snapshot-rebuild-events";
import { Form } from "@/features/design-system/components/ui/form";
import { dispatchAppToast } from "@/features/app-shell/lib/app-toast-events";
import { createAddTransactionFormSchema, type AssetMode, type TransactionType } from "../lib/add-transaction-form-schema";
import type { CustomAssetType } from "../lib/custom-asset-types";
import type { CashflowTypeUi } from "../lib/cashflow-types";
import type { InstrumentSearchResult } from "../lib/instrument-search";
import type { InstrumentSearchClient } from "../client/search-instruments";
import { triggerSnapshotRebuild } from "./add-transaction/submit-helpers";
import type { AssetTab } from "./add-transaction/constants";
import { AddTransactionDialogFooter } from "./add-transaction/AddTransactionDialogFooter";
import { AddTransactionDialogFields } from "./add-transaction/AddTransactionDialogFields";
import { buildTransactionSubmitIntent } from "./add-transaction/submit-intent";
import {
  executeTransactionSubmitIntent,
  undoCreatedTransaction,
} from "./add-transaction/submit-actions";
import {
  buildAddTransactionDefaultValues,
  resolveDialogInitialTab,
  resolveInitialCashCurrency,
} from "./add-transaction/form-defaults";
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
  loadingPortfolioIds = [],
  balanceErrorMessagesByPortfolio = {},
  initialPortfolioId,
  forcedPortfolioId,
  isPortfolioSwitchPending = false,
  onPortfolioSelectionChange,
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
  loadingPortfolioIds?: readonly string[];
  balanceErrorMessagesByPortfolio?: Readonly<Record<string, string>>;
  initialPortfolioId: string;
  forcedPortfolioId: string | null;
  isPortfolioSwitchPending?: boolean;
  onPortfolioSelectionChange?: (nextPortfolioId: string) => void;
  onSubmitSuccess?: () => void;
  onClose: (options?: { force?: boolean }) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
}>) {
  const schema = createAddTransactionFormSchema();
  const isEditMode = mode === "edit";
  const defaultActiveTab = resolveDialogInitialTab(initialValues, initialInstrument);
  const initialCashCurrency = resolveInitialCashCurrency({
    initialInstrument,
    portfolios,
    initialPortfolioId,
  });
  const defaultValues = buildAddTransactionDefaultValues({
    initialValues,
    initialInstrument,
    initialPortfolioId,
    initialCashCurrency,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);
  const [submitIntent, setSubmitIntent] = useState<"close" | "addAnother">("close");
  const [selectedInstrument, setSelectedInstrument] =
    useState<InstrumentSearchResult | null>(initialInstrument ?? null);
  const [activeTab, setActiveTab] = useState<AssetTab>(defaultActiveTab);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
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

  const resetCreateForm = (portfolioId: string) => {
    const nextInitialCashCurrency = resolveInitialCashCurrency({
      initialInstrument,
      portfolios,
      initialPortfolioId: portfolioId,
    });
    const nextDefaultValues = buildAddTransactionDefaultValues({
      initialValues: {
        ...initialValues,
        portfolioId,
      },
      initialInstrument,
      initialPortfolioId: portfolioId,
      initialCashCurrency: nextInitialCashCurrency,
    });

    form.reset(nextDefaultValues);
    setActiveTab(resolveDialogInitialTab(initialValues, initialInstrument));
    setSelectedInstrument(initialInstrument ?? null);
    setIsScreenshotMode(false);
    setSubmitIntent("close");
  };

  const submitTransaction = form.handleSubmit(async (values) => {
    const buildResult = buildTransactionSubmitIntent({
      mode,
      editTransactionId,
      values,
      isCashTab,
      isCustomTab,
      selectedInstrument,
      forcedPortfolioId,
    });

    if (!buildResult.ok) {
      form.setError(buildResult.field, { message: buildResult.message });
      return;
    }

    setIsSubmitting(true);
    form.clearErrors("root");

    const result = await executeTransactionSubmitIntent(buildResult.intent);
    if (!result.ok) {
      form.setError("root", { message: result.message });
      setIsSubmitting(false);
      return;
    }

    triggerRebuildSignals(result.portfolioId);

    if (result.kind === "edit") {
      dispatchAppToast({
        title: "Transakcja zaktualizowana.",
        description: "Zmiany zostały zapisane.",
        tone: "success",
      });
    } else {
      dispatchAppToast({
        title: "Transakcja zapisana.",
        description: "Możesz cofnąć zmianę przez 10 sekund.",
        tone: "success",
        durationMs: 10_000,
        action: {
          label: "Cofnij",
          onClick: async () => {
            const undoResult = await undoCreatedTransaction(result.transactionId);
            if (!undoResult.ok) {
              dispatchAppToast({
                title: "Nie udało się cofnąć transakcji.",
                description: undoResult.message,
                tone: "destructive",
              });
              return;
            }

            triggerRebuildSignals(undoResult.portfolioId);
            dispatchAppToast({
              title: "Cofnięto transakcję.",
              description: "Zmiana została anulowana.",
              tone: "success",
            });
          },
        },
      });

      if (submitIntent === "addAnother") {
        onSubmitSuccess?.();
        resetCreateForm(result.portfolioId);
        setIsSubmitting(false);
        return;
      }
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
          data-testid="add-transaction-form"
          onSubmit={(event) => {
            if (isScreenshotMode) {
              event.preventDefault();
              return;
            }
            void submitTransaction(event);
          }}
        >
          <header className="flex items-start justify-between gap-3 border-b border-dashed border-border/65 bg-card/94 px-5 py-3.5 md:px-6 md:py-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
                Formularz księgowania
              </p>
              <DialogTitle className="truncate text-base font-semibold tracking-tight">
                {isEditMode ? "Edytuj transakcję" : "Dodaj transakcję"}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-[11px] text-muted-foreground/90">
                {isEditMode
                  ? "Popraw szczegóły operacji i zapisz zmiany."
                  : "Uzupełnij szczegóły operacji, aby zapisać ją w portfelu."}
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button
                aria-label="Zamknij"
                className="h-9 w-9 rounded-full border border-border/55 p-0"
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
            balanceErrorMessagesByPortfolio={balanceErrorMessagesByPortfolio}
            cashBalancesByPortfolio={cashBalancesByPortfolio}
            forcedPortfolioId={forcedPortfolioId}
            form={form}
            initialCashCurrency={initialCashCurrency}
            isPortfolioSwitchPending={isPortfolioSwitchPending}
            loadingPortfolioIds={loadingPortfolioIds}
            portfolios={portfolios}
            searchClient={searchClient}
            isEditMode={isEditMode}
            selectedInstrument={selectedInstrument}
            setActiveTab={setActiveTab}
            setSelectedInstrument={setSelectedInstrument}
            onPortfolioSelectionChange={onPortfolioSelectionChange}
            onScreenshotModeChange={setIsScreenshotMode}
            onRequestCloseDialog={() => onClose({ force: true })}
          />

          {!isScreenshotMode ? (
            <AddTransactionDialogFooter
              isEditMode={isEditMode}
              isSubmittable={isSubmittable}
              isSubmitting={isSubmitting}
              onClose={() => onClose()}
              onSubmitIntentChange={setSubmitIntent}
              rootError={rootError}
              submitIntent={submitIntent}
            />
          ) : null}
        </form>
      </AnimatedReveal>
    </Form>
  );
}
