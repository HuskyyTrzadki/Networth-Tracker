import { beforeEach, describe, expect, it, vi } from "vitest";

import type { InstrumentSearchResult } from "../../lib/instrument-search";
import type { FormValues } from "../AddTransactionDialogContent";
import { buildTransactionSubmitIntent } from "./submit-intent";

const marketInstrument: InstrumentSearchResult = {
  id: "aapl",
  provider: "yahoo",
  providerKey: "AAPL",
  symbol: "AAPL",
  ticker: "AAPL",
  name: "Apple",
  currency: "USD",
  instrumentType: "EQUITY",
  exchange: "NASDAQ",
  region: "US",
  logoUrl: null,
};

const baseValues: FormValues = {
  assetMode: "MARKET",
  type: "BUY",
  portfolioId: "portfolio-1",
  assetId: "asset-1",
  currency: "USD",
  consumeCash: true,
  cashCurrency: "PLN",
  fxFee: "0",
  cashflowType: undefined,
  date: "2026-03-05",
  quantity: "10",
  price: "100",
  fee: "1",
  notes: "note",
  customAssetType: undefined,
  customName: undefined,
  customCurrency: undefined,
  customAnnualRatePct: undefined,
};

describe("buildTransactionSubmitIntent", () => {
  beforeEach(() => {
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue("request-id");
  });

  it("returns asset error when market flow has no instrument", () => {
    const result = buildTransactionSubmitIntent({
      mode: "create",
      values: baseValues,
      isCashTab: false,
      isCustomTab: false,
      selectedInstrument: null,
      forcedPortfolioId: null,
    });

    expect(result).toEqual({
      ok: false,
      field: "assetId",
      message: "Wybierz instrument.",
    });
  });

  it("builds create intent for market instrument", () => {
    const result = buildTransactionSubmitIntent({
      mode: "create",
      values: baseValues,
      isCashTab: false,
      isCustomTab: false,
      selectedInstrument: marketInstrument,
      forcedPortfolioId: null,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected create intent.");
    }

    if (result.intent.kind !== "create") {
      throw new Error("Expected create intent.");
    }

    expect(result.intent.portfolioId).toBe("portfolio-1");
    expect(result.intent.payload).toEqual(
      expect.objectContaining({
        clientRequestId: "request-id",
        portfolioId: "portfolio-1",
        instrument: expect.objectContaining({
          providerKey: "AAPL",
          symbol: "AAPL",
          currency: "USD",
        }),
      })
    );
  });

  it("builds create intent for custom asset and forced portfolio", () => {
    const result = buildTransactionSubmitIntent({
      mode: "create",
      values: {
        ...baseValues,
        assetMode: "CUSTOM",
        customName: "Lokata demo",
        customCurrency: "PLN",
        customAssetType: "TREASURY_BONDS",
        customAnnualRatePct: "5",
      },
      isCashTab: false,
      isCustomTab: true,
      selectedInstrument: null,
      forcedPortfolioId: "forced-portfolio",
    });

    expect(result.ok).toBe(true);
    if (!result.ok || result.intent.kind !== "create") {
      throw new Error("Expected custom create intent.");
    }

    expect(result.intent.portfolioId).toBe("forced-portfolio");
    expect(result.intent.payload.customInstrument).toEqual(
      expect.objectContaining({
        name: "Lokata demo",
        currency: "PLN",
        annualRatePct: "5",
      })
    );
  });

  it("returns root error when edit id is missing", () => {
    const result = buildTransactionSubmitIntent({
      mode: "edit",
      editTransactionId: "   ",
      values: baseValues,
      isCashTab: false,
      isCustomTab: false,
      selectedInstrument: marketInstrument,
      forcedPortfolioId: null,
    });

    expect(result).toEqual({
      ok: false,
      field: "root",
      message: "Brak identyfikatora transakcji do edycji.",
    });
  });
});
