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
      providerKey: "AAPL",
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
      providerKey: "CDR",
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
    expect(screen.getByRole("button", { name: "Gospodarcza" })).toBeInTheDocument();
    expect(screen.getByText("Notowania vs gospodarcza")).toBeInTheDocument();
    expect(screen.getAllByText("Dolar amerykański (USD)").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Polski Złoty (PLN)").length).toBeGreaterThan(0);
  });

  it("loads economic mode after switching toggle", async () => {
    vi.mocked(getEconomicCurrencyExposure).mockResolvedValueOnce({
      scope: "ALL",
      portfolioId: null,
      asOf: "2026-02-23T08:00:00.000Z",
      modelMode: "ECONOMIC",
      status: "READY",
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

    fireEvent.click(screen.getByRole("button", { name: "Gospodarcza" }));

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
    expect(screen.getByText("vs Notowania")).toBeInTheDocument();
    expect(screen.getByText("USD +10,0 pp")).toBeInTheDocument();
    expect(screen.getByText("PLN -40,0 pp")).toBeInTheDocument();

    const usdLabels = screen.getAllByText("Dolar amerykański (USD)");
    fireEvent.click(usdLabels[usdLabels.length - 1]!);

    expect(screen.getByText((_, node) => node?.textContent === "100,0% w walucie")).toBeInTheDocument();
    expect(screen.getByText((_, node) => node?.textContent === "70,0% w portfelu")).toBeInTheDocument();
  });

  it("renders pending source data notice without retry CTA", async () => {
    vi.mocked(getEconomicCurrencyExposure).mockResolvedValueOnce({
      scope: "ALL",
      portfolioId: null,
      asOf: "2026-02-23T08:00:00.000Z",
      modelMode: "ECONOMIC",
      status: "PENDING_SOURCE_DATA",
      chart: [],
      details: [],
      pendingProviderKeys: ["AAPL"],
      meta: {
        model: "gemini-2.5-flash-lite",
        promptVersion: "currency_exposure_v1",
        fromCache: false,
      },
    });

    render(<CurrencyExposureWidget summary={summary} selectedPortfolioId={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Gospodarcza" }));

    expect(
      await screen.findByText("Dane geograficzne w trakcie opracowywania.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Sprawdzimy je w najbliższym dziennym odświeżeniu.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Spróbuj ponownie/i })).not.toBeInTheDocument();
  });
});
