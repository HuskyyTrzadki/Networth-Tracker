import { addDecimals, decimalOne, multiplyDecimals, parseDecimalString } from "@/lib/decimal";

const MS_PER_DAY = 86_400_000;

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

export type CompoundAnnualRateResult = Readonly<{
  price: string;
  dayChange: string | null;
  // Normalized ratio: 0.01 = +1.00%.
  dayChangePercent: number | null;
}>;

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

  // Daily discrete compounding from an annual percentage rate.
  const dailyRate = annualRatePct.div(100).div(365);
  const factor = addDecimals(decimalOne(), dailyRate);
  const price = multiplyDecimals(anchor, factor.pow(days));

  if (days === 0) {
    return { price: price.toString(), dayChange: "0", dayChangePercent: 0 };
  }

  const prev = multiplyDecimals(anchor, factor.pow(days - 1));
  const dayChange = price.minus(prev);
  const pct = prev.gt(0) ? Number(dayChange.div(prev).toString()) : null;

  return {
    price: price.toString(),
    dayChange: dayChange.toString(),
    dayChangePercent: pct !== null && Number.isFinite(pct) ? pct : null,
  };
}

