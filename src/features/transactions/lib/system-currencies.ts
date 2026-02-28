import type { InstrumentSearchResult } from "./instrument-search";

export const SUPPORTED_CASH_CURRENCIES = [
  "USD",
  "EUR",
  "PLN",
  "GBP",
  "CHF",
] as const;

export type CashCurrency = (typeof SUPPORTED_CASH_CURRENCIES)[number];

export const isSupportedCashCurrency = (value: string): value is CashCurrency =>
  SUPPORTED_CASH_CURRENCIES.includes(value as CashCurrency);

type CashInstrumentLike = Readonly<{
  instrumentType?: string | null;
  provider?: string | null;
}>;

export const isCashInstrumentLike = (value: CashInstrumentLike | null | undefined) => {
  if (!value) {
    return false;
  }

  return value.instrumentType === "CURRENCY" || value.provider === "system";
};

export const buildCashInstrument = (currency: CashCurrency): InstrumentSearchResult => {
  const code = currency.toUpperCase();

  return {
    id: `system:${code}`,
    provider: "system",
    providerKey: code,
    symbol: code,
    ticker: code,
    name: `Gotówka ${code}`,
    currency: code,
    instrumentType: "CURRENCY",
    exchange: undefined,
    region: undefined,
    logoUrl: null,
  };
};
