import { requestJson } from "@/lib/http/client-request";

import type { BrokerImportProviderId } from "../lib/broker-import-providers";
import type { BrokerImportRunSummary } from "../lib/broker-import-types";

export async function getBrokerImportJob(
  provider: BrokerImportProviderId,
  runId: string,
  signal?: AbortSignal
) {
  const { payload } = await requestJson(`/api/transactions/import/${provider}/jobs/${runId}`, {
    method: "GET",
    signal,
    fallbackMessage: "Nie udało się odczytać statusu importu brokera.",
  });

  return (payload as { run: BrokerImportRunSummary }).run;
}
