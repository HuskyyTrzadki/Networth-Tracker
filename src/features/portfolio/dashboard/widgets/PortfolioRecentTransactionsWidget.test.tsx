import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PortfolioRecentTransactionsWidget } from "./PortfolioRecentTransactionsWidget";

describe("PortfolioRecentTransactionsWidget", () => {
  it("renders add-transaction CTA in empty state", () => {
    render(<PortfolioRecentTransactionsWidget selectedPortfolioId="p1" items={[]} />);

    expect(screen.getByText("Jeszcze nic tu nie ma")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dodaj transakcję" })).toHaveAttribute(
      "href",
      "/transactions/new?portfolio=p1"
    );
  });

  it("renders transactions table when items exist", () => {
    render(
      <PortfolioRecentTransactionsWidget
        selectedPortfolioId={null}
        items={[
          {
            id: "tx-1",
            tradeDate: "2026-01-15",
            side: "BUY",
            quantity: "2",
            price: "100",
            fee: "0",
            groupId: "g-1",
            legRole: "ASSET",
            legKey: "ASSET",
            cashflowType: null,
            instrument: {
              symbol: "MSFT",
              name: "Microsoft",
              currency: "USD",
            },
          } as never,
        ]}
      />
    );

    expect(screen.getByText("MSFT")).toBeInTheDocument();
    expect(screen.getByText("Kupno")).toBeInTheDocument();
    expect(screen.getByText(/200,00/)).toBeInTheDocument();
  });
});
