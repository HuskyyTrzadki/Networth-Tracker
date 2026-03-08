import { requestJson } from "@/lib/http/client-request";

import type { XtbImportRunSummary } from "../lib/xtb-import-types";

export async function runXtbImportJob(
  runId: string,
  signal?: AbortSignal
): Promise<XtbImportRunSummary> {
  const { payload } = await requestJson(
    `/api/transactions/import/xtb/jobs/${runId}/run`,
    {
      method: "POST",
      signal,
      json: {
        maxRowsPerRun: 150,
        timeBudgetMs: 5000,
      },
      fallbackMessage: "Nie udało się przetworzyć importu XTB.",
    }
  );

  return (payload as { run: XtbImportRunSummary }).run;
}
