import { requestJson } from "@/lib/http/client-request";

import type { BrokerImportProviderId } from "../lib/broker-import-providers";
import type { BrokerImportPreviewResponse } from "../lib/broker-import-types";

export async function previewBrokerImport(
  provider: BrokerImportProviderId,
  files: readonly File[],
  baseCurrency: string,
  signal?: AbortSignal
): Promise<BrokerImportPreviewResponse> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }
  formData.append("baseCurrency", baseCurrency);

  const { payload } = await requestJson(`/api/transactions/import/${provider}/preview`, {
    method: "POST",
    body: formData,
    signal,
    fallbackMessage: `Nie udało się przygotować podglądu importu ${provider.toUpperCase()}.`,
  });

  if (
    !payload ||
    typeof payload !== "object" ||
    !("rows" in payload) ||
    !Array.isArray((payload as { rows?: unknown }).rows)
  ) {
    throw new Error("Brak danych podglądu importu brokera.");
  }

  return payload as BrokerImportPreviewResponse;
}
