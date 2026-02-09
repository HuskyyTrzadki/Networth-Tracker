import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { validateTransactionGuards, __test__ } from "./transaction-guards";

type HoldingsRow = Readonly<{
  instrument_id: string;
  currency: string;
  provider: string;
  provider_key: string;
  instrument_type: string | null;
  quantity: string | number;
}>;

const createSupabaseAdminMock = (rows: readonly HoldingsRow[]) => {
  const rpc = vi.fn().mockResolvedValue({
    data: rows,
    error: null,
  });

  return { client: { rpc } as Pick<SupabaseClient, "rpc">, rpc };
};

describe("transaction guard helpers", () => {
  it("builds cash and instrument snapshots", () => {
    const snapshot = __test__.buildHoldingsSnapshot([
      {
        instrument_id: "asset-1",
        currency: "USD",
        provider: "yahoo",
        provider_key: "AAPL",
        instrument_type: "EQUITY",
        quantity: "3",
      },
      {
        instrument_id: "cash-1",
        currency: "USD",
        provider: "system",
        provider_key: "USD",
        instrument_type: "CURRENCY",
        quantity: "100",
      },
    ]);

    expect(snapshot.quantityByInstrumentId.get("asset-1")).toBe("3");
    expect(snapshot.cashByCurrency.get("USD")).toBe("100");
  });

  it("computes signed cash delta from settlement legs", () => {
    const delta = __test__.computeCashDelta([
      {
        side: "SELL",
        quantity: "101",
        price: "1",
        cashflowType: "TRADE_SETTLEMENT",
        legKey: "CASH_SETTLEMENT",
      },
      {
        side: "BUY",
        quantity: "8",
        price: "1",
        cashflowType: "TRADE_SETTLEMENT",
        legKey: "CASH_SETTLEMENT",
      },
    ]);

    expect(delta.toString()).toBe("-93");
  });
});

describe("validateTransactionGuards", () => {
  it("skips holdings fetch when no guard is required", async () => {
    const { client, rpc } = createSupabaseAdminMock([]);

    await validateTransactionGuards({
      supabaseAdmin: client,
      userId: "user-1",
      portfolioId: "portfolio-1",
      tradeDate: "2026-02-08",
      intent: "ASSET_BUY",
      isCashInstrument: false,
      assetInstrumentId: "asset-1",
      requestedAssetQuantity: "1",
      consumeCash: false,
      settlementLegs: [],
    });

    expect(rpc).not.toHaveBeenCalled();
  });

  it("blocks oversell when sell quantity is above holdings", async () => {
    const { client } = createSupabaseAdminMock([
      {
        instrument_id: "asset-1",
        currency: "USD",
        provider: "yahoo",
        provider_key: "AAPL",
        instrument_type: "EQUITY",
        quantity: "2",
      },
    ]);

    await expect(
      validateTransactionGuards({
        supabaseAdmin: client,
        userId: "user-1",
        portfolioId: "portfolio-1",
        tradeDate: "2026-02-08",
        intent: "ASSET_SELL",
        isCashInstrument: false,
        assetInstrumentId: "asset-1",
        requestedAssetQuantity: "3",
        consumeCash: false,
        settlementLegs: [],
      })
    ).rejects.toThrow("Ilość sprzedaży przekracza pozycję");
  });

  it("blocks cash withdrawal over available cash", async () => {
    const { client } = createSupabaseAdminMock([
      {
        instrument_id: "cash-usd",
        currency: "USD",
        provider: "system",
        provider_key: "USD",
        instrument_type: "CURRENCY",
        quantity: "20",
      },
    ]);

    await expect(
      validateTransactionGuards({
        supabaseAdmin: client,
        userId: "user-1",
        portfolioId: "portfolio-1",
        tradeDate: "2026-02-08",
        intent: "CASH_WITHDRAWAL",
        isCashInstrument: true,
        assetInstrumentId: "cash-usd",
        requestedAssetQuantity: "25",
        consumeCash: false,
        cashCurrency: "USD",
        settlementLegs: [],
      })
    ).rejects.toThrow("Nie możesz wypłacić");
  });

  it("blocks trade settlement when cash would go negative", async () => {
    const { client } = createSupabaseAdminMock([
      {
        instrument_id: "cash-usd",
        currency: "USD",
        provider: "system",
        provider_key: "USD",
        instrument_type: "CURRENCY",
        quantity: "50",
      },
    ]);

    await expect(
      validateTransactionGuards({
        supabaseAdmin: client,
        userId: "user-1",
        portfolioId: "portfolio-1",
        tradeDate: "2026-02-08",
        intent: "ASSET_BUY",
        isCashInstrument: false,
        assetInstrumentId: "asset-1",
        requestedAssetQuantity: "1",
        consumeCash: true,
        cashCurrency: "USD",
        settlementLegs: [
          {
            side: "SELL",
            quantity: "60",
            price: "1",
            cashflowType: "TRADE_SETTLEMENT",
            legKey: "CASH_SETTLEMENT",
          },
        ],
      })
    ).rejects.toThrow("Brak gotówki");
  });

  it("passes when guards are satisfied", async () => {
    const { client } = createSupabaseAdminMock([
      {
        instrument_id: "asset-1",
        currency: "USD",
        provider: "yahoo",
        provider_key: "AAPL",
        instrument_type: "EQUITY",
        quantity: "5",
      },
      {
        instrument_id: "cash-usd",
        currency: "USD",
        provider: "system",
        provider_key: "USD",
        instrument_type: "CURRENCY",
        quantity: "500",
      },
    ]);

    await expect(
      validateTransactionGuards({
        supabaseAdmin: client,
        userId: "user-1",
        portfolioId: "portfolio-1",
        tradeDate: "2026-02-08",
        intent: "ASSET_SELL",
        isCashInstrument: false,
        assetInstrumentId: "asset-1",
        requestedAssetQuantity: "2",
        consumeCash: true,
        cashCurrency: "USD",
        settlementLegs: [
          {
            side: "BUY",
            quantity: "180",
            price: "1",
            cashflowType: "TRADE_SETTLEMENT",
            legKey: "CASH_SETTLEMENT",
          },
        ],
      })
    ).resolves.toBeUndefined();
  });
});
