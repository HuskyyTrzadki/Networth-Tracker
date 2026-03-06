"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import { FormControl, FormField, FormItem, FormLabel } from "@/features/design-system/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/design-system/components/ui/select";
import { AddTransactionInstrumentSection } from "./AddTransactionInstrumentSection";
import { AddTransactionCustomTradeFields } from "./AddTransactionCustomTradeFields";
import { AddTransactionTradeFields } from "./AddTransactionTradeFields";
import { AddTransactionSidebarSummary } from "./AddTransactionSidebarSummary";
import { AddTransactionNotesField } from "./AddTransactionNotesField";
import type { InstrumentSearchClient } from "../../client/search-instruments";
import type { InstrumentSearchResult } from "../../lib/instrument-search";
import { isSupportedCashCurrency, type CashCurrency } from "../../lib/system-currencies";
import { type AssetTab } from "./constants";
import { applyCashCurrencyChange, applyCashTabState, applyCustomTabState, applyMarketTabState } from "./tab-state";
import type { FormValues } from "../AddTransactionDialogContent";
import { createPortfolioAction } from "@/features/portfolio/server/create-portfolio-action";
import type { CreatePortfolioInput } from "@/features/portfolio/lib/create-portfolio-schema";
import { useAddTransactionFieldsContext } from "./use-add-transaction-fields-context";

type PortfolioOption = Readonly<{ id: string; name: string; baseCurrency: string }>;

const ScreenshotImportWizard = dynamic(
  () =>
    import("@/features/onboarding/components/ScreenshotImportWizard").then((module) => ({
      default: module.ScreenshotImportWizard,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border border-border/70 bg-card/95 p-4 shadow-[var(--surface-shadow)] sm:p-5">
        <div className="space-y-3">
          <div className="h-4 w-36 animate-pulse rounded-md bg-muted/35" />
          <div className="h-10 animate-pulse rounded-md bg-muted/35" />
          <div className="h-40 animate-pulse rounded-md bg-muted/25" />
        </div>
      </div>
    ),
  }
);

const mergePortfolios = (
  portfolios: readonly PortfolioOption[],
  localPortfolios: readonly PortfolioOption[]
): readonly PortfolioOption[] => {
  if (localPortfolios.length === 0) {
    return portfolios;
  }

  const merged = new Map<string, PortfolioOption>();
  portfolios.forEach((portfolio) => merged.set(portfolio.id, portfolio));
  localPortfolios.forEach((portfolio) => merged.set(portfolio.id, portfolio));
  return Array.from(merged.values());
};

export function AddTransactionDialogFields({
  form,
  selectedInstrument,
  setSelectedInstrument,
  activeTab,
  setActiveTab,
  searchClient,
  portfolios,
  cashBalancesByPortfolio,
  assetBalancesByPortfolio,
  loadingPortfolioIds = [],
  balanceErrorMessagesByPortfolio = {},
  forcedPortfolioId,
  initialCashCurrency,
  isPortfolioSwitchPending = false,
  isEditMode = false,
  onPortfolioSelectionChange,
  onScreenshotModeChange,
  onRequestCloseDialog,
}: Readonly<{
  form: UseFormReturn<FormValues>;
  selectedInstrument: InstrumentSearchResult | null;
  setSelectedInstrument: (next: InstrumentSearchResult | null) => void;
  activeTab: AssetTab;
  setActiveTab: (next: AssetTab) => void;
  searchClient?: InstrumentSearchClient;
  portfolios: readonly PortfolioOption[];
  cashBalancesByPortfolio: Readonly<Record<string, Readonly<Record<string, string>>>>;
  assetBalancesByPortfolio: Readonly<Record<string, Readonly<Record<string, string>>>>;
  loadingPortfolioIds?: readonly string[];
  balanceErrorMessagesByPortfolio?: Readonly<Record<string, string>>;
  forcedPortfolioId: string | null;
  initialCashCurrency: CashCurrency;
  isPortfolioSwitchPending?: boolean;
  isEditMode?: boolean;
  onPortfolioSelectionChange?: (nextPortfolioId: string) => void;
  onScreenshotModeChange?: (next: boolean) => void;
  onRequestCloseDialog?: () => void;
}>) {
  const [localPortfolios, setLocalPortfolios] = useState<PortfolioOption[]>([]);
  const [isScreenshotOpen, setIsScreenshotOpen] = useState(false);
  const {
    minTradeDate,
    maxTradeDate,
    consumeCash,
    cashCurrency,
    type,
    quantity,
    price,
    fee,
    date,
    customCurrency,
    isCashTab,
    isCustomTab,
    resolvedPortfolioId,
    resolvedCashCurrency,
    currentPortfolioBalanceErrorMessage,
    isCurrentPortfolioBalanceLoading,
    availableCashNow,
    cashBalanceOnDate,
    availableCashOnTradeDate,
    availableAssetQuantity,
    displayCurrency,
    cashImpactPreview,
    historicalPriceAssist,
  } = useAddTransactionFieldsContext({
    form,
    selectedInstrument,
    activeTab,
    forcedPortfolioId,
    initialCashCurrency,
    cashBalancesByPortfolio,
    assetBalancesByPortfolio,
    loadingPortfolioIds,
    balanceErrorMessagesByPortfolio,
  });

  const mergedPortfolios = mergePortfolios(portfolios, localPortfolios);
  const screenshotPortfolio =
    mergedPortfolios.find((portfolio) => portfolio.id === resolvedPortfolioId) ??
    null;

  const handleTabChange = (nextTab: AssetTab) => {
    setActiveTab(nextTab);

    if (nextTab === "CASH") {
      applyCashTabState(form, setSelectedInstrument, resolvedCashCurrency);
      return;
    }

    if (nextTab === "CUSTOM") {
      applyCustomTabState(form, setSelectedInstrument, initialCashCurrency);
      return;
    }

    applyMarketTabState(form, setSelectedInstrument);
  };

  const handleCashCurrencyChange = (nextCurrency: string) => {
    applyCashCurrencyChange(form, setSelectedInstrument, nextCurrency, isCashTab);
  };

  const handlePortfolioChange = (
    nextPortfolioId: string,
    nextPortfolioOverride?: Pick<PortfolioOption, "id" | "baseCurrency">
  ) => {
    const nextPortfolio =
      nextPortfolioOverride ??
      mergedPortfolios.find((portfolio) => portfolio.id === nextPortfolioId);
    if (!nextPortfolio || !isSupportedCashCurrency(nextPortfolio.baseCurrency)) {
      return;
    }

    form.setValue("cashCurrency", nextPortfolio.baseCurrency, {
      shouldValidate: true,
    });
    if (isCashTab) {
      handleCashCurrencyChange(nextPortfolio.baseCurrency);
    }
  };

  const handleTypeChange = (nextType: "BUY" | "SELL") => {
    if (!isCashTab) {
      return;
    }

    form.setValue("cashflowType", nextType === "BUY" ? "DEPOSIT" : "WITHDRAWAL", {
      shouldValidate: true,
    });
  };

  const handleCreatePortfolio = async (input: CreatePortfolioInput) => {
    const created = await createPortfolioAction(input);
    setLocalPortfolios((current) => {
      if (current.some((portfolio) => portfolio.id === created.id)) {
        return current;
      }
      return [...current, created];
    });
    form.setValue("portfolioId", created.id, { shouldValidate: true });
    handlePortfolioChange(created.id, created);
    return { id: created.id };
  };

  const handlePortfolioSelection = (nextPortfolioId: string) => {
    handlePortfolioChange(nextPortfolioId);
    onPortfolioSelectionChange?.(nextPortfolioId);
  };

  const openScreenshotImport = () => {
    setIsScreenshotOpen(true);
    onScreenshotModeChange?.(true);
  };

  const closeScreenshotImport = () => {
    setIsScreenshotOpen(false);
    onScreenshotModeChange?.(false);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background/40 px-3 py-3 sm:px-5 sm:py-4">
      {isScreenshotOpen ? (
        <section className="rounded-lg border border-border/70 bg-card/95 p-4 shadow-[var(--surface-shadow)] sm:p-5">
          <div className="mb-4 rounded-md border border-dashed border-border/65 bg-background/72 p-3.5">
            <FormField
              control={form.control}
              name="portfolioId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Portfel
                  </FormLabel>
                  <Select
                    disabled={Boolean(forcedPortfolioId) || isPortfolioSwitchPending}
                    onValueChange={(next) => {
                      field.onChange(next);
                      handlePortfolioSelection(next);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Wybierz portfel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mergedPortfolios.map((portfolio) => (
                        <SelectItem key={portfolio.id} value={portfolio.id}>
                          {portfolio.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
          <ScreenshotImportWizard
            variant="dialog"
            onClose={closeScreenshotImport}
            onCompleted={onRequestCloseDialog}
            searchClient={searchClient}
            portfolio={screenshotPortfolio ?? undefined}
          />
        </section>
      ) : (
        <div className="grid gap-3.5 lg:grid-cols-[minmax(0,1fr)_292px]">
          <section className="space-y-3.5 rounded-lg border border-border/70 bg-card/95 p-4 shadow-[var(--surface-shadow)]">
            <div className="rounded-md border border-dashed border-border/65 bg-background/72 p-3.5">
              <AddTransactionInstrumentSection
                form={form}
                forcedPortfolioId={forcedPortfolioId}
                portfolios={mergedPortfolios}
                isCashTab={isCashTab}
                isCustomTab={isCustomTab}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                isPortfolioSwitchPending={isPortfolioSwitchPending}
                transactionType={type}
                onPortfolioChange={handlePortfolioSelection}
                onTypeChange={handleTypeChange}
                resolvedCashCurrency={resolvedCashCurrency}
                onCashCurrencyChange={handleCashCurrencyChange}
                selectedInstrument={selectedInstrument}
                setSelectedInstrument={setSelectedInstrument}
                searchClient={searchClient}
                initialCashCurrency={initialCashCurrency}
                availableCashNow={availableCashNow}
                availableAssetQuantity={availableAssetQuantity}
                isPortfolioBalanceLoading={isCurrentPortfolioBalanceLoading}
                isEditMode={isEditMode}
                portfolioBalanceErrorMessage={currentPortfolioBalanceErrorMessage}
                onOpenScreenshot={openScreenshotImport}
                createPortfolioFn={handleCreatePortfolio}
              />
            </div>

            <div className="rounded-md border border-dashed border-border/65 bg-background/72 p-3.5">
              {isCustomTab ? (
                <AddTransactionCustomTradeFields
                  form={form}
                  minTradeDate={minTradeDate}
                  maxTradeDate={maxTradeDate}
                  displayCurrency={customCurrency?.trim().toUpperCase() ?? ""}
                  cashImpactPreview={cashImpactPreview}
                  cashBalanceOnDate={cashBalanceOnDate}
                  availableCashNow={availableCashNow}
                  availableCashOnTradeDate={availableCashOnTradeDate}
                  isPortfolioBalanceLoading={isCurrentPortfolioBalanceLoading}
                  portfolioBalanceErrorMessage={currentPortfolioBalanceErrorMessage}
                  tradeDate={date}
                  cashCurrency={cashCurrency}
                  consumeCash={consumeCash}
                  resolvedCashCurrency={resolvedCashCurrency}
                  onCashCurrencyChange={handleCashCurrencyChange}
                />
              ) : (
                <AddTransactionTradeFields
                  form={form}
                  minTradeDate={minTradeDate}
                  maxTradeDate={maxTradeDate}
                  isCashTab={isCashTab}
                  transactionType={type}
                  displayCurrency={displayCurrency}
                  historicalPriceAssist={historicalPriceAssist}
                  cashImpactPreview={cashImpactPreview}
                  cashBalanceOnDate={cashBalanceOnDate}
                  availableCashNow={availableCashNow}
                  availableCashOnTradeDate={availableCashOnTradeDate}
                  isPortfolioBalanceLoading={isCurrentPortfolioBalanceLoading}
                  portfolioBalanceErrorMessage={currentPortfolioBalanceErrorMessage}
                  tradeDate={date}
                  cashCurrency={cashCurrency}
                  consumeCash={consumeCash}
                  resolvedCashCurrency={resolvedCashCurrency}
                  onCashCurrencyChange={handleCashCurrencyChange}
                />
              )}
            </div>

            <div className="rounded-md border border-dashed border-border/65 bg-background/72 p-3.5">
              <AddTransactionNotesField
                form={form}
                variant={isCustomTab ? "custom" : "default"}
              />
            </div>
          </section>

          <AddTransactionSidebarSummary
            form={form}
            displayCurrency={displayCurrency}
            fee={fee}
            price={price}
            quantity={quantity}
            type={type}
            isCustomTab={isCustomTab}
            selectedInstrument={selectedInstrument}
          />
        </div>
      )}
    </div>
  );
}
