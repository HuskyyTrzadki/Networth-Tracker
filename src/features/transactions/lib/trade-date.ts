import { format, isValid, parseISO, subYears } from "date-fns";

export const TRADE_DATE_MAX_YEARS_BACK = 5;

const toLocalIsoDate = (value: Date) => format(value, "yyyy-MM-dd");

export const getTradeDateLowerBound = (referenceDate: Date = new Date()) =>
  toLocalIsoDate(subYears(referenceDate, TRADE_DATE_MAX_YEARS_BACK));

export const isValidTradeDate = (
  value: string,
  referenceDate: Date = new Date()
) => {
  const parsed = parseISO(value);
  if (!isValid(parsed)) return false;

  const parsedDay = toLocalIsoDate(parsed);
  if (parsedDay !== value) {
    return false;
  }

  const lowerBound = getTradeDateLowerBound(referenceDate);
  if (parsedDay < lowerBound) {
    return false;
  }

  const upperBound = toLocalIsoDate(referenceDate);
  if (parsedDay > upperBound) {
    return false;
  }

  return true;
};

export const tradeDateValidationMessage =
  "Nieprawidłowa data. Możesz dodać transakcję maksymalnie 5 lat wstecz.";
