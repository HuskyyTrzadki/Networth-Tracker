import { requestJson } from "@/lib/http/client-request";

import type { BrokerImportProviderId } from "../lib/broker-import-providers";
import type { BrokerImportRunSummary } from "../lib/broker-import-types";

export async function runBrokerImportJob(
  provider: BrokerImportProviderId,
  runId: string,
  signal?: AbortSignal
): Promise<BrokerImportRunSummary> {
  const { payload } = await requestJson(
    `/api/transactions/import/${provider}/jobs/${runId}/run`,
    {
      method: "POST",
      signal,
      json: {
        maxRowsPerRun: 150,
        timeBudgetMs: 5000,
      },
      fallbackMessage: "Nie udało się przetworzyć importu brokera.",
    }
  );

  return (payload as { run: BrokerImportRunSummary }).run;
}
