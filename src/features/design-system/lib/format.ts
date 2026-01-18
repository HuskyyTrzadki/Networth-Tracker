import type { Currency, Money } from "../fixtures/mockPortfolio";

export function formatMoney(
  locale: string,
  money: Money,
  options?: Readonly<{ maximumFractionDigits?: number }>
) {
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: money.currency,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  });
  return formatter.format(money.amount);
}

export function formatNumber(
  locale: string,
  value: number,
  options?: Readonly<{ maximumFractionDigits?: number; signDisplay?: "auto" | "always" }>
) {
  const formatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    signDisplay: options?.signDisplay ?? "auto",
  });
  return formatter.format(value);
}

export function formatPercent(
  locale: string,
  value: number,
  options?: Readonly<{ maximumFractionDigits?: number; signDisplay?: "auto" | "always" }>
) {
  const formatter = new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    signDisplay: options?.signDisplay ?? "auto",
  });
  return formatter.format(value);
}

export function convertCurrency(
  money: Money,
  rate: Readonly<{ base: Currency; quote: Currency; rate: number }>
): Money {
  if (money.currency !== rate.base) return money;
  return { amount: money.amount * rate.rate, currency: rate.quote };
}
