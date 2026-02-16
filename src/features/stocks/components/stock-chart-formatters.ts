import type { StockChartOverlay, StockChartRange } from "../server/types";

export const formatPrice = (value: number | null, currency: string | null) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  if (!currency) {
    return new Intl.NumberFormat("pl-PL", {
      maximumFractionDigits: 2,
    }).format(value);
  }
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatPe = (value: number | null) =>
  typeof value === "number" && Number.isFinite(value)
    ? new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 }).format(value)
    : "-";

export const formatEps = (value: number | null) =>
  typeof value === "number" && Number.isFinite(value)
    ? new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 }).format(value)
    : "-";

export const formatRevenue = (value: number | null, currency: string | null) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  if (!currency) {
    return new Intl.NumberFormat("pl-PL", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value);
  }
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatRawOverlayAxis = (
  value: number,
  overlay: StockChartOverlay | null,
  currency: string | null
) => {
  if (!Number.isFinite(value)) return "";
  if (!overlay) return "";

  if (overlay === "pe") {
    return new Intl.NumberFormat("pl-PL", {
      maximumFractionDigits: 1,
    }).format(value);
  }

  if (overlay === "epsTtm") {
    return new Intl.NumberFormat("pl-PL", {
      maximumFractionDigits: 2,
    }).format(value);
  }

  return formatRevenue(value, currency);
};

export const formatLabelDate = (value: string) =>
  new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: value.includes("T") ? "2-digit" : undefined,
    minute: value.includes("T") ? "2-digit" : undefined,
  }).format(new Date(value));

export const formatXAxisTick = (value: string, range: StockChartRange) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  if (range === "1D") {
    return new Intl.DateTimeFormat("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  if (range === "1M" || range === "3M" || range === "6M") {
    return new Intl.DateTimeFormat("pl-PL", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    }).format(date);
  }

  if (range === "1Y") {
    return new Intl.DateTimeFormat("pl-PL", {
      month: "short",
      year: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
  }).format(date);
};
