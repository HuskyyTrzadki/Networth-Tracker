type DateRow = Readonly<{ date: string }>;

const DAY_MS = 86_400_000;
const MAX_CACHE_GAP_DAYS = 10;

const toIsoDayTimestamp = (value: string) => Date.parse(`${value}T00:00:00Z`);

const diffDays = (left: string, right: string) => {
  const leftMs = toIsoDayTimestamp(left);
  const rightMs = toIsoDayTimestamp(right);
  if (!Number.isFinite(leftMs) || !Number.isFinite(rightMs)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.floor((rightMs - leftMs) / DAY_MS);
};

const dedupeAndSortDates = (rows: readonly DateRow[]) =>
  Array.from(new Set(rows.map((row) => row.date))).sort((left, right) =>
    left.localeCompare(right)
  );

export const hasSufficientDailyCoverage = (
  rows: readonly DateRow[],
  fromDate: string,
  toDate: string,
  maxGapDays = MAX_CACHE_GAP_DAYS
) => {
  const dates = dedupeAndSortDates(rows);
  if (dates.length === 0) {
    return false;
  }

  const firstDate = dates[0];
  const lastDate = dates.at(-1) ?? firstDate;

  if (firstDate > fromDate && diffDays(fromDate, firstDate) > maxGapDays) {
    return false;
  }

  if (lastDate < toDate && diffDays(lastDate, toDate) > maxGapDays) {
    return false;
  }

  for (let index = 1; index < dates.length; index += 1) {
    const previous = dates[index - 1];
    const current = dates[index];
    if (diffDays(previous, current) > maxGapDays) {
      return false;
    }
  }

  return true;
};

