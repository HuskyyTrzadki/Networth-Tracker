import { describe, expect, it } from "vitest";

import type { PortfolioSummary } from "../valuation";
import { buildInstrumentSetFingerprint } from "./fingerprint";

const summaryWithHoldings = (valueBaseUsd: string): PortfolioSummary => ({
  baseCurrency: "PLN",
  totalValueBase: "1000",
  isPartial: false,
  missingQuotes: 0,
  missingFx: 0,
  asOf: "2026-02-23T08:00:00.000Z",
  holdings: [
    {
      instrumentId: "aapl",
      provider: "yahoo",
      symbol: "AAPL",
      name: "Apple",
      exchange: null,
      currency: "USD",
      logoUrl: null,
      instrumentType: "EQUITY",
      quantity: "1",
      price: "100",
      valueBase: valueBaseUsd,
      weight: 0.5,
      missingReason: null,
    },
    {
      instrumentId: "cdr",
      provider: "yahoo",
      symbol: "CDR",
      name: "CD Projekt",
      exchange: null,
      currency: "PLN",
      logoUrl: null,
      instrumentType: "EQUITY",
      quantity: "3",
      price: "100",
      valueBase: "500",
      weight: 0.5,
      missingReason: null,
    },
  ],
});

describe("buildInstrumentSetFingerprint", () => {
  it("stays stable when only values change", () => {
    const fingerprintA = buildInstrumentSetFingerprint({
      summary: summaryWithHoldings("500"),
      scope: "ALL",
      portfolioId: null,
      promptVersion: "currency_exposure_v1",
      model: "gemini-2.5-flash-lite",
    });

    const fingerprintB = buildInstrumentSetFingerprint({
      summary: summaryWithHoldings("650"),
      scope: "ALL",
      portfolioId: null,
      promptVersion: "currency_exposure_v1",
      model: "gemini-2.5-flash-lite",
    });

    expect(fingerprintA).toBe(fingerprintB);
  });

  it("changes when instrument set changes", () => {
    const fingerprintA = buildInstrumentSetFingerprint({
      summary: summaryWithHoldings("500"),
      scope: "ALL",
      portfolioId: null,
      promptVersion: "currency_exposure_v1",
      model: "gemini-2.5-flash-lite",
    });

    const fingerprintB = buildInstrumentSetFingerprint({
      summary: {
        ...summaryWithHoldings("500"),
        holdings: [
          ...summaryWithHoldings("500").holdings,
          {
            instrumentId: "asml",
            provider: "yahoo",
            symbol: "ASML",
            name: "ASML",
            exchange: null,
            currency: "EUR",
            logoUrl: null,
            instrumentType: "EQUITY",
            quantity: "1",
            price: "100",
            valueBase: "100",
            weight: 0.1,
            missingReason: null,
          },
        ],
      },
      scope: "ALL",
      portfolioId: null,
      promptVersion: "currency_exposure_v1",
      model: "gemini-2.5-flash-lite",
    });

    expect(fingerprintA).not.toBe(fingerprintB);
  });
});
