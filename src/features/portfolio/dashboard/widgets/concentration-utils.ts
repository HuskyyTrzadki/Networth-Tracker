import type { InstrumentType } from "@/features/market-data";

import type { PortfolioSummary } from "../../server/valuation";

export type ConcentrationSeverity = "SOFT" | "HARD" | "CRITICAL";

export type ConcentrationWarning = Readonly<{
  severity: ConcentrationSeverity;
  instrumentId: string;
  symbol: string;
  weight: number;
}>;

const EXCLUDED_TYPES = new Set<InstrumentType>(["ETF", "MUTUALFUND", "INDEX"]);

const isEligibleType = (instrumentType: InstrumentType | null) =>
  !instrumentType || !EXCLUDED_TYPES.has(instrumentType);

export function getConcentrationWarning(
  summary: PortfolioSummary
): ConcentrationWarning | null {
  if (summary.isPartial) return null;

  let top: ConcentrationWarning | null = null;

  for (const holding of summary.holdings) {
    if (holding.weight === null || !holding.valueBase) continue;
    if (!isEligibleType(holding.instrumentType)) continue;
    if (!Number.isFinite(holding.weight)) continue;

    if (!top || holding.weight > top.weight) {
      top = {
        severity: "SOFT",
        instrumentId: holding.instrumentId,
        symbol: holding.symbol,
        weight: holding.weight,
      };
    }
  }

  if (!top || top.weight <= 0.2) return null;

  if (top.weight > 0.4) {
    return { ...top, severity: "CRITICAL" };
  }

  if (top.weight > 0.3) {
    return { ...top, severity: "HARD" };
  }

  return top;
}
