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
