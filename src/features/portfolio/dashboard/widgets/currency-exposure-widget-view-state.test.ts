import { describe, expect, it } from "vitest";

import type {
  CurrencyExposureChartRow,
  EconomicCurrencyExposureApiResponse,
} from "@/features/portfolio/lib/currency-exposure";
import {
  buildCurrencyExposureWidgetViewState,
  buildExposureDeltaChips,
  parseCurrencyExposureMode,
  resolveCurrencyExposureErrorMessage,
} from "./currency-exposure-widget-view-state";

const investorChart: readonly CurrencyExposureChartRow[] = [
  { currencyCode: "USD", sharePct: 60, valueBase: "600" },
  { currencyCode: "PLN", sharePct: 40, valueBase: "400" },
];

const readyEconomicResponse: EconomicCurrencyExposureApiResponse = {
  scope: "ALL",
  portfolioId: null,
  asOf: "2026-03-05T00:00:00.000Z",
  modelMode: "ECONOMIC",
  status: "READY",
  chart: [
    { currencyCode: "USD", sharePct: 70, valueBase: "700" },
    { currencyCode: "EUR", sharePct: 30, valueBase: "300" },
  ],
  details: [
    {
      currencyCode: "USD",
      drivers: [],
    },
    {
      currencyCode: "EUR",
      drivers: [],
    },
  ],
  meta: {
    model: "gemini",
    promptVersion: "v1",
    fromCache: false,
  },
};

describe("currency-exposure-widget-view-state", () => {
  it("parses supported modes only", () => {
    expect(parseCurrencyExposureMode("NOTOWANIA")).toBe("NOTOWANIA");
    expect(parseCurrencyExposureMode("BAD")).toBeNull();
  });

  it("builds significant delta chips", () => {
    expect(buildExposureDeltaChips(readyEconomicResponse.chart, investorChart)).toEqual([
      { currencyCode: "PLN", delta: -40 },
      { currencyCode: "EUR", delta: 30 },
      { currencyCode: "USD", delta: 10 },
    ]);
  });

  it("builds economic mode view state", () => {
    const viewState = buildCurrencyExposureWidgetViewState({
      mode: "GOSPODARCZA",
      investorData: {
        chart: investorChart,
        details: [],
      },
      economicResponse: readyEconomicResponse,
    });

    expect(viewState.isPendingSourceData).toBe(false);
    expect(viewState.activeChart).toEqual(readyEconomicResponse.chart);
    expect(viewState.deltaReferenceLabel).toBe("vs Notowania");
  });

  it("maps unknown errors to fallback copy", () => {
    expect(resolveCurrencyExposureErrorMessage("bad")).toBe(
      "Nie udało się policzyć ekspozycji."
    );
  });
});
