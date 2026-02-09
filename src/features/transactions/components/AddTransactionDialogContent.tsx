"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { LoaderCircle, X } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/features/design-system/components/ui/button";
import {
  DialogClose,
  DialogDescription,
  DialogTitle,
} from "@/features/design-system/components/ui/dialog";
import { dispatchSnapshotRebuildTriggeredEvent } from "@/features/portfolio/lib/snapshot-rebuild-events";
import {
  Form,
} from "@/features/design-system/components/ui/form";

import {
  createAddTransactionFormSchema,
  type TransactionType,
} from "../lib/add-transaction-form-schema";
import type { CashflowTypeUi } from "../lib/cashflow-types";
import type { InstrumentSearchResult } from "../lib/instrument-search";
import {
  SUPPORTED_CASH_CURRENCIES,
  isSupportedCashCurrency,
  type CashCurrency,
} from "../lib/system-currencies";
import { createTransaction } from "../client/create-transaction";
import type { InstrumentSearchClient } from "../client/search-instruments";
import {
  resolveInitialTab,
  type AssetTab,
} from "./add-transaction/constants";
import { AddTransactionDialogFields } from "./add-transaction/AddTransactionDialogFields";

export type FormValues = Readonly<{
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
}>;

type SubmitPayloadFields = Readonly<{
  price: string;
  fee: string;
  consumeCash: boolean;
  cashCurrency?: string;
  fxFee?: string;
  cashflowType?: CashflowTypeUi;
}>;

const buildSubmitPayloadFields = (
  values: FormValues,
  isCashTab: boolean
): SubmitPayloadFields => {
  if (isCashTab) {
    return {
      price: "1",
      fee: "0",
      consumeCash: false,
      cashflowType: values.cashflowType,
    };
  }

  if (!values.consumeCash) {
    return {
      price: values.price,
      fee: values.fee,
      consumeCash: false,
    };
  }

  return {
    price: values.price,
    fee: values.fee,
    consumeCash: true,
    cashCurrency: values.cashCurrency,
    fxFee: values.fxFee,
  };
};

const triggerSnapshotRebuild = (
  scope: "PORTFOLIO" | "ALL",
  portfolioId: string | null
) => {
  // Client kickoff: start a rebuild run immediately after transaction save
  // so portfolio widgets show queued/running state without manual reload.
  void fetch("/api/portfolio-snapshots/rebuild", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scope,
      portfolioId,
      maxDaysPerRun: 90,
      timeBudgetMs: 1_000,
    }),
  }).catch(() => undefined);
};

export function AddTransactionDialogContent({
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
}: Readonly<{
  initialValues?: Partial<FormValues>;
  initialInstrument?: InstrumentSearchResult;
  searchClient?: InstrumentSearchClient;
  portfolios: readonly { id: string; name: string; baseCurrency: string }[];
  cashBalancesByPortfolio: Readonly<Record<string, Readonly<Record<string, string>>>>;
  assetBalancesByPortfolio: Readonly<Record<string, Readonly<Record<string, string>>>>;
  initialPortfolioId: string;
  forcedPortfolioId: string | null;
  onSubmitSuccess?: () => void;
  onClose: () => void;
}>) {
  const schema = createAddTransactionFormSchema();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedInstrument, setSelectedInstrument] =
    useState<InstrumentSearchResult | null>(initialInstrument ?? null);
  const [activeTab, setActiveTab] = useState<AssetTab>(
    resolveInitialTab(initialInstrument)
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
      ...initialValues,
    },
    mode: "onChange",
  });

  const consumeCash = useWatch({ control: form.control, name: "consumeCash" });
  const cashCurrency = useWatch({ control: form.control, name: "cashCurrency" });
  const cashflowType = useWatch({ control: form.control, name: "cashflowType" });

  const isCashTab = activeTab === "CASH";
  const isSubmittable =
    Boolean(selectedInstrument) &&
    form.formState.isValid &&
    (!consumeCash || Boolean(cashCurrency)) &&
    (!isCashTab || Boolean(cashflowType));

  const submitTransaction = form.handleSubmit(async (values) => {
    if (!selectedInstrument) {
      form.setError("assetId", { message: "Wybierz instrument." });
      return;
    }

    setIsSubmitting(true);
    form.clearErrors("root");

    try {
      const resolvedPortfolioId = forcedPortfolioId ?? values.portfolioId;
      const payloadFields = buildSubmitPayloadFields(values, isCashTab);
      await createTransaction({
        type: values.type,
        date: values.date,
        quantity: values.quantity,
        ...payloadFields,
        notes: values.notes,
        portfolioId: resolvedPortfolioId,
        clientRequestId: crypto.randomUUID(),
        instrument: {
          provider: selectedInstrument.provider,
          providerKey: selectedInstrument.providerKey,
          symbol: selectedInstrument.symbol,
          name: selectedInstrument.name,
          currency: selectedInstrument.currency,
          instrumentType: selectedInstrument.instrumentType ?? undefined,
          exchange: selectedInstrument.exchange ?? undefined,
          region: selectedInstrument.region ?? undefined,
          logoUrl: selectedInstrument.logoUrl ?? undefined,
        },
      });

      dispatchSnapshotRebuildTriggeredEvent({
        scope: "PORTFOLIO",
        portfolioId: resolvedPortfolioId,
      });
      dispatchSnapshotRebuildTriggeredEvent({
        scope: "ALL",
        portfolioId: null,
      });

      triggerSnapshotRebuild("PORTFOLIO", resolvedPortfolioId);
      triggerSnapshotRebuild("ALL", null);

      onSubmitSuccess?.();

      // Close dialog after submit side effects are scheduled.
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nie udało się zapisać transakcji.";
      form.setError("root", { message });
    } finally {
      setIsSubmitting(false);
    }
  });

  const rootError = form.formState.errors.root?.message;

  return (
    <Form {...form}>
      <form
        className="flex max-h-[92dvh] flex-col"
        onSubmit={submitTransaction}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border/70 bg-background px-6 py-5">
          <div className="min-w-0">
            <DialogTitle className="truncate">Dodaj transakcję</DialogTitle>
            <DialogDescription className="mt-1">
              Uzupełnij dane i zapisz transakcję w portfelu.
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
          selectedInstrument={selectedInstrument}
          setActiveTab={setActiveTab}
          setSelectedInstrument={setSelectedInstrument}
        />

        <footer className="border-t border-border/70 bg-background px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-5 text-sm text-destructive">
              {rootError ?? ""}
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                onClick={onClose}
                type="button"
                variant="outline"
                disabled={isSubmitting}
                className="h-12 px-8 text-lg"
              >
                Anuluj
              </Button>
              <Button
                disabled={!isSubmittable || isSubmitting}
                type="submit"
                className="h-12 min-w-40 px-8 text-lg"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" aria-hidden />
                    Zapisywanie...
                  </>
                ) : (
                  "Zapisz"
                )}
              </Button>
            </div>
          </div>
        </footer>
      </form>
    </Form>
  );
}
