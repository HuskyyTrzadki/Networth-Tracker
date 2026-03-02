import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PortfolioNetValueHero } from "./PortfolioNetValueHero";

describe("PortfolioNetValueHero", () => {
  it("renders formatted net value in base currency", () => {
    render(
      <PortfolioNetValueHero
        portfolioLabel="XYZ"
        baseCurrency="PLN"
        totalValueBase="12345.67"
        dailyChangeBase="10"
        asOf="9 lut 2026, 13:00"
      />
    );

    expect(screen.getByText("XYZ")).toBeInTheDocument();
    expect(screen.getByText("Wartość netto")).toBeInTheDocument();
    expect(screen.getByText("12 345,67")).toBeInTheDocument();
    expect(screen.getByText("zł")).toBeInTheDocument();
    expect(screen.queryByText("9 lut 2026, 13:00")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Informacja o czasie wyceny wartości netto" })
    ).toBeInTheDocument();
    expect(screen.getByText(/\+10/)).toBeInTheDocument();
  });

  it("renders placeholder when as-of timestamp is unavailable", () => {
    render(
      <PortfolioNetValueHero
        portfolioLabel="XYZ"
        baseCurrency="PLN"
        totalValueBase="100"
        dailyChangeBase={null}
        asOf={null}
      />
    );

    expect(
      screen.getByRole("button", { name: "Informacja o czasie wyceny wartości netto" })
    ).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});
