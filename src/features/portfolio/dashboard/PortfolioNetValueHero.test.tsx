import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PortfolioNetValueHero } from "./PortfolioNetValueHero";

describe("PortfolioNetValueHero", () => {
  it("renders formatted net value in base currency", () => {
    render(
      <PortfolioNetValueHero
        portfolioLabel="Portfel: XYZ"
        baseCurrency="PLN"
        totalValueBase="12345.67"
        isPartial={false}
        asOf={null}
      />
    );

    expect(screen.getByText("Portfel: XYZ")).toBeInTheDocument();
    expect(screen.getByText("Wartość netto (PLN)")).toBeInTheDocument();
    expect(screen.getByText("12 345,67 zł")).toBeInTheDocument();
  });

  it("renders partial valuation note when summary is partial", () => {
    render(
      <PortfolioNetValueHero
        portfolioLabel="Portfel: XYZ"
        baseCurrency="PLN"
        totalValueBase="100"
        isPartial
        asOf={null}
      />
    );

    expect(
      screen.getByText(
        "Częściowa wycena: część instrumentów nie ma aktualnych notowań lub FX."
      )
    ).toBeInTheDocument();
  });
});
