"use client";

import { format } from "date-fns";
import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";

import { parseDecimalString } from "@/lib/decimal";

import type { FormValues } from "../AddTransactionDialogContent";
import type { InstrumentSearchResult } from "../../lib/instrument-search";
import type { TransactionType } from "../../lib/add-transaction-form-schema";

type Params = Readonly<{
  form: UseFormReturn<FormValues>;
  isCashTab: boolean;
  type: TransactionType;
  selectedInstrument: InstrumentSearchResult | null;
  date: string;
  quantity: string;
  availableAssetQuantity: string | null;
}>;

export function useSellQuantityGuard({
  form,
  isCashTab,
  type,
  selectedInstrument,
  date,
  quantity,
  availableAssetQuantity,
}: Params) {
  useEffect(() => {
    const guardMessage = "Ilość sprzedaży przekracza aktualnie dostępny stan.";
    const quantityError = form.formState.errors.quantity;
    const isSellAssetFlow = !isCashTab && type === "SELL" && Boolean(selectedInstrument);
    const isToday = date === format(new Date(), "yyyy-MM-dd");
    const entered = parseDecimalString(quantity);
    const available = parseDecimalString(availableAssetQuantity ?? null);
    const hasOversell =
      isSellAssetFlow &&
      isToday &&
      Boolean(entered && available && entered.gt(available));

    if (hasOversell) {
      form.setError("quantity", {
        type: "manual",
        message: guardMessage,
      });
      return;
    }

    if (
      quantityError?.type === "manual" &&
      quantityError.message === guardMessage
    ) {
      form.clearErrors("quantity");
    }
  }, [
    availableAssetQuantity,
    date,
    form,
    isCashTab,
    quantity,
    selectedInstrument,
    type,
    form.formState.errors.quantity,
  ]);
}
