export type Currency = "USD" | "PLN";

export type Money = Readonly<{
  amount: number;
  currency: Currency;
}>;

export type Holding = Readonly<{
  symbol: string;
  name: string;
  shares: number;
  price: Money;
  dayChangePct: number;
}>;

export type FxRate = Readonly<{
  base: Currency;
  quote: Currency;
  rate: number;
}>;

export const mockHoldingsUsd: readonly Holding[] = [
  {
    symbol: "AAPL",
    name: "Apple",
    shares: 14,
    price: { amount: 195.24, currency: "USD" },
    dayChangePct: 0.012,
  },
  {
    symbol: "MSFT",
    name: "Microsoft",
    shares: 8,
    price: { amount: 411.02, currency: "USD" },
    dayChangePct: -0.006,
  },
  {
    symbol: "NVDA",
    name: "NVIDIA",
    shares: 6,
    price: { amount: 598.67, currency: "USD" },
    dayChangePct: 0.021,
  },
  {
    symbol: "TSLA",
    name: "Tesla",
    shares: 10,
    price: { amount: 233.18, currency: "USD" },
    dayChangePct: -0.018,
  },
];

export const mockUsdPln: FxRate = { base: "USD", quote: "PLN", rate: 4.12 };

