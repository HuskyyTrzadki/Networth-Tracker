import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { PortfolioSummary } from "../../server/valuation";
import { PortfolioTopMoversWidget } from "./PortfolioTopMoversWidget";

vi.mock("@/features/transactions/components/InstrumentLogoImage", () => ({
  InstrumentLogoImage: () => <div data-testid="logo" />,
}));

const baseSummary = {
  baseCurrency: "PLN",
  totalValueBase: "1000",
  isPartial: false,
  missingQuotes: 0,
  missingFx: 0,
  asOf: "2026-02-09T12:00:00.000Z",
  holdings: [],
} satisfies PortfolioSummary;

describe("PortfolioTopMoversWidget", () => {
  it("renders compact movers pills with symbol and metrics", () => {
    render(
      <PortfolioTopMoversWidget
        summary={{
          ...baseSummary,
          holdings: [
            {
              instrumentId: "a",
              symbol: "AAPL",
              name: "Apple",
              exchange: null,
              currency: "USD",
              logoUrl: null,
              instrumentType: "EQUITY",
              quantity: "1",
              averageBuyPriceBase: "100",
              price: "100",
              valueBase: "100",
              weight: 0.5,
              todayChangeBase: "12",
              todayChangePercent: 0.02,
              missingReason: null,
            },
            {
              instrumentId: "b",
              symbol: "MSFT",
              name: "Microsoft",
              exchange: null,
              currency: "USD",
              logoUrl: null,
              instrumentType: "EQUITY",
              quantity: "1",
              averageBuyPriceBase: "100",
              price: "100",
              valueBase: "100",
              weight: 0.5,
              todayChangeBase: "-8",
              todayChangePercent: -0.01,
              missingReason: null,
            },
          ],
        }}
      />
    );

    expect(screen.getByText("Największe ruchy")).toBeInTheDocument();
    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("MSFT")).toBeInTheDocument();
    expect(screen.getAllByText(/100,00\s*USD/)).toHaveLength(2);
    expect(screen.getByText("+2,00%")).toBeInTheDocument();
    expect(screen.getByText("-1,00%")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders empty state when no movers data is available", () => {
    render(<PortfolioTopMoversWidget summary={baseSummary} />);

    expect(
      screen.getByText("Brak danych o dziennych zmianach dla pozycji.")
    ).toBeInTheDocument();
  });
});
