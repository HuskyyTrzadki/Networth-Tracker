import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import type { PortfolioSummary } from "../../server/valuation";
import { CurrencyExposureWidget } from "./CurrencyExposureWidget";
import { getEconomicCurrencyExposure } from "../../client/get-economic-currency-exposure";

vi.mock("../../client/get-economic-currency-exposure", () => ({
  getEconomicCurrencyExposure: vi.fn(),
}));

const summary: PortfolioSummary = {
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
      valueBase: "600",
      weight: 0.6,
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
      quantity: "1",
      price: "100",
      valueBase: "400",
      weight: 0.4,
      missingReason: null,
    },
  ],
};

describe("CurrencyExposureWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders investor mode by default", () => {
    render(<CurrencyExposureWidget summary={summary} selectedPortfolioId={null} />);

    expect(screen.getByText("Ekspozycja walutowa")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Oblicz ekspozycję gospodarczą" })).toBeInTheDocument();
    expect(screen.getAllByText("Dolar amerykański (USD)").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Polski Złoty (PLN)").length).toBeGreaterThan(0);
  });

  it("loads economic mode after button click", async () => {
    vi.mocked(getEconomicCurrencyExposure).mockResolvedValueOnce({
      scope: "ALL",
      portfolioId: null,
      asOf: "2026-02-23T08:00:00.000Z",
      modelMode: "ECONOMIC",
      chart: [
        { currencyCode: "USD", sharePct: 70, valueBase: "700.00" },
        { currencyCode: "EUR", sharePct: 30, valueBase: "300.00" },
      ],
      details: [
        {
          currencyCode: "USD",
          drivers: [
            {
              instrumentId: "aapl",
              symbol: "AAPL",
              name: "Apple",
              contributionPct: 70,
              contributionWithinCurrencyPct: 100,
              contributionValueBase: "700.00",
            },
          ],
        },
        {
          currencyCode: "EUR",
          drivers: [],
        },
      ],
      meta: {
        model: "gemini-2.5-flash-lite",
        promptVersion: "currency_exposure_v1",
        fromCache: false,
      },
    });

    render(<CurrencyExposureWidget summary={summary} selectedPortfolioId={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Oblicz ekspozycję gospodarczą" }));

    await waitFor(() => {
      expect(vi.mocked(getEconomicCurrencyExposure)).toHaveBeenCalledWith(
        { portfolioId: null }
      );
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Gospodarcza" })).toHaveAttribute(
        "data-state",
        "on"
      );
    });

    expect(screen.queryByText(/Model:/)).not.toBeInTheDocument();
    expect(screen.getAllByText("Euro (EUR)").length).toBeGreaterThan(0);

    const usdLabels = screen.getAllByText("Dolar amerykański (USD)");
    fireEvent.click(usdLabels[usdLabels.length - 1]!);

    expect(screen.getByText("100,0% waluty")).toBeInTheDocument();
    expect(screen.getByText("70,0% portfela")).toBeInTheDocument();
  });
});
