import { addDecimals, decimalZero, parseDecimalString } from "@/lib/decimal";

import type { PortfolioSummary, ValuedHolding } from "../../server/valuation";

const chartColors = [
  { color: "#1f2430", patternId: "solid" },
  { color: "#1f4e79", patternId: "hatch" },
  { color: "#8a5a14", patternId: "dots" },
  { color: "#17603d", patternId: "cross" },
  { color: "#8b1e3f", patternId: "grid" },
] as const;

const maxSlices = 5;
const minimumVisibleShare = 0.04;

export type AllocationRow = Readonly<{
  id: string;
  label: string;
  share: number;
  valueBase: string | null;
  color: string;
  patternId: "solid" | "hatch" | "dots" | "cross" | "grid";
}>;

const toShare = (value: number | null) => Math.max(0, value ?? 0);

const sumWeights = (holdings: readonly ValuedHolding[]) =>
  holdings.reduce((sum, holding) => sum + toShare(holding.weight), 0);

const sumValues = (holdings: readonly ValuedHolding[]) =>
  holdings.reduce((sum, holding) => {
    const parsed = parseDecimalString(holding.valueBase);
    return parsed ? addDecimals(sum, parsed) : sum;
  }, decimalZero());

const getHoldingLabel = (holding: ValuedHolding) => {
  if (holding.symbol === "CUSTOM" || holding.provider === "custom") {
    const customName = holding.name.trim();
    if (customName.length > 0) return customName;
  }

  const symbol = holding.symbol.trim();
  if (symbol.length > 0) return symbol;

  const fallbackName = holding.name.trim();
  return fallbackName.length > 0 ? fallbackName : "—";
};

export function buildAllocationData(
  summary: PortfolioSummary
): readonly AllocationRow[] {
  const valuedHoldings = summary.holdings.filter(
    (holding) => holding.weight !== null && holding.valueBase
  );

  if (valuedHoldings.length === 0) {
    return [];
  }

  const sorted = [...valuedHoldings].sort(
    (a, b) => toShare(b.weight) - toShare(a.weight)
  );
  const belowThreshold = sorted.filter(
    (holding) => toShare(holding.weight) < minimumVisibleShare
  );
  const aboveThreshold = sorted.filter(
    (holding) => toShare(holding.weight) >= minimumVisibleShare
  );
  const shouldReserveOtherSlot =
    belowThreshold.length > 0 || aboveThreshold.length > maxSlices;
  const maxPrimary = shouldReserveOtherSlot ? maxSlices - 1 : maxSlices;
  const primary = aboveThreshold.slice(0, maxPrimary);
  const overflow = aboveThreshold.slice(maxPrimary);
  const remainder = [...overflow, ...belowThreshold];

  const rows: AllocationRow[] = primary.map((holding, index) => ({
    id: holding.instrumentId,
    label: getHoldingLabel(holding),
    share: toShare(holding.weight),
    valueBase: holding.valueBase,
    color: chartColors[index % chartColors.length].color,
    patternId: chartColors[index % chartColors.length].patternId,
  }));

  if (remainder.length > 0) {
    const remainderShare = Math.max(0, sumWeights(remainder));
    const remainderValue = sumValues(remainder).toString();
    const styleToken = chartColors[(maxSlices - 1) % chartColors.length];

    rows.push({
      id: "other",
      label: "Pozostałe",
      share: remainderShare,
      valueBase: remainderValue,
      color: styleToken.color,
      patternId: styleToken.patternId,
    });
  }

  return rows;
}
