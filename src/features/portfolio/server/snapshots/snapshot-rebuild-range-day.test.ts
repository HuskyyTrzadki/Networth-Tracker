import { describe, expect, it } from "vitest";

import { buildFxPairs } from "./compute-portfolio-snapshot-range-helpers";
import { createFxSeriesCursor, createInstrumentSeriesCursor } from "./range-market-data-cursor";
import { buildDaySnapshotRow, __test__ } from "./snapshot-rebuild-range-day";

describe("snapshot-rebuild-range-day helpers", () => {
  it("detects days with flows even when holdings are empty", () => {
    expect(
      __test__.hasAnyFlowEntries({
        externalByCurrency: new Map([["PLN", {}]]),
        implicitByCurrency: new Map(),
      } as never)
    ).toBe(true);
    expect(
      __test__.hasAnyFlowEntries({
        externalByCurrency: new Map(),
        implicitByCurrency: new Map(),
      })
    ).toBe(false);
  });

  it("builds zero-value totals for flow-only days", () => {
    const totals = __test__.buildZeroValueTotals({
      PLN: false,
      USD: true,
      EUR: false,
    });

    expect(totals.PLN).toMatchObject({
      totalValue: "0",
      isPartial: false,
      missingFx: 0,
    });
    expect(totals.USD).toMatchObject({
      totalValue: "0",
      isPartial: true,
      missingFx: 1,
    });
  });
});

describe("buildDaySnapshotRow", () => {
  it("persists a zero-value row for flow-only days", () => {
    const row = buildDaySnapshotRow({
      userId: "user-1",
      scope: "PORTFOLIO",
      portfolioId: "portfolio-1",
      bucketDate: "2025-01-30",
      holdingsQtyByInstrument: new Map(),
      instrumentById: new Map([
        [
          "cash-pln",
          {
            id: "cash-pln",
            symbol: "PLN",
            name: "Gotowka PLN",
            currency: "PLN",
            exchange: null,
            provider: "system",
            provider_key: "PLN",
            logo_url: null,
            instrument_type: "CURRENCY",
          },
        ],
      ]),
      groupHasCash: new Set(),
      dailyTransactions: [
        {
          tradeDate: "2025-01-30",
          instrumentId: "cash-pln",
          side: "SELL",
          quantity: "35568.44",
          price: "1",
          fee: "0",
          legRole: "ASSET",
          cashflowType: "WITHDRAWAL",
          groupId: "group-1",
        },
      ],
      fxPairs: buildFxPairs(["PLN"]),
      instrumentCursor: createInstrumentSeriesCursor(new Map()),
      fxCursor: createFxSeriesCursor(new Map()),
      customAnchorByInstrumentId: new Map(),
      customQuoteStateByInstrumentId: new Map(),
    });

    expect(row).not.toBeNull();
    expect(row?.total_value_pln).toBe("0");
    expect(row?.net_external_cashflow_pln).toBe("-35568.44");
    expect(row?.bucket_date).toBe("2025-01-30");
  });
});
