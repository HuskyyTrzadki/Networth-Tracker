import {
  formatCurrencyString,
  formatCurrencyValue,
  getCurrencyFormatter,
} from "@/lib/format-currency";
import { multiplyDecimals, parseDecimalString } from "@/lib/decimal";
import { formatGroupedNumber } from "@/lib/format-number";

import { cashflowTypeLabels, type CashflowType } from "../lib/cashflow-types";
import type { TransactionListItem } from "../server/list-transactions";

export const getTypeLabel = (item: TransactionListItem) => {
  if (item.cashflowType) {
    return cashflowTypeLabels[item.cashflowType as CashflowType] ?? item.cashflowType;
  }

  return item.side === "BUY" ? "Kupno" : "Sprzedaż";
};

const getTypeBadgeClassName = () =>
  "border-border/70 bg-background/92 text-foreground/88";

export const getRowBadgeClassName = (item: TransactionListItem) => {
  if (item.legRole !== "CASH") {
    return getTypeBadgeClassName();
  }

  return "border-border/75 bg-muted/28 text-muted-foreground";
};

export const getInstrumentSubtitle = (item: TransactionListItem) => {
  if (item.legRole !== "CASH") {
    return item.instrument.name;
  }

  if (item.legKey === "CASH_SETTLEMENT") {
    return "Rozliczenie gotówki";
  }

  if (item.legKey === "CASH_FX_FEE") {
    return "Opłata FX";
  }

  return item.instrument.name;
};

export const formatPriceLabel = (price: string, currency: string) => {
  const formatter = getCurrencyFormatter(currency);

  if (!formatter) {
    return `${price} ${currency}`;
  }

  return formatCurrencyString(price, formatter) ?? `${price} ${currency}`;
};

export const formatValueLabel = (quantity: string, price: string, currency: string) => {
  const formatter = getCurrencyFormatter(currency);
  const parsedQuantity = parseDecimalString(quantity);
  const parsedPrice = parseDecimalString(price);

  if (!formatter || !parsedQuantity || !parsedPrice) {
    return "—";
  }

  const value = multiplyDecimals(parsedQuantity, parsedPrice);
  return formatCurrencyValue(value, formatter);
};

export const formatQuantityLabel = (item: TransactionListItem) => {
  if (!parseDecimalString(item.quantity)) {
    return item.quantity;
  }

  if (item.legRole === "CASH") {
    return (
      formatGroupedNumber(item.quantity, {
        minFractionDigits: 2,
        maxFractionDigits: 2,
        trimTrailingZeros: false,
      }) ?? item.quantity
    );
  }

  return (
    formatGroupedNumber(item.quantity, {
      maxFractionDigits: 8,
      trimTrailingZeros: true,
    }) ?? item.quantity
  );
};
