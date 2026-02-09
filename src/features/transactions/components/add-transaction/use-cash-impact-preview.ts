"use client";

import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";

import { addDecimals, parseDecimalString } from "@/lib/decimal";

import { buildCashImpact } from "./build-cash-impact";
import { formatMoney } from "./constants";
import { useFxPreview } from "./use-fx-preview";
import type { FormValues } from "../AddTransactionDialogContent";
import type { InstrumentSearchResult } from "../../lib/instrument-search";
import type { CashCurrency } from "../../lib/system-currencies";
import type { TransactionType } from "../../lib/add-transaction-form-schema";

type Params = Readonly<{
  form: UseFormReturn<FormValues>;
  consumeCash: boolean;
  isCashTab: boolean;
  selectedInstrument: InstrumentSearchResult | null;
  resolvedCashCurrency: CashCurrency;
  availableCashOnTradeDate: string;
  type: TransactionType;
  quantity: string;
  price: string;
  fee: string;
  fxFee: string;
}>;

export function useCashImpactPreview({
  form,
  consumeCash,
  isCashTab,
  selectedInstrument,
  resolvedCashCurrency,
  availableCashOnTradeDate,
  type,
  quantity,
  price,
  fee,
  fxFee,
}: Params) {
  const isFxMismatch =
    consumeCash &&
    !isCashTab &&
    Boolean(selectedInstrument) &&
    resolvedCashCurrency !== (selectedInstrument?.currency ?? "");

  const fxPreview = useFxPreview({
    enabled: isFxMismatch,
    fromCurrency: selectedInstrument?.currency ?? null,
    toCurrency: isFxMismatch ? resolvedCashCurrency : null,
  });

  const cashImpact = buildCashImpact({
    type,
    quantity,
    price,
    fee,
    fxFee,
    assetCurrency: selectedInstrument?.currency ?? "",
    cashCurrency: resolvedCashCurrency,
    fxRate: fxPreview.data?.rate ?? null,
  });

  const cashDelta = parseDecimalString(cashImpact?.delta ?? null);
  const availableCashDecimal = parseDecimalString(availableCashOnTradeDate);
  const projectedCashAfter =
    cashDelta && availableCashDecimal
      ? addDecimals(availableCashDecimal, cashDelta)
      : null;
  const projectedCashDeltaLabel = cashDelta
    ? `${cashDelta.gt(0) ? "+" : "-"}${formatMoney(
        cashDelta.abs().toString(),
        resolvedCashCurrency
      )}`
    : null;
  const projectedCashAfterLabel = projectedCashAfter
    ? formatMoney(projectedCashAfter.toString(), resolvedCashCurrency)
    : null;
  const hasInsufficientCash = Boolean(
    consumeCash && projectedCashAfter && projectedCashAfter.lt(0)
  );

  useEffect(() => {
    const cashCurrencyError = form.formState.errors.cashCurrency;
    const outOfCashMessage = "Po tej transakcji gotówka byłaby ujemna.";

    if (hasInsufficientCash) {
      form.setError("cashCurrency", {
        type: "manual",
        message: outOfCashMessage,
      });
      return;
    }

    if (
      cashCurrencyError?.type === "manual" &&
      cashCurrencyError.message === outOfCashMessage
    ) {
      form.clearErrors("cashCurrency");
    }
  }, [form, hasInsufficientCash, form.formState.errors.cashCurrency]);

  return {
    isFxMismatch,
    fxPreview,
    projectedCashDeltaLabel,
    projectedCashAfterLabel,
    hasInsufficientCash,
  };
}
