import { requestJson } from "@/lib/http/client-request";

import type { BrokerImportProviderId } from "../lib/broker-import-providers";
import type {
  BrokerImportPreviewRow,
  BrokerImportPreviewValuation,
} from "../lib/broker-import-types";

export async function revalueBrokerImport(
  provider: BrokerImportProviderId,
  rows: readonly BrokerImportPreviewRow[],
  baseCurrency: string,
  signal?: AbortSignal
): Promise<BrokerImportPreviewValuation> {
  const { payload } = await requestJson(`/api/transactions/import/${provider}/valuation`, {
    method: "POST",
    body: JSON.stringify({
      rows,
      baseCurrency,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    signal,
    fallbackMessage: "Nie udało się odświeżyć wyceny podglądu importu.",
  });

  if (
    !payload ||
    typeof payload !== "object" ||
    !("holdings" in payload) ||
    !Array.isArray((payload as { holdings?: unknown }).holdings)
  ) {
    throw new Error("Brak danych wyceny podglądu importu.");
  }

  return payload as BrokerImportPreviewValuation;
}
