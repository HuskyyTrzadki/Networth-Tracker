import { format, isValid, parseISO } from "date-fns";

export const TRADE_DATE_MIN_ISO = "2023-12-01";

const toLocalIsoDate = (value: Date) => format(value, "yyyy-MM-dd");

export const getTradeDateLowerBound = () => TRADE_DATE_MIN_ISO;

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

  const lowerBound = getTradeDateLowerBound();
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
  "Nieprawidłowa data. Możesz dodać transakcję od 2023-12-01 do dzisiaj.";
