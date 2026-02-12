export const STOCK_CHART_RANGES = [
  "1D",
  "1M",
  "3M",
  "6M",
  "1Y",
  "3Y",
  "5Y",
  "ALL",
] as const;

export type StockChartRange = (typeof STOCK_CHART_RANGES)[number];

export const STOCK_CHART_OVERLAYS = ["pe", "epsTtm", "revenueTtm"] as const;

export type StockChartOverlay = (typeof STOCK_CHART_OVERLAYS)[number];

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

export type FundamentalSeriesMetric = "eps_ttm" | "revenue_ttm";

export type FundamentalSeriesPeriodType = "TTM" | "TTM_PROXY_ANNUAL";

export type FundamentalSeriesSource =
  | "trailing"
  | "quarterly_rollup"
  | "annual_proxy";

export type FundamentalSeriesEvent = Readonly<{
  periodEndDate: string;
  value: number | null;
  periodType: FundamentalSeriesPeriodType;
  source: FundamentalSeriesSource;
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
  epsTtm: number | null;
  revenueTtm: number | null;
  pe: number | null;
  peLabel: "N/M" | "-" | null;
}>;

export type StockOverlayCoverage = Readonly<{
  firstPointDate: string | null;
  lastPointDate: string | null;
  completeForRequestedRange: boolean;
}>;

export type StockOverlayCoverageMap = Readonly<
  Record<StockChartOverlay, StockOverlayCoverage>
>;

export type StockOverlayAvailabilityMap = Readonly<
  Record<StockChartOverlay, boolean>
>;

export type StockChartResponse = Readonly<{
  providerKey: string;
  requestedRange: StockChartRange;
  resolvedRange: StockChartRange;
  timezone: string;
  currency: string | null;
  hasIntraday: boolean;
  hasPe: boolean;
  activeOverlays: readonly StockChartOverlay[];
  hasOverlayData: StockOverlayAvailabilityMap;
  overlayCoverage: StockOverlayCoverageMap;
  points: readonly StockChartPoint[];
}>;
