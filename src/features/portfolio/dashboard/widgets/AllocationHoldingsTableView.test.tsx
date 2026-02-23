import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PortfolioSummary, ValuedHolding } from "../../server/valuation";
import { AllocationHoldingsTableView } from "./AllocationHoldingsTableView";

const summary: PortfolioSummary = {
  baseCurrency: "PLN",
  totalValueBase: "1000",
  isPartial: false,
  missingQuotes: 0,
  missingFx: 0,
  asOf: "2026-02-23T08:00:00.000Z",
  holdings: [],
};

const createRow = (
  instrumentId: string,
  instrumentType: ValuedHolding["instrumentType"],
  quantity: string
): ValuedHolding => ({
  instrumentId,
  provider: "yahoo",
  symbol: instrumentId.toUpperCase(),
  name: instrumentId.toUpperCase(),
  exchange: null,
  currency: "PLN",
  logoUrl: null,
  instrumentType,
  quantity,
  averageBuyPriceBase: "1",
  price: "1",
  valueBase: "1",
  weight: 0.1,
  missingReason: null,
});

describe("AllocationHoldingsTableView", () => {
  it("formats quantities by instrument type for readability", () => {
    render(
      <AllocationHoldingsTableView
        holdingsRows={[
          createRow("pln-cash", "CURRENCY", "154864.0189621"),
          createRow("btc", "CRYPTOCURRENCY", "0.123456789"),
          createRow("equity", "EQUITY", "12.3456789"),
        ]}
        summary={summary}
      />
    );

    expect(screen.getByText(/154[\s\u00a0]864,02/)).toBeInTheDocument();
    expect(screen.getByText("0,12345679")).toBeInTheDocument();
    expect(screen.getByText("12,3457")).toBeInTheDocument();
  });
});
