import {
  formatCurrencyString,
  getCurrencyFormatter,
} from "@/lib/format-currency";

import type { InstrumentSearchResult, InstrumentType } from "../../lib/instrument-search";
import {
  SUPPORTED_CASH_CURRENCIES,
  type CashCurrency,
} from "../../lib/system-currencies";

export type AssetTab = "EQUITY" | "CRYPTOCURRENCY" | "CASH";

export const ASSET_TABS: ReadonlyArray<{
  value: AssetTab;
  label: string;
  types: readonly InstrumentType[] | null;
}> = [
  { value: "EQUITY", label: "Akcje/ETF", types: ["EQUITY", "ETF"] },
  { value: "CRYPTOCURRENCY", label: "Krypto", types: ["CRYPTOCURRENCY"] },
  { value: "CASH", label: "Gotówka", types: null },
];

export const resolveInitialTab = (
  instrument?: InstrumentSearchResult
): AssetTab => {
  if (!instrument?.instrumentType) return "EQUITY";
  if (instrument.instrumentType === "CURRENCY") return "CASH";
  if (instrument.instrumentType === "CRYPTOCURRENCY") return "CRYPTOCURRENCY";
  return "EQUITY";
};

export const formatMoney = (value: string, currency: string) => {
  const formatter = getCurrencyFormatter(currency);
  if (!formatter) return `${value} ${currency}`;
  return formatCurrencyString(value, formatter) ?? `${value} ${currency}`;
};

export const buildEmptyBalances = () =>
  SUPPORTED_CASH_CURRENCIES.reduce(
    (acc, code) => {
      acc[code] = "0";
      return acc;
    },
    {} as Record<CashCurrency, string>
  );
