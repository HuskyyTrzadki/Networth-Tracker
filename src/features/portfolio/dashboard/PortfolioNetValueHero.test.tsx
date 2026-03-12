import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PortfolioNetValueHero } from "./PortfolioNetValueHero";

describe("PortfolioNetValueHero", () => {
  it("renders formatted net value in base currency", () => {
    render(
      <PortfolioNetValueHero
        portfolioLabel="XYZ"
        addTransactionHref="/transactions/new?portfolio=p1"
        baseCurrency="PLN"
        totalValueBase="12345.67"
        dailyChangeBase="10"
        asOf="9 lut 2026, 13:00"
        valuationSummary="Dane kompletne dla bieżącego widoku."
        valuationTone="positive"
      />
    );

    expect(screen.getByRole("heading", { name: "XYZ" })).toBeInTheDocument();
    expect(screen.getByText("Wartość netto")).toBeInTheDocument();
    expect(screen.getByText("12 345,67")).toBeInTheDocument();
    expect(screen.getByText("zł")).toBeInTheDocument();
    expect(screen.getByText("Dzisiaj")).toBeInTheDocument();
    expect(screen.getByText(/Stan na 9 lut 2026, 13:00/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Dodaj transakcję" })
    ).toHaveAttribute("href", "/transactions/new?portfolio=p1");
    expect(screen.getByText(/\+10/)).toBeInTheDocument();
  });

  it("renders placeholder when as-of timestamp is unavailable", () => {
    render(
      <PortfolioNetValueHero
        portfolioLabel="XYZ"
        addTransactionHref="/transactions/new"
        baseCurrency="PLN"
        totalValueBase="100"
        dailyChangeBase={null}
        asOf={null}
        valuationSummary="Dane częściowe: brak cen dla 1 pozycji."
        valuationTone="warning"
      />
    );

    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(screen.queryByText(/Stan na/)).not.toBeInTheDocument();
  });
});
