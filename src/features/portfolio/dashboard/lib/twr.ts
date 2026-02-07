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

export type CumulativeReturnPoint = Readonly<{
  bucketDate: string;
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
  let lastValuationRow = rows[0];
  let carriedFlow: number | null = 0;
  let carriedPartial = false;

  for (let i = 1; i < rows.length; i += 1) {
    const current = rows[i];
    const flow = sumFlows(current);
    carriedPartial = carriedPartial || current.isPartial;

    if (carriedFlow !== null) {
      carriedFlow = flow === null ? null : carriedFlow + flow;
    }

    const previousTotalValue = lastValuationRow.totalValue;
    if (
      previousTotalValue === null ||
      previousTotalValue === 0 ||
      current.totalValue === null ||
      carriedFlow === null
    ) {
      returns.push({
        bucketDate: current.bucketDate,
        value: null,
        isPartial: false,
      });

      if (current.totalValue !== null) {
        lastValuationRow = current;
        carriedFlow = 0;
        carriedPartial = false;
      }
      continue;
    }

    const value =
      (current.totalValue - carriedFlow - previousTotalValue) /
      previousTotalValue;
    const isPartial = lastValuationRow.isPartial || carriedPartial;

    returns.push({
      bucketDate: current.bucketDate,
      value,
      isPartial,
    });

    lastValuationRow = current;
    carriedFlow = 0;
    carriedPartial = false;
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

export const computeCumulativeReturns = (
  dailyReturns: readonly DailyReturn[]
): CumulativeReturnPoint[] => {
  let cumulative: number | null = null;
  let cumulativePartial = false;

  return dailyReturns.map((entry) => {
    if (entry.value === null) {
      cumulative = null;
      cumulativePartial = false;
      return {
        bucketDate: entry.bucketDate,
        value: null,
        isPartial: false,
      };
    }

    if (cumulative === null) {
      cumulative = entry.value;
      cumulativePartial = entry.isPartial;
      return {
        bucketDate: entry.bucketDate,
        value: cumulative,
        isPartial: cumulativePartial,
      };
    }

    cumulative = (1 + cumulative) * (1 + entry.value) - 1;
    cumulativePartial = cumulativePartial || entry.isPartial;

    return {
      bucketDate: entry.bucketDate,
      value: cumulative,
      isPartial: cumulativePartial,
    };
  });
};
