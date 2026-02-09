type ProgressInput = Readonly<{
  fromDate: string | null;
  toDate: string | null;
  processedUntil: string | null;
}>;

const DAY_MS = 86_400_000;

const toIsoDayTimestamp = (value: string) => Date.parse(`${value}T00:00:00Z`);

export const computeRebuildProgressPercent = ({
  fromDate,
  toDate,
  processedUntil,
}: ProgressInput) => {
  if (!fromDate || !toDate) {
    return null;
  }

  const fromMs = toIsoDayTimestamp(fromDate);
  const toMs = toIsoDayTimestamp(toDate);
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || fromMs > toMs) {
    return null;
  }

  const totalDays = Math.floor((toMs - fromMs) / DAY_MS) + 1;
  if (totalDays <= 0) {
    return null;
  }

  if (!processedUntil) {
    return 0;
  }

  const processedMs = toIsoDayTimestamp(processedUntil);
  if (!Number.isFinite(processedMs) || processedMs < fromMs) {
    return 0;
  }

  const clampedProcessedMs = Math.min(processedMs, toMs);
  const processedDays = Math.floor((clampedProcessedMs - fromMs) / DAY_MS) + 1;
  return Math.max(0, Math.min(100, (processedDays / totalDays) * 100));
};
