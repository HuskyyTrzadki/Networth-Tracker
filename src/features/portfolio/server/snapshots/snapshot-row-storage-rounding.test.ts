import { describe, expect, it } from "vitest";

import { roundSnapshotRowForStorage } from "./snapshot-row-storage-rounding";
import type { SnapshotRowInsert } from "./types";

const makeRow = (): SnapshotRowInsert => ({
  user_id: "user-1",
  scope: "ALL",
  portfolio_id: null,
  bucket_date: "2026-02-20",
  total_value_pln: "123.4567",
  total_value_usd: "50",
  total_value_eur: null,
  net_external_cashflow_pln: "10.555",
  net_external_cashflow_usd: "-2.444",
  net_external_cashflow_eur: null,
  net_implicit_transfer_pln: "0.0049",
  net_implicit_transfer_usd: "0",
  net_implicit_transfer_eur: null,
  is_partial_pln: false,
  missing_quotes_pln: 0,
  missing_fx_pln: 0,
  as_of_pln: "2026-02-20T00:00:00.000Z",
  is_partial_usd: false,
  missing_quotes_usd: 0,
  missing_fx_usd: 0,
  as_of_usd: "2026-02-20T00:00:00.000Z",
  is_partial_eur: false,
  missing_quotes_eur: 0,
  missing_fx_eur: 0,
  as_of_eur: "2026-02-20T00:00:00.000Z",
});

describe("roundSnapshotRowForStorage", () => {
  it("rounds persisted money fields to 2 decimal places", () => {
    const rounded = roundSnapshotRowForStorage(makeRow());

    expect(rounded.total_value_pln).toBe("123.46");
    expect(rounded.total_value_usd).toBe("50.00");
    expect(rounded.net_external_cashflow_pln).toBe("10.56");
    expect(rounded.net_external_cashflow_usd).toBe("-2.44");
    expect(rounded.net_implicit_transfer_pln).toBe("0.00");
    expect(rounded.net_implicit_transfer_usd).toBe("0.00");
    expect(rounded.total_value_eur).toBeNull();
  });
});
