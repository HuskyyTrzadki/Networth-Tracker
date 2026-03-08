import { requestJson } from "@/lib/http/client-request";

import type {
  XtbImportPreviewRow,
  XtbImportPreviewValuation,
} from "../lib/xtb-import-types";

export async function revalueXtbPreview(
  rows: readonly XtbImportPreviewRow[],
  baseCurrency: string,
  signal?: AbortSignal
): Promise<XtbImportPreviewValuation> {
  const { payload } = await requestJson("/api/transactions/import/xtb/valuation", {
    method: "POST",
    body: JSON.stringify({
      rows,
      baseCurrency,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    signal,
    fallbackMessage: "Nie udało się odświeżyć wyceny podglądu XTB.",
  });

  if (
    !payload ||
    typeof payload !== "object" ||
    !("holdings" in payload) ||
    !Array.isArray((payload as { holdings?: unknown }).holdings)
  ) {
    throw new Error("Brak danych wyceny podglądu XTB.");
  }

  return payload as XtbImportPreviewValuation;
}
