import { requestJson } from "@/lib/http/client-request";

import type { XtbImportRunSummary } from "../lib/xtb-import-types";

export async function getXtbImportJob(runId: string, signal?: AbortSignal) {
  const { payload } = await requestJson(`/api/transactions/import/xtb/jobs/${runId}`, {
    method: "GET",
    signal,
    fallbackMessage: "Nie udało się odczytać statusu importu XTB.",
  });

  return (payload as { run: XtbImportRunSummary }).run;
}
