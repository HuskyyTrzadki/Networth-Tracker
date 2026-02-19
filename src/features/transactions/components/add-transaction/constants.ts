import {
  formatCurrencyString,
  getCurrencyFormatter,
} from "@/lib/format-currency";

import type { InstrumentSearchResult } from "../../lib/instrument-search";
import {
  SUPPORTED_CASH_CURRENCIES,
  type CashCurrency,
} from "../../lib/system-currencies";

export type AssetTab = "MARKET" | "CASH" | "CUSTOM";

export const ASSET_TABS: ReadonlyArray<{
  value: AssetTab;
  label: string;
}> = [
  { value: "MARKET", label: "Rynek" },
  { value: "CASH", label: "Gotówka" },
  { value: "CUSTOM", label: "Nierynkowe" },
];

export const resolveInitialTab = (
  instrument?: InstrumentSearchResult
): AssetTab => {
  if (!instrument?.instrumentType) return "MARKET";
  if (instrument.instrumentType === "CURRENCY") return "CASH";
  return "MARKET";
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
