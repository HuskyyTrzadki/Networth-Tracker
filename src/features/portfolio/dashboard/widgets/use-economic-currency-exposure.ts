"use client";

import { useState } from "react";

import { getEconomicCurrencyExposure } from "@/features/portfolio/client/get-economic-currency-exposure";
import type { EconomicCurrencyExposureApiResponse } from "@/features/portfolio/lib/currency-exposure";

import { resolveCurrencyExposureErrorMessage } from "./currency-exposure-widget-view-state";

type Input = Readonly<{
  selectedPortfolioId: string | null;
}>;

export function useEconomicCurrencyExposure({ selectedPortfolioId }: Input) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [economicResponse, setEconomicResponse] =
    useState<EconomicCurrencyExposureApiResponse | null>(null);

  const loadEconomicExposure = async ({
    allowCachedResponse,
  }: Readonly<{ allowCachedResponse: boolean }>) => {
    if (isLoading || (allowCachedResponse && economicResponse)) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getEconomicCurrencyExposure({
        portfolioId: selectedPortfolioId,
      });
      setEconomicResponse(response);
    } catch (error) {
      setErrorMessage(resolveCurrencyExposureErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    economicResponse,
    errorMessage,
    isLoading,
    loadEconomicExposure,
  };
}
