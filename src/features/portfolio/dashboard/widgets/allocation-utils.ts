import { addDecimals, decimalZero, parseDecimalString } from "@/lib/decimal";

import type { PortfolioSummary, ValuedHolding } from "../../server/valuation";

const chartColors = [
  { color: "#2f2f2f", patternId: "solid" },
  { color: "#556f85", patternId: "hatch" },
  { color: "#8c6e50", patternId: "dots" },
  { color: "#4f7865", patternId: "cross" },
  { color: "#8d534e", patternId: "grid" },
] as const;

const maxSlices = 5;

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

  const primaryCount = sorted.length > maxSlices ? maxSlices - 1 : sorted.length;
  const primary = sorted.slice(0, primaryCount);
  const remainder = sorted.slice(primaryCount);

  const rows: AllocationRow[] = primary.map((holding, index) => ({
    id: holding.instrumentId,
    label: holding.symbol,
    share: toShare(holding.weight),
    valueBase: holding.valueBase,
    color: chartColors[index % chartColors.length].color,
    patternId: chartColors[index % chartColors.length].patternId,
  }));

  if (remainder.length > 0) {
    const remainderShare = Math.max(0, 1 - sumWeights(primary));
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
