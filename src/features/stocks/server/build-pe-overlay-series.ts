import type { DailyChartPoint, EpsTtmEvent, StockChartPoint } from "./types";
import { toFiniteNumber } from "./value-normalizers";

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

    const price = toFiniteNumber(point.adjClose ?? point.close ?? point.price);
    if (price === null) {
      return {
        t: point.time,
        price: null,
        epsTtm: epsAsOf,
        revenueTtm: null,
        pe: null,
        peLabel: "-",
      };
    }

    if (epsAsOf === null) {
      return {
        t: point.time,
        price,
        epsTtm: null,
        revenueTtm: null,
        pe: null,
        peLabel: "-",
      };
    }

    if (epsAsOf <= 0) {
      return {
        t: point.time,
        price,
        epsTtm: epsAsOf,
        revenueTtm: null,
        pe: null,
        peLabel: "N/M",
      };
    }

    return {
      t: point.time,
      price,
      epsTtm: epsAsOf,
      revenueTtm: null,
      pe: price / epsAsOf,
      peLabel: null,
    };
  });
}
