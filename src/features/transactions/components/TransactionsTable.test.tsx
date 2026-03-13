import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TransactionsTable } from "./TransactionsTable";
import type { TransactionListItem } from "../server/list-transactions";

vi.mock("./InstrumentLogoImage", () => ({
  InstrumentLogoImage: () => <div data-testid="instrument-logo" />,
}));

vi.mock("./TransactionsRowActions", () => ({
  TransactionsRowActions: () => <div data-testid="row-actions" />,
}));

const createItem = (overrides: Partial<TransactionListItem> = {}): TransactionListItem => ({
  id: "tx-asset",
  tradeDate: "2026-03-01",
  side: "BUY",
  quantity: "10",
  price: "100",
  fee: "0",
  groupId: "group-1",
  legRole: "ASSET",
  legKey: "ASSET",
  cashflowType: null,
  instrument: {
    symbol: "AAPL",
    name: "Apple",
    currency: "USD",
    region: "US",
    logoUrl: null,
    instrumentType: "EQUITY",
    customAssetType: null,
  },
  ...overrides,
});

describe("TransactionsTable", () => {
  it("renders the trade as the primary journal entry and tucks settlement into details", () => {
    render(
      <TransactionsTable
        items={[
          createItem(),
          createItem({
            id: "tx-cash",
            legRole: "CASH",
            legKey: "CASH_SETTLEMENT",
            instrument: {
              symbol: "USD",
              name: "Gotówka USD",
              currency: "USD",
              instrumentType: "CURRENCY",
              logoUrl: null,
            },
          }),
        ]}
      />
    );

    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("Rozliczenie i ruch gotówki")).toBeInTheDocument();
    expect(screen.getAllByTestId("row-actions")).toHaveLength(1);
  });

  it("keeps standalone cash transactions readable without settlement details", () => {
    render(
      <TransactionsTable
        items={[
          createItem({
            id: "cash-only",
            groupId: "group-cash",
            legRole: "CASH",
            legKey: "CASH_FLOW",
            cashflowType: "DEPOSIT",
            instrument: {
              symbol: "PLN",
              name: "Gotówka PLN",
              currency: "PLN",
              instrumentType: "CURRENCY",
              logoUrl: null,
            },
          }),
        ]}
      />
    );

    expect(screen.getByText("PLN")).toBeInTheDocument();
    expect(screen.queryByText("Rozliczenie i ruch gotówki")).not.toBeInTheDocument();
  });
});
