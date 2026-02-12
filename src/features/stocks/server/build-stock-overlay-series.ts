import type {
  DailyChartPoint,
  FundamentalSeriesEvent,
  StockChartOverlay,
  StockChartPoint,
  StockOverlayAvailabilityMap,
  StockOverlayCoverageMap,
} from "./types";
import { toFiniteNumber } from "./value-normalizers";

type OverlaySeriesOptions = Readonly<{
  includePe: boolean;
  epsEvents: readonly FundamentalSeriesEvent[];
  revenueEvents: readonly FundamentalSeriesEvent[];
}>;

const toDateOnly = (iso: string) => iso.slice(0, 10);
const OVERLAYS: readonly StockChartOverlay[] = ["pe", "epsTtm", "revenueTtm"];

const EMPTY_AVAILABILITY: StockOverlayAvailabilityMap = {
  pe: false,
  epsTtm: false,
  revenueTtm: false,
};

const EMPTY_COVERAGE: StockOverlayCoverageMap = {
  pe: {
    firstPointDate: null,
    lastPointDate: null,
    completeForRequestedRange: false,
  },
  epsTtm: {
    firstPointDate: null,
    lastPointDate: null,
    completeForRequestedRange: false,
  },
  revenueTtm: {
    firstPointDate: null,
    lastPointDate: null,
    completeForRequestedRange: false,
  },
};

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

const buildPointWithoutPe = (
  point: DailyChartPoint,
  price: number | null,
  epsTtm: number | null,
  revenueTtm: number | null
): StockChartPoint => ({
  t: point.time,
  price,
  epsTtm,
  revenueTtm,
  pe: null,
  peLabel: null,
});

const buildPointWithPe = (
  point: DailyChartPoint,
  price: number | null,
  epsTtm: number | null,
  revenueTtm: number | null
): StockChartPoint => {
  if (price === null) {
    return {
      t: point.time,
      price: null,
      epsTtm,
      revenueTtm,
      pe: null,
      peLabel: "-",
    };
  }

  if (epsTtm === null) {
    return {
      t: point.time,
      price,
      epsTtm: null,
      revenueTtm,
      pe: null,
      peLabel: "-",
    };
  }

  if (epsTtm <= 0) {
    return {
      t: point.time,
      price,
      epsTtm,
      revenueTtm,
      pe: null,
      peLabel: "N/M",
    };
  }

  return {
    t: point.time,
    price,
    epsTtm,
    revenueTtm,
    pe: price / epsTtm,
    peLabel: null,
  };
};

export function buildStockOverlaySeries(
  points: readonly DailyChartPoint[],
  options: OverlaySeriesOptions
): readonly StockChartPoint[] {
  const resolveEpsAsOf = createAsOfResolver(options.epsEvents);
  const resolveRevenueAsOf = createAsOfResolver(options.revenueEvents);

  return points.map((point) => {
    const epsTtm = resolveEpsAsOf(point.date);
    const revenueTtm = resolveRevenueAsOf(point.date);
    const price = toFiniteNumber(point.adjClose ?? point.close ?? point.price);

    if (!options.includePe) {
      return buildPointWithoutPe(point, price, epsTtm, revenueTtm);
    }

    return buildPointWithPe(point, price, epsTtm, revenueTtm);
  });
}

const overlayValueAvailable = (
  point: StockChartPoint,
  overlay: StockChartOverlay
) => {
  if (overlay === "pe") {
    return point.pe !== null || point.peLabel === "N/M";
  }
  if (overlay === "epsTtm") {
    return point.epsTtm !== null;
  }
  return point.revenueTtm !== null;
};

export function buildOverlayCoverage(
  points: readonly StockChartPoint[],
  requestedStartDate: string
): Readonly<{
  hasOverlayData: StockOverlayAvailabilityMap;
  overlayCoverage: StockOverlayCoverageMap;
}> {
  if (points.length === 0) {
    return {
      hasOverlayData: EMPTY_AVAILABILITY,
      overlayCoverage: EMPTY_COVERAGE,
    };
  }
  const getCoverage = (overlay: StockChartOverlay) => {
    const availableDates = points
      .filter((point) => overlayValueAvailable(point, overlay))
      .map((point) => toDateOnly(point.t));
    const firstPointDate = availableDates[0] ?? null;
    const lastPointDate = availableDates[availableDates.length - 1] ?? null;

    return {
      firstPointDate,
      lastPointDate,
      completeForRequestedRange:
        firstPointDate !== null && firstPointDate <= requestedStartDate,
    };
  };

  const hasOverlayData = OVERLAYS.reduce<StockOverlayAvailabilityMap>(
    (result, overlay) => {
      const hasData = points.some((point) => overlayValueAvailable(point, overlay));
      return { ...result, [overlay]: hasData };
    },
    EMPTY_AVAILABILITY
  );

  const overlayCoverage = OVERLAYS.reduce<StockOverlayCoverageMap>(
    (result, overlay) => ({ ...result, [overlay]: getCoverage(overlay) }),
    EMPTY_COVERAGE
  );

  return {
    hasOverlayData,
    overlayCoverage,
  };
}
