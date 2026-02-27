import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PortfolioSummary } from "../../server/valuation";
import type { SnapshotRebuildStatus } from "../hooks/useSnapshotRebuild";
import { AllocationHoldingsWidget } from "./AllocationHoldingsWidget";

vi.mock("./AllocationTreemapView", () => ({
  AllocationTreemapView: () => <div data-testid="allocation-treemap">Treemap</div>,
}));
vi.mock("./AllocationBarsView", () => ({
  AllocationBarsView: () => <div data-testid="allocation-bars">Bars</div>,
}));
vi.mock("./AllocationHoldingsTableView", () => ({
  AllocationHoldingsTableView: () => <div data-testid="allocation-holdings-table">Table</div>,
}));

const summary: PortfolioSummary = {
  baseCurrency: "PLN",
  totalValueBase: "10000",
  isPartial: false,
  missingQuotes: 0,
  missingFx: 0,
  asOf: "2026-02-23T08:00:00.000Z",
  holdings: [
    {
      instrumentId: "a",
      provider: "yahoo",
      symbol: "A",
      name: "A",
      exchange: null,
      currency: "USD",
      logoUrl: null,
      instrumentType: "EQUITY",
      quantity: "1",
      averageBuyPriceBase: null,
      price: "1",
      valueBase: "2000",
      weight: 0.2,
      missingReason: null,
    },
    {
      instrumentId: "b",
      provider: "yahoo",
      symbol: "B",
      name: "B",
      exchange: null,
      currency: "USD",
      logoUrl: null,
      instrumentType: "EQUITY",
      quantity: "1",
      averageBuyPriceBase: null,
      price: "1",
      valueBase: "2000",
      weight: 0.2,
      missingReason: null,
    },
    {
      instrumentId: "c",
      provider: "yahoo",
      symbol: "C",
      name: "C",
      exchange: null,
      currency: "PLN",
      logoUrl: null,
      instrumentType: "EQUITY",
      quantity: "1",
      averageBuyPriceBase: null,
      price: "1",
      valueBase: "2000",
      weight: 0.2,
      missingReason: null,
    },
    {
      instrumentId: "d",
      provider: "yahoo",
      symbol: "D",
      name: "D",
      exchange: null,
      currency: "EUR",
      logoUrl: null,
      instrumentType: "EQUITY",
      quantity: "1",
      averageBuyPriceBase: null,
      price: "1",
      valueBase: "2000",
      weight: 0.2,
      missingReason: null,
    },
    {
      instrumentId: "e",
      provider: "yahoo",
      symbol: "E",
      name: "E",
      exchange: null,
      currency: "GBP",
      logoUrl: null,
      instrumentType: "EQUITY",
      quantity: "1",
      averageBuyPriceBase: null,
      price: "1",
      valueBase: "2000",
      weight: 0.2,
      missingReason: null,
    },
  ],
};

const rebuild: SnapshotRebuildStatus = {
  status: "idle",
  dirtyFrom: null,
  fromDate: null,
  toDate: null,
  processedUntil: null,
  progressPercent: null,
  message: null,
  isBusy: false,
};

describe("AllocationHoldingsWidget", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
      },
      configurable: true,
    });
  });

  it("opens expanded treemap modal from map mode", () => {
    render(<AllocationHoldingsWidget summary={summary} rebuild={rebuild} />);

    const expandButton = screen.getByRole("button", { name: "Powiększ mapę alokacji" });
    expect(expandButton).toBeInTheDocument();

    fireEvent.click(expandButton);

    expect(screen.getByText("Mapa alokacji")).toBeInTheDocument();
    expect(screen.getByText("Widok pełnoekranowy.")).toBeInTheDocument();
    expect(screen.getAllByTestId("allocation-treemap")).toHaveLength(2);
  });

  it("opens expanded bars modal from bars mode", () => {
    render(<AllocationHoldingsWidget summary={summary} rebuild={rebuild} />);

    fireEvent.click(screen.getByRole("button", { name: "Słupki" }));
    fireEvent.click(screen.getByRole("button", { name: "Powiększ słupki alokacji" }));

    expect(screen.getByText("Słupki alokacji")).toBeInTheDocument();
    expect(screen.getByText("Widok pełnoekranowy.")).toBeInTheDocument();
    expect(screen.getAllByTestId("allocation-bars")).toHaveLength(2);
  });

  it("opens expanded table modal from table mode", () => {
    render(<AllocationHoldingsWidget summary={summary} rebuild={rebuild} />);

    fireEvent.click(screen.getByRole("button", { name: "Tabela" }));
    fireEvent.click(screen.getByRole("button", { name: "Powiększ tabelę pozycji" }));

    expect(screen.getByText("Tabela pozycji")).toBeInTheDocument();
    expect(screen.getByText("Widok pełnoekranowy.")).toBeInTheDocument();
    expect(screen.getAllByTestId("allocation-holdings-table")).toHaveLength(2);
  });
});
