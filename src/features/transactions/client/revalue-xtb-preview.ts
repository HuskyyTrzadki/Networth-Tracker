import { revalueBrokerImport } from "./revalue-broker-import";

export const revalueXtbPreview = (
  rows: Parameters<typeof revalueBrokerImport>[1],
  baseCurrency: string,
  signal?: AbortSignal
) => revalueBrokerImport("xtb", rows, baseCurrency, signal);
