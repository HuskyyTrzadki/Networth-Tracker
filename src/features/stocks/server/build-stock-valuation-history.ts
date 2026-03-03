import type {
  DailyChartPoint,
  FundamentalSeriesEvent,
  StockValuationHistoryPoint,
} from "./types";
import { toFiniteNumber } from "./value-normalizers";

type BuildStockValuationHistoryOptions = Readonly<{
  epsEvents: readonly FundamentalSeriesEvent[];
  revenueEvents: readonly FundamentalSeriesEvent[];
  sharesOutstandingEvents: readonly FundamentalSeriesEvent[];
  bookValueEvents: readonly FundamentalSeriesEvent[];
}>;

const sortEventsByDate = (events: readonly FundamentalSeriesEvent[]) =>
  [...events].sort((left, right) =>
    left.periodEndDate.localeCompare(right.periodEndDate)
  );

const createAsOfResolver = (events: readonly FundamentalSeriesEvent[]) => {
  const sorted = sortEventsByDate(events);
  let cursor = 0;
  let currentValue: number | null = null;

  return (date: string) => {
    while (cursor < sorted.length && sorted[cursor].periodEndDate <= date) {
      currentValue = toFiniteNumber(sorted[cursor].value);
      cursor += 1;
    }

    return currentValue;
  };
};

const resolvePrice = (point: DailyChartPoint) =>
  toFiniteNumber(point.adjClose ?? point.close ?? point.price);

const toPe = (price: number | null, epsTtm: number | null) => {
  if (price === null || epsTtm === null || epsTtm <= 0) return null;
  return price / epsTtm;
};

const toPriceRatio = (
  price: number | null,
  totalValue: number | null,
  sharesOutstanding: number | null
) => {
  if (
    price === null ||
    totalValue === null ||
    sharesOutstanding === null ||
    totalValue <= 0 ||
    sharesOutstanding <= 0
  ) {
    return null;
  }

  return (price * sharesOutstanding) / totalValue;
};

export function buildStockValuationHistory(
  points: readonly DailyChartPoint[],
  options: BuildStockValuationHistoryOptions
): readonly StockValuationHistoryPoint[] {
  const resolveEpsAsOf = createAsOfResolver(options.epsEvents);
  const resolveRevenueAsOf = createAsOfResolver(options.revenueEvents);
  const resolveSharesAsOf = createAsOfResolver(options.sharesOutstandingEvents);
  const resolveBookValueAsOf = createAsOfResolver(options.bookValueEvents);

  return points.map((point) => {
    const price = resolvePrice(point);
    const epsTtm = resolveEpsAsOf(point.date);
    const revenueTtm = resolveRevenueAsOf(point.date);
    const sharesOutstanding = resolveSharesAsOf(point.date);
    const bookValue = resolveBookValueAsOf(point.date);

    return {
      t: point.time,
      peTtm: toPe(price, epsTtm),
      priceToSales: toPriceRatio(price, revenueTtm, sharesOutstanding),
      priceToBook: toPriceRatio(price, bookValue, sharesOutstanding),
    } satisfies StockValuationHistoryPoint;
  });
}
