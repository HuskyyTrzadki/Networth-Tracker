import type {
  TradingViewRevenueBreakdownRow,
  TradingViewRevenueBreakdownSnapshot,
} from "./types";

const NON_NUMERIC_MARKS = /[\u200E\u200F\u202A-\u202E\u2066-\u2069\u00A0\u202F\s]/g;
const EMPTY_MARKER = /^(?:-|—|–|N\/A)$/i;

const UNIT_MULTIPLIER: Readonly<Record<string, number>> = {
  K: 1e3,
  M: 1e6,
  B: 1e9,
  T: 1e12,
};

const toNumber = (input: string) => {
  const commaIndex = input.lastIndexOf(",");
  const dotIndex = input.lastIndexOf(".");

  let normalized = input;

  if (commaIndex >= 0 && dotIndex >= 0) {
    const decimalSeparator = commaIndex > dotIndex ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";

    normalized = normalized.split(thousandsSeparator).join("");
    normalized = normalized.replace(decimalSeparator, ".");
  } else if (commaIndex >= 0) {
    normalized = normalized.replace(",", ".");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const normalizeTradingViewMoneyValue = (raw: string): number | null => {
  const stripped = raw.replace(NON_NUMERIC_MARKS, "").trim();

  if (stripped.length === 0 || EMPTY_MARKER.test(stripped)) {
    return null;
  }

  const unitMatch = stripped.match(/[KMBT]$/i);
  const unit = unitMatch?.[0]?.toUpperCase() ?? null;
  const numericPart = unit ? stripped.slice(0, -1) : stripped;

  if (numericPart.length === 0) {
    return null;
  }

  const numericValue = toNumber(numericPart);
  if (numericValue === null) {
    return null;
  }

  const multiplier = unit ? UNIT_MULTIPLIER[unit] : 1;
  if (!Number.isFinite(multiplier)) {
    return null;
  }

  return numericValue * multiplier;
};

const normalizeRows = (
  rows: readonly TradingViewRevenueBreakdownRow[]
): Readonly<Record<string, readonly number[]>> => {
  const historyByLabel: Record<string, readonly number[]> = {};

  rows.forEach((row) => {
    const label = row.label.trim();
    if (label.length === 0) {
      return;
    }

    const values = row.rawValues
      .map((raw) => normalizeTradingViewMoneyValue(raw))
      .filter((value): value is number => typeof value === "number");

    if (values.length === 0) {
      return;
    }

    historyByLabel[label] = values;
  });

  return historyByLabel;
};

const latestByLabelFromHistory = (
  historyByLabel: Readonly<Record<string, readonly number[]>>
) => {
  const latestByLabel: Record<string, number> = {};

  Object.entries(historyByLabel).forEach(([label, values]) => {
    const latest = values[values.length - 1];
    if (typeof latest === "number" && Number.isFinite(latest)) {
      latestByLabel[label] = latest;
    }
  });

  return latestByLabel;
};

export type BuildTradingViewRevenueBreakdownSnapshotInput = Readonly<{
  provider: string;
  providerKey: string;
  sourceUrl: string;
  rows: readonly TradingViewRevenueBreakdownRow[];
  fetchedAt?: string;
  seriesOrder?: readonly string[];
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
}>;

export const buildTradingViewRevenueBreakdownSnapshot = (
  input: BuildTradingViewRevenueBreakdownSnapshotInput
): TradingViewRevenueBreakdownSnapshot => {
  const fetchedAt = input.fetchedAt ?? new Date().toISOString();
  const historyByLabel = normalizeRows(input.rows);
  const latestByLabel = latestByLabelFromHistory(historyByLabel);

  return {
    provider: input.provider,
    providerKey: input.providerKey,
    source: "tradingview_dom",
    fetchedAt,
    latestByLabel,
    historyByLabel,
    seriesOrder: input.seriesOrder ?? [],
    metadata: {
      sourceUrl: input.sourceUrl,
      labelsCount: Object.keys(historyByLabel).length,
      ...input.metadata,
    },
  };
};
