import { addDecimals, decimalZero, parseDecimalString } from "@/lib/decimal";
import type { CustomAssetType } from "@/features/transactions/lib/custom-asset-types";

import type { PortfolioSummary, ValuedHolding } from "../../server/valuation";

const categoryOrder = [
  "REAL_ESTATE",
  "EQUITIES",
  "FIXED_INCOME",
  "CASH",
  "OTHER",
] as const;

const categoryLabels = {
  REAL_ESTATE: "Nieruchomości",
  EQUITIES: "Akcje",
  FIXED_INCOME: "Lokaty i Obligacje",
  CASH: "Gotówka",
  OTHER: "Inne",
} as const;

const categoryColors = {
  REAL_ESTATE: ["#1f4e79", "#2b6398", "#3d77ad", "#4f8bc2"],
  EQUITIES: ["#1f2430", "#2d3445", "#3c455c", "#4a5673"],
  FIXED_INCOME: ["#8a5a14", "#a06d1d", "#b8842d", "#cc9b43"],
  CASH: ["#17603d", "#237b4f", "#319761", "#46ad77"],
  OTHER: ["#8b1e3f", "#9f3352", "#b24967", "#c65f7d"],
} as const;

export type AllocationCategoryKey = (typeof categoryOrder)[number];

export type AllocationAssetRow = Readonly<{
  id: string;
  label: string;
  symbol: string;
  share: number;
  valueBase: string;
  todayChangePercent: number | null;
  category: AllocationCategoryKey;
  categoryLabel: string;
  color: string;
  heatColor: string;
}>;

export type AllocationCategoryRow = Readonly<{
  id: AllocationCategoryKey;
  label: string;
  share: number;
  valueBase: string;
  color: string;
  assets: readonly AllocationAssetRow[];
}>;

export type AllocationViewModel = Readonly<{
  assets: readonly AllocationAssetRow[];
  categories: readonly AllocationCategoryRow[];
  largestToSmallestRatio: number | null;
  hideDonutByDefault: boolean;
}>;

type CategoryAccumulator = {
  assets: AllocationAssetRow[];
  valueBase: ReturnType<typeof decimalZero>;
  share: number;
};

const toShare = (value: number | null) => Math.max(0, value ?? 0);

const asDecimalOrNull = (value: string) => parseDecimalString(value);

const neutralHeatColor = "#2f2b27";
const positiveHeatStart = "#2f4a3f";
const positiveHeatEnd = "#6ca88b";
const negativeHeatStart = "#4a2f2c";
const negativeHeatEnd = "#a3655d";
const maxHeatMagnitude = 0.05;

const resolveLabel = (holding: ValuedHolding) => {
  if (holding.symbol === "CUSTOM" || holding.provider === "custom") {
    const customName = holding.name.trim();
    if (customName.length > 0) return customName;
  }

  const symbol = holding.symbol.trim();
  if (symbol.length > 0) return symbol;

  const fallbackName = holding.name.trim();
  return fallbackName.length > 0 ? fallbackName : "—";
};

const resolveCategory = (holding: ValuedHolding): AllocationCategoryKey => {
  if (holding.provider === "custom" || holding.symbol === "CUSTOM") {
    return mapCustomAssetTypeToCategory(holding.customAssetType ?? null);
  }

  if (holding.instrumentType === "CURRENCY") {
    return "CASH";
  }

  return "EQUITIES";
};

const mapCustomAssetTypeToCategory = (
  customAssetType: CustomAssetType | null
): AllocationCategoryKey => {
  if (customAssetType === "REAL_ESTATE") return "REAL_ESTATE";
  if (
    customAssetType === "TREASURY_BONDS" ||
    customAssetType === "TERM_DEPOSIT" ||
    customAssetType === "PRIVATE_LOAN"
  ) {
    return "FIXED_INCOME";
  }
  if (
    customAssetType === "CAR" ||
    customAssetType === "COMPUTER" ||
    customAssetType === "OTHER"
  ) {
    return "OTHER";
  }
  return "OTHER";
};

const getColor = (category: AllocationCategoryKey, indexInCategory: number) => {
  const palette = categoryColors[category];
  return palette[indexInCategory % palette.length];
};

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return null;

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  if ([r, g, b].some((value) => Number.isNaN(value))) {
    return null;
  }

  return { r, g, b } as const;
};

const toHex = (value: number) =>
  Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0");

const mixHexColors = (startHex: string, endHex: string, ratio: number) => {
  const start = hexToRgb(startHex);
  const end = hexToRgb(endHex);
  if (!start || !end) return startHex;

  const clamped = Math.max(0, Math.min(1, ratio));
  const r = start.r + (end.r - start.r) * clamped;
  const g = start.g + (end.g - start.g) * clamped;
  const b = start.b + (end.b - start.b) * clamped;

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const normalizeTodayChangePercent = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const resolveHeatColor = (todayChangePercent: number | null) => {
  if (todayChangePercent === null) return neutralHeatColor;

  const magnitude = Math.abs(todayChangePercent);
  if (magnitude < 0.0001) return neutralHeatColor;

  const ratio = Math.min(1, magnitude / maxHeatMagnitude);
  if (todayChangePercent > 0) {
    return mixHexColors(positiveHeatStart, positiveHeatEnd, ratio);
  }

  return mixHexColors(negativeHeatStart, negativeHeatEnd, ratio);
};

const computeLargestToSmallestRatio = (assets: readonly AllocationAssetRow[]) => {
  const positiveShares = assets.map((asset) => asset.share).filter((share) => share > 0);
  if (positiveShares.length < 2) return null;

  const min = Math.min(...positiveShares);
  if (min <= 0) return null;
  const max = Math.max(...positiveShares);
  return max / min;
};

export function buildAllocationViewModel(summary: PortfolioSummary): AllocationViewModel {
  const valuedHoldings = summary.holdings.filter((holding) => {
    if (holding.valueBase === null || holding.weight === null) return false;
    return asDecimalOrNull(holding.valueBase) !== null;
  });

  const categoryCounts: Record<AllocationCategoryKey, number> = {
    REAL_ESTATE: 0,
    EQUITIES: 0,
    FIXED_INCOME: 0,
    CASH: 0,
    OTHER: 0,
  };

  const assets = [...valuedHoldings]
    .sort((a, b) => toShare(b.weight) - toShare(a.weight))
    .map((holding) => {
      const category = resolveCategory(holding);
      const color = getColor(category, categoryCounts[category]);
      const todayChangePercent = normalizeTodayChangePercent(holding.todayChangePercent);
      categoryCounts[category] += 1;

      return {
        id: holding.instrumentId,
        label: resolveLabel(holding),
        symbol: holding.symbol,
        share: toShare(holding.weight),
        valueBase: holding.valueBase ?? "0",
        todayChangePercent,
        category,
        categoryLabel: categoryLabels[category],
        color,
        heatColor: resolveHeatColor(todayChangePercent),
      } satisfies AllocationAssetRow;
    });

  const grouped: Record<AllocationCategoryKey, CategoryAccumulator> = {
    REAL_ESTATE: { assets: [], valueBase: decimalZero(), share: 0 },
    EQUITIES: { assets: [], valueBase: decimalZero(), share: 0 },
    FIXED_INCOME: { assets: [], valueBase: decimalZero(), share: 0 },
    CASH: { assets: [], valueBase: decimalZero(), share: 0 },
    OTHER: { assets: [], valueBase: decimalZero(), share: 0 },
  };

  for (const asset of assets) {
    const group = grouped[asset.category];
    group.assets.push(asset);
    group.share += asset.share;
    const parsed = asDecimalOrNull(asset.valueBase);
    if (parsed) {
      group.valueBase = addDecimals(group.valueBase, parsed);
    }
  }

  const categories = categoryOrder
    .map((category) => {
      const group = grouped[category];
      return {
        id: category,
        label: categoryLabels[category],
        share: group.share,
        valueBase: group.valueBase.toString(),
        color: categoryColors[category][0],
        assets: group.assets,
      } satisfies AllocationCategoryRow;
    })
    .filter((category) => category.assets.length > 0);

  const largestToSmallestRatio = computeLargestToSmallestRatio(assets);
  const hideDonutByDefault =
    assets.length > 6 ||
    (typeof largestToSmallestRatio === "number" && largestToSmallestRatio >= 50);

  return {
    assets,
    categories,
    largestToSmallestRatio,
    hideDonutByDefault,
  };
}
