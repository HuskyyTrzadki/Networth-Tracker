import { parseDecimalString, type DecimalValue } from "@/lib/decimal";

import type { PortfolioSummary, ValuedHolding } from "../../server/valuation";

const DEFAULT_LIMIT = 4;
const DEFAULT_SIDE_LIMIT = 2;

type Trend = "UP" | "DOWN";

export type TopMoverRow = Readonly<{
  instrumentId: string;
  symbol: string;
  name: string;
  logoUrl: string | null;
  currency: string;
  price: string | null;
  todayChangeBase: string;
  todayChangePercent: number | null;
  trend: Trend;
}>;

type Candidate = Readonly<{
  instrumentId: string;
  symbol: string;
  name: string;
  logoUrl: string | null;
  currency: string;
  price: string | null;
  todayChangeBase: string;
  todayChangePercent: number | null;
  trend: Trend;
  absChange: DecimalValue;
}>;

const compareByMagnitudeDesc = (a: Candidate, b: Candidate) => {
  const byMagnitude = b.absChange.cmp(a.absChange);
  if (byMagnitude !== 0) return byMagnitude;

  return a.symbol.localeCompare(b.symbol, "pl-PL");
};

function toCandidate(holding: ValuedHolding): Candidate | null {
  if (holding.instrumentType === "CURRENCY") return null;
  if (!holding.todayChangeBase) return null;

  const change = parseDecimalString(holding.todayChangeBase);
  if (!change || change.eq(0)) return null;

  return {
    instrumentId: holding.instrumentId,
    symbol: holding.symbol,
    name: holding.name,
    logoUrl: holding.logoUrl,
    currency: holding.currency,
    price: holding.price,
    todayChangeBase: holding.todayChangeBase,
    todayChangePercent:
      typeof holding.todayChangePercent === "number" &&
      Number.isFinite(holding.todayChangePercent)
        ? holding.todayChangePercent
        : null,
    trend: change.gt(0) ? "UP" : "DOWN",
    absChange: change.abs(),
  };
}

export function buildTopMovers(
  summary: PortfolioSummary,
  options?: Readonly<{ limit?: number; sideLimit?: number }>
): readonly TopMoverRow[] {
  const limit = options?.limit ?? DEFAULT_LIMIT;
  const sideLimit = options?.sideLimit ?? DEFAULT_SIDE_LIMIT;

  const candidates = summary.holdings
    .map(toCandidate)
    .filter((row): row is Candidate => row !== null);

  if (candidates.length === 0 || limit <= 0 || sideLimit <= 0) {
    return [];
  }

  const gainers = candidates
    .filter((row) => row.trend === "UP")
    .sort(compareByMagnitudeDesc);
  const losers = candidates
    .filter((row) => row.trend === "DOWN")
    .sort(compareByMagnitudeDesc);

  const selected: Candidate[] = [
    ...gainers.slice(0, sideLimit),
    ...losers.slice(0, sideLimit),
  ];

  if (selected.length < limit) {
    const selectedIds = new Set(selected.map((row) => row.instrumentId));
    const remainder = [...gainers.slice(sideLimit), ...losers.slice(sideLimit)]
      .filter((row) => !selectedIds.has(row.instrumentId))
      .sort(compareByMagnitudeDesc);

    selected.push(...remainder.slice(0, limit - selected.length));
  }

  return selected.slice(0, limit).map((row) => ({
    instrumentId: row.instrumentId,
    symbol: row.symbol,
    name: row.name,
    logoUrl: row.logoUrl,
    currency: row.currency,
    price: row.price,
    todayChangeBase: row.todayChangeBase,
    todayChangePercent: row.todayChangePercent,
    trend: row.trend,
  }));
}
