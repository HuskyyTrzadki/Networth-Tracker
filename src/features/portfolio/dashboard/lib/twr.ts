export type PerformanceInputRow = Readonly<{
  bucketDate: string;
  totalValue: number | null;
  externalCashflow: number | null;
  implicitTransfer: number | null;
  isPartial: boolean;
}>;

export type DailyReturn = Readonly<{
  bucketDate: string;
  value: number | null;
  isPartial: boolean;
}>;

export type PeriodReturn = Readonly<{
  value: number | null;
  isPartial: boolean;
}>;

const sumFlows = (row: PerformanceInputRow) => {
  if (row.externalCashflow === null || row.implicitTransfer === null) {
    return null;
  }

  return row.externalCashflow + row.implicitTransfer;
};

export const computeDailyReturns = (
  rows: readonly PerformanceInputRow[]
): DailyReturn[] => {
  if (rows.length < 2) return [];

  const returns: DailyReturn[] = [];

  for (let i = 1; i < rows.length; i += 1) {
    const prev = rows[i - 1];
    const current = rows[i];
    const flow = sumFlows(current);

    if (
      prev.totalValue === null ||
      current.totalValue === null ||
      prev.totalValue === 0 ||
      flow === null
    ) {
      returns.push({
        bucketDate: current.bucketDate,
        value: null,
        isPartial: false,
      });
      continue;
    }

    const value = (current.totalValue - flow - prev.totalValue) / prev.totalValue;
    const isPartial = prev.isPartial || current.isPartial;

    returns.push({
      bucketDate: current.bucketDate,
      value,
      isPartial,
    });
  }

  return returns;
};

export const computePeriodReturn = (
  dailyReturns: readonly DailyReturn[]
): PeriodReturn => {
  let cumulative: number | null = null;
  let cumulativePartial = false;

  dailyReturns.forEach((entry) => {
    if (entry.value === null) {
      cumulative = null;
      cumulativePartial = false;
      return;
    }

    if (cumulative === null) {
      cumulative = entry.value;
      cumulativePartial = entry.isPartial;
      return;
    }

    cumulative = (1 + cumulative) * (1 + entry.value) - 1;
    cumulativePartial = cumulativePartial || entry.isPartial;
  });

  return {
    value: cumulative,
    isPartial: cumulativePartial,
  };
};
