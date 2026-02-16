import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PortfolioValueModeContent } from "./PortfolioValueModeContent";

vi.mock("@/features/design-system", () => ({
  PortfolioComparisonChart: () => <div data-testid="portfolio-comparison-chart" />,
}));

describe("PortfolioValueModeContent", () => {
  it("shows period summary for non-1D range", () => {
    render(
      <PortfolioValueModeContent
        rebuildStatus="idle"
        rebuildFromDate={null}
        rebuildToDate={null}
        rebuildProgressPercent={null}
        hasHoldings
        shouldBootstrap={false}
        hasValuePoints
        range="YTD"
        currency="PLN"
        latestValue={1200}
        dailyDelta={50}
        dailyDeltaPercent={0.04}
        selectedPeriodAbsoluteChange={200}
        selectedPeriodChangePercent={0.2}
        comparisonChartData={[]}
        investedCapitalSeries={[]}
        formatCurrencyValue={(value) => `VAL(${value})`}
        formatDayLabelWithYear={(value) => value}
        transactionCreateHref="/transactions/new"
        cashDepositHref="/transactions/new?preset=cash-deposit"
      />
    );

    expect(screen.getByText("Zmiana za okres (YTD)")).toBeInTheDocument();
    expect(screen.getByText("+VAL(200) PLN")).toBeInTheDocument();
    expect(screen.getByTestId("portfolio-comparison-chart")).toBeInTheDocument();
  });
});
