export type InstrumentOption = Readonly<{
  id: string;
  ticker: string;
  name: string;
  currency: "USD" | "PLN";
}>;

export const instrumentOptions: readonly InstrumentOption[] = [
  {
    id: "a987e7d4-3c70-4e1c-9b9b-3e8acb2f7b05",
    ticker: "AAPL",
    name: "Apple Inc.",
    currency: "USD",
  },
  {
    id: "f6a6c11b-90de-4f25-9b7e-3f5a43db1b4f",
    ticker: "BTC",
    name: "Bitcoin",
    currency: "USD",
  },
  {
    id: "0d35a0e9-6c22-44df-9d65-b0f4f3f2b5a2",
    ticker: "XTB",
    name: "XTB S.A.",
    currency: "PLN",
  },
] as const;
