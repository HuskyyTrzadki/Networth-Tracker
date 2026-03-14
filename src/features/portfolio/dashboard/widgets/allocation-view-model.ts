import { addDecimals, decimalZero, parseDecimalString } from "@/lib/decimal";
import type { CustomAssetType } from "@/features/transactions/lib/custom-asset-types";
import { resolveInstrumentVisual } from "@/features/transactions/lib/instrument-visual";
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
  REAL_ESTATE: ["#8f5f3f", "#a8744f", "#c08d67", "#d6a786"],
  EQUITIES: ["#355c7d", "#437192", "#5586a7", "#6f9cbc"],
  FIXED_INCOME: ["#7f6a2b", "#96813a", "#b29a4b", "#c9b366"],
  CASH: ["#2f6c54", "#3f8467", "#589d7d", "#74b393"],
  OTHER: ["#80556c", "#976a82", "#ae8098", "#c296ae"],
} as const;

export type AllocationCategoryKey = (typeof categoryOrder)[number];

export type AllocationAssetRow = Readonly<{
  id: string;
  label: string;
  symbol: string;
  logoUrl: string | null;
  isCurrencyCash: boolean;
  customAssetType: CustomAssetType | null;
  customGlyph: string | null;
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

const neutralHeatColor = "#433b33";
const positiveHeatStart = "#355645";
const positiveHeatEnd = "#83b399";
const negativeHeatStart = "#5a3a35";
const negativeHeatEnd = "#bf8278";
const maxHeatMagnitude = 0.05;

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
      const visual = resolveInstrumentVisual({
        symbol: holding.symbol,
        name: holding.name,
        provider: holding.provider,
        instrumentType: holding.instrumentType,
        customAssetType: holding.customAssetType,
      });
      const category = resolveCategory(holding);
      const color = getColor(category, categoryCounts[category]);
      const todayChangePercent = normalizeTodayChangePercent(holding.todayChangePercent);
      categoryCounts[category] += 1;

      return {
        id: holding.instrumentId,
        label: visual.label,
        symbol: holding.symbol,
        logoUrl: holding.logoUrl,
        isCurrencyCash: visual.isCash,
        customAssetType: visual.customAssetType,
        customGlyph: visual.customGlyph,
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
