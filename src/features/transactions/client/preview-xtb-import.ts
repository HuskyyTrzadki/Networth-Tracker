import { previewBrokerImport } from "./preview-broker-import";

export const previewXtbImport = (
  files: readonly File[],
  baseCurrency: string,
  signal?: AbortSignal
) => previewBrokerImport("xtb", files, baseCurrency, signal);
