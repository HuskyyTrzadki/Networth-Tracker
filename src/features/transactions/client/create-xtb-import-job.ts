import { requestJson } from "@/lib/http/client-request";

import type {
  CreateXtbImportJobResponse,
  XtbImportPreviewRow,
} from "../lib/xtb-import-types";

export async function createXtbImportJob(
  portfolioId: string,
  rows: readonly (XtbImportPreviewRow & { status: "READY" })[]
): Promise<CreateXtbImportJobResponse> {
  const { payload } = await requestJson("/api/transactions/import/xtb/jobs", {
    method: "POST",
    json: {
      portfolioId,
      rows,
    },
    fallbackMessage: "Nie udało się uruchomić importu XTB.",
  });

  return payload as CreateXtbImportJobResponse;
}
