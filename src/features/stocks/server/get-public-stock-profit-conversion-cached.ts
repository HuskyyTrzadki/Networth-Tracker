import { cacheLife, cacheTag } from "next/cache";

import { getFundamentalTimeSeriesCached } from "./get-fundamental-time-series-cached";
import { createPublicStocksSupabaseClient } from "./create-public-stocks-supabase-client";
import type {
  FundamentalSeriesEvent,
  FundamentalSeriesMetric,
} from "./types";

const QUARTERLY_LOOKBACK_DAYS = 540;

export type StockProfitConversionSnapshot = Readonly<{
  periodEndDate: string;
  revenue: number;
  costOfRevenue: number;
  operatingExpense: number;
  operatingIncome: number;
  taxesAndOther: number;
  netIncome: number;
  grossMarginPercent: number;
  operatingMarginPercent: number;
  netMarginPercent: number;
  costOfRevenuePercent: number;
  operatingExpensePercent: number;
  taxesAndOtherPercent: number;
}>;

const subtractDays = (date: Date, days: number) => {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() - days);
  return copy.toISOString().slice(0, 10);
};

const isQuarterlyEvent = (event: FundamentalSeriesEvent) =>
  event.periodType === "FLOW_QUARTERLY" &&
  typeof event.value === "number" &&
  Number.isFinite(event.value);

const toQuarterlyMap = (events: readonly FundamentalSeriesEvent[]) =>
  events.reduce<Map<string, number>>((result, event) => {
    if (!isQuarterlyEvent(event) || event.value === null) {
      return result;
    }

    result.set(event.periodEndDate, event.value);
    return result;
  }, new Map<string, number>());

const toPercent = (value: number, total: number) =>
  total > 0 ? (value / total) * 100 : 0;

const buildSnapshotFromMaps = (params: Readonly<{
  revenueByDate: Map<string, number>;
  costOfRevenueByDate: Map<string, number>;
  operatingIncomeByDate: Map<string, number>;
  netIncomeByDate: Map<string, number>;
}>): StockProfitConversionSnapshot | null => {
  const candidateDates = Array.from(params.revenueByDate.keys())
    .filter(
      (date) =>
        params.costOfRevenueByDate.has(date) &&
        params.operatingIncomeByDate.has(date) &&
        params.netIncomeByDate.has(date)
    )
    .sort((left, right) => right.localeCompare(left));

  for (const periodEndDate of candidateDates) {
    const revenue = params.revenueByDate.get(periodEndDate) ?? null;
    const costOfRevenue = params.costOfRevenueByDate.get(periodEndDate) ?? null;
    const operatingIncome = params.operatingIncomeByDate.get(periodEndDate) ?? null;
    const netIncome = params.netIncomeByDate.get(periodEndDate) ?? null;

    if (
      revenue === null ||
      costOfRevenue === null ||
      operatingIncome === null ||
      netIncome === null ||
      !Number.isFinite(revenue) ||
      !Number.isFinite(costOfRevenue) ||
      !Number.isFinite(operatingIncome) ||
      !Number.isFinite(netIncome) ||
      revenue === 0 ||
      revenue <= 0
    ) {
      continue;
    }

    const operatingExpense = revenue - costOfRevenue - operatingIncome;
    const taxesAndOther = operatingIncome - netIncome;
    const tolerance = revenue * 0.02;

    if (costOfRevenue < 0 || operatingExpense < -tolerance || taxesAndOther < -tolerance) {
      continue;
    }

    const sanitizedOperatingExpense = Math.max(0, operatingExpense);
    const sanitizedTaxesAndOther = Math.max(0, taxesAndOther);

    return {
      periodEndDate,
      revenue,
      costOfRevenue,
      operatingExpense: sanitizedOperatingExpense,
      operatingIncome,
      taxesAndOther: sanitizedTaxesAndOther,
      netIncome,
      grossMarginPercent: toPercent(revenue - costOfRevenue, revenue),
      operatingMarginPercent: toPercent(operatingIncome, revenue),
      netMarginPercent: toPercent(netIncome, revenue),
      costOfRevenuePercent: toPercent(costOfRevenue, revenue),
      operatingExpensePercent: toPercent(sanitizedOperatingExpense, revenue),
      taxesAndOtherPercent: toPercent(sanitizedTaxesAndOther, revenue),
    };
  }

  return null;
};

const PROFIT_CONVERSION_METRICS = [
  "total_revenue",
  "cost_of_revenue",
  "operating_income",
  "net_income",
] as const satisfies readonly FundamentalSeriesMetric[];

export const getPublicStockProfitConversionCached = async (
  providerKey: string
): Promise<StockProfitConversionSnapshot | null> => {
  "use cache";

  cacheLife("days");
  cacheTag(`stock:${providerKey}`);
  cacheTag(`stock:${providerKey}:fundamentals`);
  cacheTag(`stock:${providerKey}:profit-conversion`);

  try {
    const supabase = createPublicStocksSupabaseClient();
    const periodStartDate = subtractDays(new Date(), QUARTERLY_LOOKBACK_DAYS);
    const [
      revenueEvents,
      costOfRevenueEvents,
      operatingIncomeEvents,
      netIncomeEvents,
    ] = await Promise.all(
      PROFIT_CONVERSION_METRICS.map((metric) =>
        getFundamentalTimeSeriesCached(supabase, providerKey, metric, periodStartDate)
      )
    );

    return buildSnapshotFromMaps({
      revenueByDate: toQuarterlyMap(revenueEvents),
      costOfRevenueByDate: toQuarterlyMap(costOfRevenueEvents),
      operatingIncomeByDate: toQuarterlyMap(operatingIncomeEvents),
      netIncomeByDate: toQuarterlyMap(netIncomeEvents),
    });
  } catch (error) {
    console.error("[stocks][profit-conversion] Failed to load Yahoo profit conversion", {
      providerKey,
      error,
    });
    return null;
  }
};
