import { createBrokerImportJob } from "./create-broker-import-job";

export const createXtbImportJob = (
  portfolioId: string,
  rows: Parameters<typeof createBrokerImportJob>[2]
) => createBrokerImportJob("xtb", portfolioId, rows);
