import type { DailyChartPoint, EpsTtmEvent, StockChartPoint } from "./types";

const toNumberOrNull = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export function buildPeOverlaySeries(
  points: readonly DailyChartPoint[],
  epsEvents: readonly EpsTtmEvent[]
): readonly StockChartPoint[] {
  const sortedEpsEvents = [...epsEvents].sort((left, right) =>
    left.periodEndDate.localeCompare(right.periodEndDate)
  );
  let eventCursor = 0;
  let epsAsOf: number | null = null;

  return points.map((point) => {
    while (
      eventCursor < sortedEpsEvents.length &&
      sortedEpsEvents[eventCursor].periodEndDate <= point.date
    ) {
      epsAsOf = sortedEpsEvents[eventCursor].epsTtm;
      eventCursor += 1;
    }

    const price = toNumberOrNull(point.adjClose ?? point.close ?? point.price);
    if (price === null) {
      return { t: point.time, price: null, pe: null, peLabel: "-" };
    }

    if (epsAsOf === null) {
      return { t: point.time, price, pe: null, peLabel: "-" };
    }

    if (epsAsOf <= 0) {
      return { t: point.time, price, pe: null, peLabel: "N/M" };
    }

    return {
      t: point.time,
      price,
      pe: price / epsAsOf,
      peLabel: null,
    };
  });
}
