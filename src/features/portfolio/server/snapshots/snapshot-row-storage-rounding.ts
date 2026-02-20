import { parseDecimalString, toFixedDecimalString } from "@/lib/decimal";

import type { SnapshotRowInsert } from "./types";

const STORAGE_SCALE = 2;

const roundAmountForStorage = (value: string | null) => {
  if (value === null) {
    return null;
  }

  const parsed = parseDecimalString(value);
  if (!parsed) {
    return value;
  }

  return toFixedDecimalString(parsed, STORAGE_SCALE);
};

export const roundSnapshotRowForStorage = (
  row: SnapshotRowInsert
): SnapshotRowInsert => ({
  ...row,
  total_value_pln: roundAmountForStorage(row.total_value_pln),
  total_value_usd: roundAmountForStorage(row.total_value_usd),
  total_value_eur: roundAmountForStorage(row.total_value_eur),
  net_external_cashflow_pln: roundAmountForStorage(row.net_external_cashflow_pln),
  net_external_cashflow_usd: roundAmountForStorage(row.net_external_cashflow_usd),
  net_external_cashflow_eur: roundAmountForStorage(row.net_external_cashflow_eur),
  net_implicit_transfer_pln: roundAmountForStorage(row.net_implicit_transfer_pln),
  net_implicit_transfer_usd: roundAmountForStorage(row.net_implicit_transfer_usd),
  net_implicit_transfer_eur: roundAmountForStorage(row.net_implicit_transfer_eur),
});
