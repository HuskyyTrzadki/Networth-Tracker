import type { CompaniesMarketCapMetricSnapshot } from "@/features/market-data/server/companiesmarketcap/types";

import {
  fillOutsidePrimaryCoverage,
  mergeAnnualNumericHistory,
  pickYearEndValuesFromHistory,
} from "./annual-history-merge";
import type { DailyChartPoint, StockValuationHistoryPoint } from "./types";

type CompaniesMarketCapMetricMap = Readonly<{
  pe_ratio: CompaniesMarketCapMetricSnapshot | null;
  ps_ratio: CompaniesMarketCapMetricSnapshot | null;
}>;

type ValuationMetricKey = "peTtm" | "priceToSales";

const resolveMetricValue = (
  point: StockValuationHistoryPoint,
  metric: ValuationMetricKey
) => (metric === "peTtm" ? point.peTtm : point.priceToSales);

const extendMetric = (
  dailyPoints: readonly DailyChartPoint[],
  historyPoints: readonly StockValuationHistoryPoint[],
  metric: ValuationMetricKey,
  fallbackMetric: CompaniesMarketCapMetricSnapshot | null
) => {
  if (!fallbackMetric || fallbackMetric.annualHistory.length === 0) {
    return historyPoints.map((point) => resolveMetricValue(point, metric));
  }

  const primaryAnnualHistory = pickYearEndValuesFromHistory(historyPoints, {
    getDate: (point) => point.t.slice(0, 10),
    getValue: (point) => resolveMetricValue(point, metric),
  });
  const mergedAnnualHistory = mergeAnnualNumericHistory(
    primaryAnnualHistory,
    fallbackMetric.annualHistory
  );

  return fillOutsidePrimaryCoverage(
    dailyPoints.map((point) => point.date),
    historyPoints.map((point) => resolveMetricValue(point, metric)),
    mergedAnnualHistory
  );
};

export function buildBestAvailableValuationHistory(
  dailyPoints: readonly DailyChartPoint[],
  historyPoints: readonly StockValuationHistoryPoint[],
  fallbackMetrics: CompaniesMarketCapMetricMap
): readonly StockValuationHistoryPoint[] {
  const peValues = extendMetric(
    dailyPoints,
    historyPoints,
    "peTtm",
    fallbackMetrics.pe_ratio
  );
  const psValues = extendMetric(
    dailyPoints,
    historyPoints,
    "priceToSales",
    fallbackMetrics.ps_ratio
  );

  return historyPoints.map((point, index) => ({
    ...point,
    peTtm: peValues[index] ?? null,
    priceToSales: psValues[index] ?? null,
  }));
}
