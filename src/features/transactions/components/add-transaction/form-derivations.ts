import type { InstrumentSearchResult } from "../../lib/instrument-search";
import type { TransactionType } from "../../lib/add-transaction-form-schema";
import {
  isSupportedCashCurrency,
  type CashCurrency,
} from "../../lib/system-currencies";

type AssetBalancesByPortfolio = Readonly<
  Record<string, Readonly<Record<string, string>>>
>;

export function deriveResolvedCashCurrency(
  cashCurrency: string,
  initialCashCurrency: CashCurrency
): CashCurrency {
  return isSupportedCashCurrency(cashCurrency)
    ? (cashCurrency as CashCurrency)
    : initialCashCurrency;
}

export function deriveAvailableAssetQuantity(input: Readonly<{
  selectedInstrument: InstrumentSearchResult | null;
  type: TransactionType;
  isCashTab: boolean;
  resolvedPortfolioId: string;
  assetBalancesByPortfolio: AssetBalancesByPortfolio;
}>): string | null {
  const { selectedInstrument, type, isCashTab, resolvedPortfolioId, assetBalancesByPortfolio } =
    input;

  if (!selectedInstrument || type !== "SELL" || isCashTab) {
    return null;
  }

  return assetBalancesByPortfolio[resolvedPortfolioId]?.[selectedInstrument.id] ?? "0";
}

export function deriveDisplayCurrency(
  selectedInstrument: InstrumentSearchResult | null,
  currency: string
) {
  return selectedInstrument?.currency ?? currency ?? "";
}
