export const STOCK_CHART_RANGES = [
  "1D",
  "1M",
  "3M",
  "6M",
  "1Y",
  "5Y",
  "ALL",
] as const;

export type StockChartRange = (typeof STOCK_CHART_RANGES)[number];

export type StockScreenerCard = Readonly<{
  providerKey: string;
  symbol: string;
  name: string;
  logoUrl: string | null;
  currency: string;
  price: string | null;
  dayChangePercent: number | null;
  asOf: string | null;
}>;

export type StockValuationSummary = Readonly<{
  providerKey: string;
  marketCap: number | null;
  peTtm: number | null;
  priceToSales: number | null;
  evToEbitda: number | null;
  priceToBook: number | null;
  profitMargin: number | null;
  operatingMargin: number | null;
  quarterlyEarningsYoy: number | null;
  quarterlyRevenueYoy: number | null;
  cash: number | null;
  debt: number | null;
  dividendYield: number | null;
  payoutRatio: number | null;
  payoutDate: string | null;
  asOf: string | null;
  fetchedAt: string | null;
}>;

export type EpsTtmEvent = Readonly<{
  periodEndDate: string;
  epsTtm: number | null;
}>;

export type DailyChartPoint = Readonly<{
  time: string;
  date: string;
  currency: string | null;
  timezone: string;
  close: number | null;
  adjClose: number | null;
  price: number | null;
}>;

export type IntradayChartPoint = Readonly<{
  time: string;
  currency: string | null;
  timezone: string;
  price: number | null;
}>;

export type StockChartPoint = Readonly<{
  t: string;
  price: number | null;
  pe: number | null;
  peLabel: "N/M" | "-" | null;
}>;

export type StockChartResponse = Readonly<{
  providerKey: string;
  requestedRange: StockChartRange;
  resolvedRange: StockChartRange;
  timezone: string;
  currency: string | null;
  hasIntraday: boolean;
  hasPe: boolean;
  points: readonly StockChartPoint[];
}>;
