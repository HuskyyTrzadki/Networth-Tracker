"use client";

import { parseISO } from "date-fns";
import { useWatch, type UseFormReturn } from "react-hook-form";

import { useHistoricalPriceAssist } from "./useHistoricalPriceAssist";
import { useCashImpactPreview } from "./use-cash-impact-preview";
import { useCashBalanceOnDate } from "./use-cash-balance-on-date";
import { useSellQuantityGuard } from "./use-sell-quantity-guard";
import { AddTransactionInstrumentSection } from "./AddTransactionInstrumentSection";
import { AddTransactionCustomTradeFields } from "./AddTransactionCustomTradeFields";
import { AddTransactionTradeFields } from "./AddTransactionTradeFields";
import { AddTransactionSidebarSummary } from "./AddTransactionSidebarSummary";
import {
  deriveAvailableAssetQuantity,
  deriveDisplayCurrency,
  deriveResolvedCashCurrency,
} from "./form-derivations";
import type { InstrumentSearchClient } from "../../client/search-instruments";
import type { InstrumentSearchResult } from "../../lib/instrument-search";
import { isSupportedCashCurrency, type CashCurrency } from "../../lib/system-currencies";
import { getTradeDateLowerBound } from "../../lib/trade-date";
import { buildEmptyBalances, type AssetTab } from "./constants";
import { applyCashCurrencyChange, applyCashTabState, applyCustomTabState, applyMarketTabState } from "./tab-state";
import type { FormValues } from "../AddTransactionDialogContent";

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
  forcedPortfolioId,
  initialCashCurrency,
}: Readonly<{
  form: UseFormReturn<FormValues>;
  selectedInstrument: InstrumentSearchResult | null;
  setSelectedInstrument: (next: InstrumentSearchResult | null) => void;
  activeTab: AssetTab;
  setActiveTab: (next: AssetTab) => void;
  searchClient?: InstrumentSearchClient;
  portfolios: readonly { id: string; name: string; baseCurrency: string }[];
  cashBalancesByPortfolio: Readonly<Record<string, Readonly<Record<string, string>>>>;
  assetBalancesByPortfolio: Readonly<Record<string, Readonly<Record<string, string>>>>;
  forcedPortfolioId: string | null;
  initialCashCurrency: CashCurrency;
}>) {
  const minTradeDate = parseISO(getTradeDateLowerBound());
  const maxTradeDate = new Date();
  const currency = useWatch({ control: form.control, name: "currency" });
  const consumeCash = useWatch({ control: form.control, name: "consumeCash" });
  const cashCurrency = useWatch({ control: form.control, name: "cashCurrency" });
  const portfolioId = useWatch({ control: form.control, name: "portfolioId" });
  const type = useWatch({ control: form.control, name: "type" });
  const quantity = useWatch({ control: form.control, name: "quantity" });
  const price = useWatch({ control: form.control, name: "price" });
  const fee = useWatch({ control: form.control, name: "fee" });
  const fxFee = useWatch({ control: form.control, name: "fxFee" });
  const date = useWatch({ control: form.control, name: "date" });
  const customCurrency = useWatch({ control: form.control, name: "customCurrency" });

  const isCashTab = activeTab === "CASH";
  const isCustomTab = activeTab === "CUSTOM";
  const resolvedPortfolioId = forcedPortfolioId ?? portfolioId;
  const resolvedCashCurrency = deriveResolvedCashCurrency(
    cashCurrency,
    initialCashCurrency
  );
  const cashBalances = cashBalancesByPortfolio[resolvedPortfolioId] ?? buildEmptyBalances();
  const availableCashNow = cashBalances[resolvedCashCurrency] ?? "0";
  const cashBalanceOnDate = useCashBalanceOnDate({
    enabled:
      consumeCash &&
      !isCashTab &&
      Boolean(resolvedPortfolioId) &&
      Boolean(resolvedCashCurrency) &&
      Boolean(date),
    portfolioId: resolvedPortfolioId,
    cashCurrency: resolvedCashCurrency,
    tradeDate: date,
  });
  const availableCashOnTradeDate = cashBalanceOnDate.availableCashOnDate ?? availableCashNow;
  const availableAssetQuantity = deriveAvailableAssetQuantity({
    selectedInstrument,
    type,
    isCashTab,
    resolvedPortfolioId,
    assetBalancesByPortfolio,
  });
  const displayCurrency = deriveDisplayCurrency(selectedInstrument, currency);
  const assetCurrency = isCustomTab
    ? (customCurrency?.trim().toUpperCase() ?? "")
    : (selectedInstrument?.currency ?? "");
  const cashImpactPreview = useCashImpactPreview({
    form,
    consumeCash,
    isCashTab,
    assetCurrency,
    resolvedCashCurrency,
    availableCashOnTradeDate,
    type,
    quantity,
    price,
    fee,
    fxFee,
  });
  const historicalPriceAssist = useHistoricalPriceAssist({
    enabled: !isCashTab && !isCustomTab,
    form,
    provider: selectedInstrument?.provider ?? null,
    providerKey: selectedInstrument?.providerKey ?? null,
    date,
    price,
  });
  useSellQuantityGuard({
    form,
    isCashTab,
    type,
    selectedInstrument,
    date,
    quantity,
    availableAssetQuantity,
  });

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

  const handlePortfolioChange = (nextPortfolioId: string) => {
    const nextPortfolio = portfolios.find(
      (portfolio) => portfolio.id === nextPortfolioId
    );
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

  return (
    <div className="flex-1 overflow-y-auto bg-muted/12 px-4 py-4 sm:px-6 sm:py-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="space-y-6 rounded-lg border border-border/75 bg-background p-4 sm:p-5">
          <AddTransactionInstrumentSection
            form={form}
            forcedPortfolioId={forcedPortfolioId}
            portfolios={portfolios}
            isCashTab={isCashTab}
            isCustomTab={isCustomTab}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onPortfolioChange={handlePortfolioChange}
            onTypeChange={handleTypeChange}
            resolvedCashCurrency={resolvedCashCurrency}
            onCashCurrencyChange={handleCashCurrencyChange}
            selectedInstrument={selectedInstrument}
            setSelectedInstrument={setSelectedInstrument}
            searchClient={searchClient}
            initialCashCurrency={initialCashCurrency}
            availableCashNow={availableCashNow}
            availableAssetQuantity={availableAssetQuantity}
          />

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
              tradeDate={date}
              cashCurrency={cashCurrency}
              consumeCash={consumeCash}
              resolvedCashCurrency={resolvedCashCurrency}
              onCashCurrencyChange={handleCashCurrencyChange}
            />
          )}
        </section>

        <AddTransactionSidebarSummary
          form={form}
          displayCurrency={displayCurrency}
          fee={fee}
          price={price}
          quantity={quantity}
          type={type}
          isCustomTab={isCustomTab}
        />
      </div>
    </div>
  );
}
