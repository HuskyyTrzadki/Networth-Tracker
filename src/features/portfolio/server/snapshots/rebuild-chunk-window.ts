import { shiftIsoDate } from "@/features/market-data/server/lib/date-utils";

export const resolveChunkToDate = (
  fromDate: string,
  toDate: string,
  maxDaysPerRun: number
) => {
  const clampedMaxDays = Math.max(1, Math.floor(maxDaysPerRun));
  const candidateToDate = shiftIsoDate(fromDate, clampedMaxDays - 1);
  return candidateToDate.localeCompare(toDate) <= 0 ? candidateToDate : toDate;
};

