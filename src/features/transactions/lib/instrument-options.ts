export type InstrumentOption = Readonly<{
  id: string;
  ticker: string;
  symbol: string;
  name: string;
  currency: "USD" | "PLN";
  provider: "yahoo";
  providerKey: string;
  exchange?: string;
  region?: string;
}>;

export const instrumentOptions: readonly InstrumentOption[] = [
  {
    id: "yahoo:AAPL",
    ticker: "AAPL",
    symbol: "AAPL",
    name: "Apple Inc.",
    currency: "USD",
    provider: "yahoo",
    providerKey: "AAPL",
    exchange: "NASDAQ",
    region: "US",
  },
  {
    id: "yahoo:BTC-USD",
    ticker: "BTC",
    symbol: "BTC-USD",
    name: "Bitcoin",
    currency: "USD",
    provider: "yahoo",
    providerKey: "BTC-USD",
    exchange: "CRYPTO",
    region: "GLOBAL",
  },
  {
    id: "yahoo:XTB.WA",
    ticker: "XTB",
    symbol: "XTB.WA",
    name: "XTB S.A.",
    currency: "PLN",
    provider: "yahoo",
    providerKey: "XTB.WA",
    exchange: "WSE",
    region: "PL",
  },
] as const;
