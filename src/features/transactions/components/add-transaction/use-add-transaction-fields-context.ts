"use client";

import { parseISO } from "date-fns";
import { useWatch, type UseFormReturn } from "react-hook-form";

import type { InstrumentSearchResult } from "../../lib/instrument-search";
import { type CashCurrency } from "../../lib/system-currencies";
import { getTradeDateLowerBound } from "../../lib/trade-date";
import type { FormValues } from "../AddTransactionDialogContent";
import type { AssetTab } from "./constants";
import { buildEmptyBalances } from "./constants";
import {
  deriveAvailableAssetQuantity,
  deriveDisplayCurrency,
  deriveResolvedCashCurrency,
} from "./form-derivations";
import { useCashBalanceOnDate } from "./use-cash-balance-on-date";
import { useCashImpactPreview } from "./use-cash-impact-preview";
import { useHistoricalPriceAssist } from "./useHistoricalPriceAssist";
import { useSellQuantityGuard } from "./use-sell-quantity-guard";

type Params = Readonly<{
  form: UseFormReturn<FormValues>;
  selectedInstrument: InstrumentSearchResult | null;
  activeTab: AssetTab;
  forcedPortfolioId: string | null;
  initialCashCurrency: CashCurrency;
  cashBalancesByPortfolio: Readonly<Record<string, Readonly<Record<string, string>>>>;
  assetBalancesByPortfolio: Readonly<Record<string, Readonly<Record<string, string>>>>;
  loadingPortfolioIds: readonly string[];
  balanceErrorMessagesByPortfolio: Readonly<Record<string, string>>;
}>;

export function useAddTransactionFieldsContext({
  form,
  selectedInstrument,
  activeTab,
  forcedPortfolioId,
  initialCashCurrency,
  cashBalancesByPortfolio,
  assetBalancesByPortfolio,
  loadingPortfolioIds,
  balanceErrorMessagesByPortfolio,
}: Params) {
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
  const hasCurrentPortfolioBalances = Boolean(cashBalancesByPortfolio[resolvedPortfolioId]);
  const isCurrentPortfolioBalanceLoading = loadingPortfolioIds.includes(resolvedPortfolioId);
  const currentPortfolioBalanceErrorMessage =
    balanceErrorMessagesByPortfolio[resolvedPortfolioId] ?? null;
  const cashBalances = hasCurrentPortfolioBalances
    ? cashBalancesByPortfolio[resolvedPortfolioId] ?? buildEmptyBalances()
    : null;
  const availableCashNow = cashBalances?.[resolvedCashCurrency] ?? null;

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

  const availableCashOnTradeDate =
    cashBalanceOnDate.availableCashOnDate ?? availableCashNow;
  const availableAssetQuantity = hasCurrentPortfolioBalances
    ? deriveAvailableAssetQuantity({
        selectedInstrument,
        type,
        isCashTab,
        resolvedPortfolioId,
        assetBalancesByPortfolio,
      })
    : null;
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
    hasCurrentPortfolioBalances,
  });

  return {
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
    hasCurrentPortfolioBalances,
    isCurrentPortfolioBalanceLoading,
    currentPortfolioBalanceErrorMessage,
    availableCashNow,
    cashBalanceOnDate,
    availableCashOnTradeDate,
    availableAssetQuantity,
    displayCurrency,
    cashImpactPreview,
    historicalPriceAssist,
  };
}
