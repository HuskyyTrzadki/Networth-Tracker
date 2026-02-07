"use client";

import { useEffect, useRef, useState } from "react";

import { getInstrumentPriceOnDate, type InstrumentPriceOnDateResponse } from "../../client/get-instrument-price-on-date";
import { isPriceWithinSessionRange } from "../../lib/price-range";
import type { FormValues } from "../AddTransactionDialogContent";
import type { UseFormReturn } from "react-hook-form";

type Result = Readonly<{
  hint: InstrumentPriceOnDateResponse | null;
  errorMessage: string | null;
}>;

type AsyncState = Readonly<{
  requestKey: string | null;
  hint: InstrumentPriceOnDateResponse | null;
  errorMessage: string | null;
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
  const [state, setState] = useState<AsyncState>({
    requestKey: null,
    hint: null,
    errorMessage: null,
  });
  const lastAutoPriceRef = useRef<string | null>(null);
  const visibleHint = state.requestKey === requestKey ? state.hint : null;
  const visibleErrorMessage =
    state.requestKey === requestKey ? state.errorMessage : null;

  useEffect(() => {
    if (!shouldFetch || !provider || !providerKey || !date || !requestKey) {
      lastAutoPriceRef.current = null;
      return;
    }

    const controller = new AbortController();

    void getInstrumentPriceOnDate({
      provider,
      providerKey,
      date,
    })
      .then((response) => {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          requestKey,
          hint: response,
          errorMessage: null,
        });

        const currentPrice = form.getValues("price").trim();
        const isAutoValue =
          currentPrice.length > 0 && currentPrice === lastAutoPriceRef.current;
        const shouldAutoFill = currentPrice.length === 0 || isAutoValue;

        if (response.suggestedPrice && shouldAutoFill) {
          form.setValue("price", response.suggestedPrice, {
            shouldDirty: false,
            shouldValidate: true,
          });
          lastAutoPriceRef.current = response.suggestedPrice;
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          requestKey,
          hint: null,
          errorMessage:
            error instanceof Error
              ? error.message
              : "Nie udało się pobrać ceny historycznej.",
        });
      })
      .finally(() => {
        if (controller.signal.aborted) {
          return;
        }
      });

    return () => {
      controller.abort();
    };
  }, [date, form, provider, providerKey, requestKey, shouldFetch]);

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
    return { hint: null, errorMessage: null };
  }

  return { hint: visibleHint, errorMessage: visibleErrorMessage };
}
