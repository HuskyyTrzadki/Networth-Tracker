"use client";

import { useKeyedAsyncResource } from "@/features/common/hooks/use-keyed-async-resource";

import {
  getCashBalanceOnDate,
  type CashBalanceOnDateResponse,
} from "../../client/get-cash-balance-on-date";

type Params = Readonly<{
  enabled: boolean;
  portfolioId: string | null;
  cashCurrency: string;
  tradeDate: string;
}>;

export function useCashBalanceOnDate({
  enabled,
  portfolioId,
  cashCurrency,
  tradeDate,
}: Params) {
  const normalizedCurrency = cashCurrency.toUpperCase();
  const requestKey =
    enabled && portfolioId && normalizedCurrency && tradeDate
      ? `${portfolioId}:${normalizedCurrency}:${tradeDate}`
      : null;
  const resource = useKeyedAsyncResource<CashBalanceOnDateResponse>({
    requestKey,
    load: () => {
      if (!portfolioId) {
        return Promise.reject(new Error("Brak portfela."));
      }

      return getCashBalanceOnDate({
        portfolioId,
        cashCurrency: normalizedCurrency,
        tradeDate,
      });
    },
    getErrorMessage: (error) =>
      error instanceof Error
        ? error.message
        : "Nie udało się pobrać salda gotówki na wybraną datę.",
  });

  return {
    availableCashOnDate: resource.data?.availableCashOnDate ?? null,
    errorMessage: resource.errorMessage,
    isLoading: resource.isLoading,
  };
}
