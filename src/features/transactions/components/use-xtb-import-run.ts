import { useBrokerImportRun } from "./use-broker-import-run";

export const useXtbImportRun = (runId: string | null) => useBrokerImportRun("xtb", runId);
