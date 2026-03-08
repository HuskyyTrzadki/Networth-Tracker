import type { XtbImportPreviewResponse } from "../lib/xtb-import-types";
import { requestJson } from "@/lib/http/client-request";

export async function previewXtbImport(
  files: readonly File[],
  baseCurrency: string,
  signal?: AbortSignal
): Promise<XtbImportPreviewResponse> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }
  formData.append("baseCurrency", baseCurrency);

  const { payload } = await requestJson("/api/transactions/import/xtb/preview", {
    method: "POST",
    body: formData,
    signal,
    fallbackMessage: "Nie udało się przygotować podglądu importu XTB.",
  });

  if (
    !payload ||
    typeof payload !== "object" ||
    !("rows" in payload) ||
    !Array.isArray((payload as { rows?: unknown }).rows)
  ) {
    throw new Error("Brak danych podglądu importu XTB.");
  }

  return payload as XtbImportPreviewResponse;
}
