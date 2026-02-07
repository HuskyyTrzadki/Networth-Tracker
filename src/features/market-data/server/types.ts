export type CurrencyCode = string;

export type InstrumentQuoteRequest = Readonly<{
  instrumentId: string;
  provider: "yahoo";
  providerKey: string;
}>;

export type InstrumentQuote = Readonly<{
  instrumentId: string;
  currency: CurrencyCode;
  price: string;
  asOf: string;
  fetchedAt: string;
}>;

export type InstrumentDailyPrice = Readonly<{
  instrumentId: string;
  currency: CurrencyCode;
  marketDate: string;
  exchangeTimezone: string;
  open: string | null;
  high: string | null;
  low: string | null;
  close: string;
  asOf: string;
  fetchedAt: string;
  isFilledFromPreviousSession: boolean;
}>;

export type FxPair = Readonly<{
  from: CurrencyCode;
  to: CurrencyCode;
}>;

export type FxRate = Readonly<{
  from: CurrencyCode;
  to: CurrencyCode;
  rate: string;
  asOf: string;
  fetchedAt: string;
  source?: "direct" | "inverted";
}>;

export type FxDailyRate = Readonly<{
  from: CurrencyCode;
  to: CurrencyCode;
  rateDate: string;
  rate: string;
  asOf: string;
  fetchedAt: string;
  source?: "direct" | "inverted";
  isFilledFromPreviousSession: boolean;
}>;

export type PolishCpiPoint = Readonly<{
  periodDate: string;
  // HICP index level for the month (not YoY rate).
  value: number;
  asOf: string;
  fetchedAt: string;
}>;
