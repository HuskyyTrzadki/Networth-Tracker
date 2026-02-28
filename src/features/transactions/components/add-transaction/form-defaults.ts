import { format } from "date-fns";

import { DEFAULT_CUSTOM_ASSET_TYPE } from "../../lib/custom-asset-types";
import type { InstrumentSearchResult } from "../../lib/instrument-search";
import {
  SUPPORTED_CASH_CURRENCIES,
  isSupportedCashCurrency,
  type CashCurrency,
} from "../../lib/system-currencies";
import { resolveInitialTab, type AssetTab } from "./constants";
import type { FormValues } from "../AddTransactionDialogContent";

type PortfolioOption = Readonly<{ id: string; baseCurrency: string }>;

type ResolveInitialCashCurrencyInput = Readonly<{
  initialInstrument?: InstrumentSearchResult;
  portfolios: readonly PortfolioOption[];
  initialPortfolioId: string;
}>;

type BuildDefaultValuesInput = Readonly<{
  initialValues?: Partial<FormValues>;
  initialInstrument?: InstrumentSearchResult;
  initialPortfolioId: string;
  initialCashCurrency: CashCurrency;
}>;

export const resolveDialogInitialTab = (
  initialValues?: Partial<FormValues>,
  initialInstrument?: InstrumentSearchResult
): AssetTab => initialValues?.assetMode ?? resolveInitialTab(initialInstrument);

export const resolveInitialCashCurrency = ({
  initialInstrument,
  portfolios,
  initialPortfolioId,
}: ResolveInitialCashCurrencyInput): CashCurrency => {
  const initialPortfolio = portfolios.find(
    (portfolio) => portfolio.id === initialPortfolioId
  );
  const initialInstrumentCurrency =
    initialInstrument && isSupportedCashCurrency(initialInstrument.currency)
      ? initialInstrument.currency
      : null;

  return (
    initialInstrumentCurrency ??
    (initialPortfolio && isSupportedCashCurrency(initialPortfolio.baseCurrency)
      ? initialPortfolio.baseCurrency
      : SUPPORTED_CASH_CURRENCIES[0]) ??
    "USD"
  );
};

export const buildAddTransactionDefaultValues = ({
  initialValues,
  initialInstrument,
  initialPortfolioId,
  initialCashCurrency,
}: BuildDefaultValuesInput): FormValues => {
  const initialCashflowType =
    initialInstrument?.instrumentType === "CURRENCY"
      ? (initialValues?.type === "SELL" ? "WITHDRAWAL" : "DEPOSIT")
      : undefined;

  return {
    assetMode: resolveDialogInitialTab(initialValues, initialInstrument),
    type: "BUY",
    portfolioId: initialPortfolioId,
    assetId: initialInstrument?.id ?? "",
    currency: initialInstrument?.currency ?? "",
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
  };
};
