import { runBrokerImportJob } from "./run-broker-import-job";

export const runXtbImportJob = (runId: string, signal?: AbortSignal) =>
  runBrokerImportJob("xtb", runId, signal);
