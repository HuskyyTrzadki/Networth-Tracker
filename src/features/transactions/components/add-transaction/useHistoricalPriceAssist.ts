"use client";

import { useEffect, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";

import { useKeyedAsyncResource } from "@/features/common/hooks/use-keyed-async-resource";

import { getInstrumentPriceOnDate, type InstrumentPriceOnDateResponse } from "../../client/get-instrument-price-on-date";
import { isPriceWithinSessionRange } from "../../lib/price-range";
import type { FormValues } from "../AddTransactionDialogContent";

type Result = Readonly<{
  hint: InstrumentPriceOnDateResponse | null;
  errorMessage: string | null;
  isLoading: boolean;
}>;

type Params = Readonly<{
  enabled: boolean;
  form: UseFormReturn<FormValues>;
  provider: string | null;
  providerKey: string | null;
  date: string;
  price: string;
}>;

export function useHistoricalPriceAssist(
  params: Params
): Result {
  const { enabled, form, provider, providerKey, date, price } = params;
  const shouldFetch = enabled && Boolean(provider) && Boolean(providerKey) && Boolean(date);
  const requestKey = shouldFetch && provider && providerKey && date
    ? `${provider}:${providerKey}:${date}`
    : null;
  const resource = useKeyedAsyncResource<InstrumentPriceOnDateResponse>({
    requestKey,
    load: () => {
      if (!provider || !providerKey || !date) {
        return Promise.reject(new Error("Brak danych instrumentu."));
      }

      return getInstrumentPriceOnDate({
        provider,
        providerKey,
        date,
      });
    },
    getErrorMessage: (error) =>
      error instanceof Error
        ? error.message
        : "Nie udało się pobrać ceny historycznej.",
  });
  const lastAutoPriceRef = useRef<string | null>(null);
  const visibleHint = resource.data;
  const visibleErrorMessage = resource.errorMessage;
  const visibleIsLoading = resource.isLoading;

  useEffect(() => {
    if (!shouldFetch) {
      lastAutoPriceRef.current = null;
    }
  }, [shouldFetch]);

  useEffect(() => {
    if (!shouldFetch || !visibleHint) {
      return;
    }

    const currentPrice = form.getValues("price").trim();
    const isAutoValue =
      currentPrice.length > 0 && currentPrice === lastAutoPriceRef.current;
    const shouldAutoFill = currentPrice.length === 0 || isAutoValue;

    if (visibleHint.suggestedPrice && shouldAutoFill) {
      form.setValue("price", visibleHint.suggestedPrice, {
        shouldDirty: false,
        shouldValidate: true,
      });
      lastAutoPriceRef.current = visibleHint.suggestedPrice;
    }
  }, [form, shouldFetch, visibleHint]);

  useEffect(() => {
    const currentErrorType = form.getFieldState("price").error?.type;

    if (!shouldFetch || !visibleHint?.range || visibleErrorMessage) {
      if (currentErrorType === "manual") {
        form.clearErrors("price");
      }
      return;
    }

    const rangeCheck = isPriceWithinSessionRange(price, visibleHint.range);
    if (rangeCheck === null) {
      if (currentErrorType === "manual") {
        form.clearErrors("price");
      }
      return;
    }

    if (!rangeCheck) {
      form.setError("price", {
        type: "manual",
        message: "Cena musi mieścić się w zakresie sesji dla wybranego dnia.",
      });
      return;
    }

    if (currentErrorType === "manual") {
      form.clearErrors("price");
    }
  }, [form, price, shouldFetch, visibleErrorMessage, visibleHint?.range]);

  if (!shouldFetch) {
    return { hint: null, errorMessage: null, isLoading: false };
  }

  return {
    hint: visibleHint,
    errorMessage: visibleErrorMessage,
    isLoading: visibleIsLoading,
  };
}
