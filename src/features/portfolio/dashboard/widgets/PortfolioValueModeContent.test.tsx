import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PortfolioValueModeContent } from "./PortfolioValueModeContent";

vi.mock("@/features/design-system/components/PortfolioComparisonChart", () => ({
  PortfolioComparisonChart: () => <div data-testid="portfolio-comparison-chart" />,
}));

describe("PortfolioValueModeContent", () => {
  it("shows period summary for historical range", async () => {
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
        selectedPeriodAbsoluteChange={200}
        selectedPeriodChangePercent={0.2}
        comparisonChartData={[]}
        investedCapitalSeries={[]}
        formatCurrencyValue={(value) => `VAL(${value})`}
        formatDayLabelWithYear={(value) => value}
        transactionCreateHref="/transactions/new"
        cashDepositHref="/transactions/new?preset=cash-deposit"
        bootstrapPending={false}
        onBootstrapRequest={() => undefined}
      />
    );

    expect(screen.getByText("Zmiana za okres (YTD)")).toBeInTheDocument();
    expect(screen.getByText("+VAL(200)")).toBeInTheDocument();
    expect(await screen.findByTestId("portfolio-comparison-chart")).toBeInTheDocument();
  });
});
