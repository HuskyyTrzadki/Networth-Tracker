import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PortfolioRecentTransactionsWidget } from "./PortfolioRecentTransactionsWidget";

vi.mock("@/features/transactions/components/TransactionsTable", () => ({
  TransactionsTable: () => <div data-testid="transactions-table" />,
}));

describe("PortfolioRecentTransactionsWidget", () => {
  it("renders add-transaction CTA in empty state", () => {
    render(<PortfolioRecentTransactionsWidget selectedPortfolioId="p1" items={[]} />);

    expect(screen.getByText("Brak wpisów")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dodaj transakcję" })).toHaveAttribute(
      "href",
      "/transactions/new?portfolio=p1"
    );
  });

  it("renders transactions table when items exist", () => {
    render(
      <PortfolioRecentTransactionsWidget
        selectedPortfolioId={null}
        items={[{ id: "tx-1" } as never]}
      />
    );

    expect(screen.getByTestId("transactions-table")).toBeInTheDocument();
  });
});
