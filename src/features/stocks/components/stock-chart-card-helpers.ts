import type {
  StockChartOverlay,
  StockChartRange,
  StockChartResponse,
} from "../server/types";
export {
  formatEps,
  formatLabelDate,
  formatPe,
  formatPrice,
  formatRawOverlayAxis,
  formatRevenue,
  formatXAxisTick,
} from "./stock-chart-formatters";

export type StockChartMode = "trend" | "raw";
export type StockChartLegendItem = Readonly<{
  key: string;
  label: string;
  color: string;
}>;
export type OverlayAxisMeta = Readonly<{
  label: string | null;
  primaryOverlay: StockChartOverlay | null;
  domain: readonly [number, number] | undefined;
}>;

export const OVERLAY_KEYS = ["pe", "epsTtm", "revenueTtm"] as const;
const RAW_MODE_ALLOWED_OVERLAYS: readonly StockChartOverlay[] = ["pe", "epsTtm"];

export const OVERLAY_LABELS: Readonly<Record<StockChartOverlay, string>> = {
  pe: "PE",
  epsTtm: "EPS TTM",
  revenueTtm: "Przychody TTM",
};

export const OVERLAY_CONTROL_LABELS: Readonly<Record<StockChartOverlay, string>> = {
  pe: "Pokaż historyczne PE",
  epsTtm: "Pokaż EPS TTM",
  revenueTtm: "Pokaż przychody TTM",
};

export const OVERLAY_LINE_COLORS: Readonly<Record<StockChartOverlay, string>> = {
  pe: "#e11d48",
  epsTtm: "#0284c7",
  revenueTtm: "#d97706",
};
const PRICE_LINE_COLOR = "var(--chart-1)";

export const toOverlayRequestKey = (overlays: readonly StockChartOverlay[]) =>
  [...overlays].sort().join(",");

export const toChartModeRequestKey = (mode: StockChartMode) => mode;

export const normalizeOverlaysForMode = (
  mode: StockChartMode,
  overlays: readonly StockChartOverlay[]
): StockChartOverlay[] => {
  const deduped = Array.from(new Set(overlays));
  if (mode === "trend") {
    return deduped;
  }

  const rawCompatible = deduped.filter((overlay) =>
    RAW_MODE_ALLOWED_OVERLAYS.includes(overlay)
  );

  if (rawCompatible.length <= 1) {
    return rawCompatible;
  }

  if (rawCompatible.includes("pe")) {
    return ["pe"];
  }

  return [rawCompatible[0]];
};

export const getNextOverlaySelection = (
  mode: StockChartMode,
  current: readonly StockChartOverlay[],
  overlay: StockChartOverlay,
  enabled: boolean
): StockChartOverlay[] => {
  const deduped = Array.from(new Set(current));

  if (mode === "raw") {
    if (!RAW_MODE_ALLOWED_OVERLAYS.includes(overlay)) {
      return normalizeOverlaysForMode("raw", deduped);
    }

    if (!enabled) {
      return deduped.filter((entry) => entry !== overlay);
    }
    return [overlay];
  }

  const next = enabled
    ? [...deduped, overlay]
    : deduped.filter((entry) => entry !== overlay);
  return Array.from(new Set(next));
};

type StockPoint = StockChartResponse["points"][number];

const findNonZeroBase = (
  points: readonly StockPoint[],
  pickValue: (point: StockPoint) => number | null
) =>
  points.find((point) => {
    const value = pickValue(point);
    return typeof value === "number" && Number.isFinite(value) && value !== 0;
  }) ?? null;

type ChartDataPoint = Readonly<{
  t: string;
  price: number | null;
  peRaw: number | null;
  epsTtmRaw: number | null;
  revenueTtmRaw: number | null;
  peLabel: "N/M" | "-" | null;
  peIndex: number | null;
  epsTtmIndex: number | null;
  revenueTtmIndex: number | null;
}>;

const PRICE_ZERO_BASELINE_RANGES: readonly StockChartRange[] = [
  "3Y",
  "5Y",
  "10Y",
  "ALL",
];

export const buildChartData = (points: readonly StockPoint[]): readonly ChartDataPoint[] => {
  const peBase = findNonZeroBase(points, (point) => point.pe)?.pe ?? null;
  const epsBase = findNonZeroBase(points, (point) => point.epsTtm)?.epsTtm ?? null;
  const revenueBase =
    findNonZeroBase(points, (point) => point.revenueTtm)?.revenueTtm ?? null;

  return points.map((point) => ({
    t: point.t,
    price: point.price,
    peRaw: point.pe,
    epsTtmRaw: point.epsTtm,
    revenueTtmRaw: point.revenueTtm,
    peLabel: point.peLabel,
    peIndex:
      peBase !== null &&
      typeof point.pe === "number" &&
      Number.isFinite(point.pe) &&
      peBase !== 0
        ? (point.pe / peBase) * 100
        : null,
    epsTtmIndex:
      epsBase !== null &&
      typeof point.epsTtm === "number" &&
      Number.isFinite(point.epsTtm) &&
      epsBase !== 0
        ? (point.epsTtm / epsBase) * 100
        : null,
    revenueTtmIndex:
      revenueBase !== null &&
      typeof point.revenueTtm === "number" &&
      Number.isFinite(point.revenueTtm) &&
      revenueBase !== 0
        ? (point.revenueTtm / revenueBase) * 100
        : null,
  }));
};

export const buildPriceAxisDomain = (
  range: StockChartRange,
  chartData: readonly ChartDataPoint[]
) => {
  const prices = chartData
    .map((point) => point.price)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  if (prices.length === 0) {
    return undefined;
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return undefined;
  }

  if (PRICE_ZERO_BASELINE_RANGES.includes(range)) {
    const maxPad = max === 0 ? 1 : Math.max(max * 0.08, 1);
    return [0, max + maxPad] as const;
  }

  if (min === max) {
    const pad = Math.max(Math.abs(min) * 0.04, 0.5);
    return [Math.max(0, min - pad), max + pad] as const;
  }

  const span = max - min;
  const pad = Math.max(span * 0.08, max * 0.002);
  const lower = Math.max(0, min - pad);
  const upper = max + pad;
  return [lower, upper] as const;
};

export const buildCoverageWarnings = (
  chart: StockChartResponse,
  activeOverlays: readonly StockChartOverlay[]
) =>
  activeOverlays
    .map((overlay) => {
      const coverage = chart.overlayCoverage[overlay];
      if (!chart.hasOverlayData[overlay]) {
        return `${OVERLAY_LABELS[overlay]}: brak danych`;
      }
      if (coverage.completeForRequestedRange) {
        return null;
      }
      return `${OVERLAY_LABELS[overlay]}: od ${coverage.firstPointDate ?? "-"}`;
    })
    .filter((value): value is string => value !== null);

export const toOverlayLineDataKey = (
  overlay: StockChartOverlay,
  mode: StockChartMode
) => {
  if (mode === "trend") {
    if (overlay === "pe") return "peIndex";
    if (overlay === "epsTtm") return "epsTtmIndex";
    return "revenueTtmIndex";
  }

  if (overlay === "pe") return "peRaw";
  if (overlay === "epsTtm") return "epsTtmRaw";
  return "revenueTtmRaw";
};

const toRawOverlayLabel = (overlay: StockChartOverlay) => {
  if (overlay === "pe") return "P/E";
  if (overlay === "epsTtm") return "EPS TTM";
  return "Revenue TTM";
};

const getPointOverlayValue = (
  point: ChartDataPoint,
  overlay: StockChartOverlay,
  mode: StockChartMode
) => {
  if (mode === "trend") {
    if (overlay === "pe") return point.peIndex;
    if (overlay === "epsTtm") return point.epsTtmIndex;
    return point.revenueTtmIndex;
  }

  if (overlay === "pe") return point.peRaw;
  if (overlay === "epsTtm") return point.epsTtmRaw;
  return point.revenueTtmRaw;
};

const computeDomain = (values: readonly number[]) => {
  if (values.length === 0) return undefined;

  const min = Math.min(...values);
  const max = Math.max(...values);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return undefined;

  if (min === max) {
    const pad = Math.max(Math.abs(min) * 0.08, 1);
    return [min - pad, max + pad] as const;
  }

  const pad = (max - min) * 0.08;
  return [min - pad, max + pad] as const;
};

export const buildOverlayAxisMeta = (
  mode: StockChartMode,
  chartData: readonly ChartDataPoint[],
  activeOverlays: readonly StockChartOverlay[],
  hasOverlayData: Readonly<Record<StockChartOverlay, boolean>>
): OverlayAxisMeta => {
  const visibleOverlays = activeOverlays.filter((overlay) => hasOverlayData[overlay]);
  if (visibleOverlays.length === 0) {
    return {
      label: null,
      primaryOverlay: null,
      domain: undefined,
    };
  }

  const primaryOverlay = visibleOverlays[0] ?? null;
  const values = visibleOverlays.flatMap((overlay) =>
    chartData
      .map((point) => getPointOverlayValue(point, overlay, mode))
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
  );

  return {
    label:
      mode === "trend"
        ? "Overlay (100=start)"
        : primaryOverlay
          ? toRawOverlayLabel(primaryOverlay)
          : null,
    primaryOverlay,
    domain: computeDomain(values),
  };
};

export const buildLegendItems = (
  mode: StockChartMode,
  activeOverlays: readonly StockChartOverlay[],
  hasOverlayData: Readonly<Record<StockChartOverlay, boolean>>
): readonly StockChartLegendItem[] => {
  const overlaySuffix = mode === "trend" ? " (100=start)" : "";

  const overlayItems = activeOverlays
    .filter((overlay) => hasOverlayData[overlay])
    .map((overlay) => ({
      key: overlay,
      label: `${OVERLAY_LABELS[overlay]}${overlaySuffix}`,
      color: OVERLAY_LINE_COLORS[overlay],
    }));

  return [
    {
      key: "price",
      label: "Cena",
      color: PRICE_LINE_COLOR,
    },
    ...overlayItems,
  ];
};
