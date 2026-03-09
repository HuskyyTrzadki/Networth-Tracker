import { getBrokerImportJob } from "./get-broker-import-job";

export const getXtbImportJob = (runId: string, signal?: AbortSignal) =>
  getBrokerImportJob("xtb", runId, signal);
