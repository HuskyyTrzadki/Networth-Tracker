export const STOCK_CHART_RANGES = [
  "1D",
  "1M",
  "3M",
  "6M",
  "1Y",
  "3Y",
  "5Y",
  "10Y",
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
  inPortfolio: boolean;
  isFavorite: boolean;
  isHydrating?: boolean;
  currency: string;
  price: string | null;
  previewChart: readonly Readonly<{
    date: string;
    price: number;
  }>[];
  tradeMarkers: readonly StockTradeMarker[];
  asOf: string | null;
}>;

export const STOCK_SCREENER_PREVIEW_RANGES = ["1M", "3M", "6M", "12M"] as const;

export type StockScreenerPreviewRange = (typeof STOCK_SCREENER_PREVIEW_RANGES)[number];

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

export type StockValuationMetric = "peTtm" | "priceToSales" | "priceToBook";

export type StockValuationRangeContext = Readonly<{
  metric: StockValuationMetric;
  current: number | null;
  min: number | null;
  max: number | null;
  median: number | null;
  percentile: number | null;
  pointsCount: number;
  coverageStart: string | null;
  coverageEnd: string | null;
  isTruncated: boolean;
  interpretation:
    | "HISTORY_LOW"
    | "HISTORY_MID"
    | "HISTORY_HIGH"
    | "INSUFFICIENT_HISTORY"
    | "NO_DATA";
}>;

export type StockValuationHistoryPoint = Readonly<{
  t: string;
  peTtm: number | null;
  priceToSales: number | null;
  priceToBook: number | null;
}>;

export type EpsTtmEvent = Readonly<{
  periodEndDate: string;
  epsTtm: number | null;
}>;

export type FundamentalSeriesMetric =
  | "eps_ttm"
  | "revenue_ttm"
  | "shares_outstanding"
  | "book_value";

export type FundamentalSeriesPeriodType =
  | "TTM"
  | "TTM_PROXY_ANNUAL"
  | "POINT_IN_TIME"
  | "POINT_IN_TIME_ANNUAL";

export type FundamentalSeriesSource =
  | "trailing"
  | "quarterly_rollup"
  | "annual_proxy"
  | "quarterly_balance_sheet"
  | "annual_balance_sheet";

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

export type StockTradeMarkerTrade = Readonly<{
  id: string;
  tradeDate: string;
  side: "BUY" | "SELL";
  price: number;
  quantity: number;
  portfolioId: string;
  portfolioName: string;
}>;

export type StockTradeMarkerPortfolioSummary = Readonly<{
  portfolioId: string;
  portfolioName: string;
  side: "BUY" | "SELL";
  netQuantity: number;
  grossNotional: number;
  tradeCount: number;
}>;

export type StockTradeMarker = Readonly<{
  id: string;
  tradeDate: string;
  side: "BUY" | "SELL";
  netQuantity: number;
  weightedPrice: number;
  grossNotional: number;
  buyQuantity: number;
  sellQuantity: number;
  buyNotional: number;
  sellNotional: number;
  tradeCount: number;
  portfolios: readonly StockTradeMarkerPortfolioSummary[];
  trades: readonly StockTradeMarkerTrade[];
}>;
