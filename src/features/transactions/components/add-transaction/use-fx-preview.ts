"use client";

import { useKeyedAsyncResource } from "@/features/common/hooks/use-keyed-async-resource";

import { getFxPreview, type FxPreviewResponse } from "../../client/get-fx-preview";

type Params = Readonly<{
  enabled: boolean;
  fromCurrency: string | null;
  toCurrency: string | null;
}>;

export function useFxPreview({ enabled, fromCurrency, toCurrency }: Params) {
  const requestKey =
    enabled && fromCurrency && toCurrency && fromCurrency !== toCurrency
      ? `${fromCurrency}:${toCurrency}`
      : null;
  const resource = useKeyedAsyncResource<FxPreviewResponse>({
    requestKey,
    load: () => {
      if (!fromCurrency || !toCurrency) {
        return Promise.reject(new Error("Brak pary walut."));
      }

      return getFxPreview({ fromCurrency, toCurrency });
    },
    getErrorMessage: (error) =>
      error instanceof Error ? error.message : "Nie udało się pobrać kursu FX.",
  });

  return {
    data: resource.data,
    errorMessage: resource.errorMessage,
    isLoading: resource.isLoading,
  };
}
