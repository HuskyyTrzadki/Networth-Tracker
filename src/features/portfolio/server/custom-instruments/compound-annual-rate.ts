import type { DecimalValue } from "@/lib/decimal";
import {
  addDecimals,
  decimalOne,
  multiplyDecimals,
  parseDecimalString,
} from "@/lib/decimal";

const MS_PER_DAY = 86_400_000;
const INTERNAL_SCALE = 8;
const ROUND_HALF_UP = 1;

const toIsoDay = (input: string) => input.trim().slice(0, 10);

const daysBetweenIsoDates = (fromIsoDate: string, toIsoDate: string) => {
  const fromMs = Date.parse(toIsoDay(fromIsoDate));
  const toMs = Date.parse(toIsoDay(toIsoDate));
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) {
    return null;
  }

  const diff = Math.floor((toMs - fromMs) / MS_PER_DAY);
  return diff < 0 ? 0 : diff;
};

const roundInternal = (value: DecimalValue) => value.round(INTERNAL_SCALE, ROUND_HALF_UP);

const toDailyRateFactor = (annualRatePct: DecimalValue) => {
  const dailyRate = roundInternal(annualRatePct.div(100).div(365));
  return roundInternal(addDecimals(decimalOne(), dailyRate));
};

const computeDayChangePercent = (
  dayChange: DecimalValue,
  previousPrice: DecimalValue
) => {
  if (!previousPrice.gt(0)) {
    return null;
  }

  const value = Number(dayChange.div(previousPrice).toString());
  return Number.isFinite(value) ? value : null;
};

export type CompoundAnnualRateResult = Readonly<{
  price: string;
  dayChange: string | null;
  // Normalized ratio: 0.01 = +1.00%.
  dayChangePercent: number | null;
}>;

export const computeCompoundedAnnualRateDailyFactor = (
  annualRatePct: string
): string | null => {
  const annualRate = parseDecimalString(annualRatePct);
  if (!annualRate) {
    return null;
  }

  return toDailyRateFactor(annualRate).toString();
};

export function computeCompoundedAnnualRateQuoteFromPreviousDay(input: Readonly<{
  previousPrice: string;
  dailyRateFactor: string;
}>): CompoundAnnualRateResult | null {
  const previousPrice = parseDecimalString(input.previousPrice);
  const dailyRateFactor = parseDecimalString(input.dailyRateFactor);
  if (!previousPrice || !dailyRateFactor) {
    return null;
  }

  const nextPrice = roundInternal(multiplyDecimals(previousPrice, dailyRateFactor));
  const dayChange = roundInternal(nextPrice.minus(previousPrice));

  return {
    price: nextPrice.toString(),
    dayChange: dayChange.toString(),
    dayChangePercent: computeDayChangePercent(dayChange, previousPrice),
  };
}

export function computeCompoundedAnnualRateQuote(input: Readonly<{
  anchorPrice: string;
  anchorDate: string;
  annualRatePct: string;
  asOfDate: string;
}>): CompoundAnnualRateResult {
  const anchor = parseDecimalString(input.anchorPrice);
  if (!anchor) {
    return { price: input.anchorPrice, dayChange: null, dayChangePercent: null };
  }

  const annualRatePct = parseDecimalString(input.annualRatePct);
  if (!annualRatePct) {
    return { price: anchor.toString(), dayChange: null, dayChangePercent: null };
  }

  const days = daysBetweenIsoDates(input.anchorDate, input.asOfDate);
  if (days === null) {
    return { price: anchor.toString(), dayChange: null, dayChangePercent: null };
  }

  const roundedAnchor = roundInternal(anchor);
  const factor = toDailyRateFactor(annualRatePct);
  const price = roundInternal(multiplyDecimals(roundedAnchor, factor.pow(days)));

  if (days === 0) {
    return { price: price.toString(), dayChange: "0", dayChangePercent: 0 };
  }

  const previousPrice = roundInternal(
    multiplyDecimals(roundedAnchor, factor.pow(days - 1))
  );
  const dayChange = roundInternal(price.minus(previousPrice));

  return {
    price: price.toString(),
    dayChange: dayChange.toString(),
    dayChangePercent: computeDayChangePercent(dayChange, previousPrice),
  };
}
