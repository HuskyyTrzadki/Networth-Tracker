import { requestJson } from "@/lib/http/client-request";

import type { BrokerImportProviderId } from "../lib/broker-import-providers";
import type {
  BrokerImportPreviewRow,
  CreateBrokerImportJobResponse,
} from "../lib/broker-import-types";

export async function createBrokerImportJob(
  provider: BrokerImportProviderId,
  portfolioId: string,
  rows: readonly (BrokerImportPreviewRow & { status: "READY" })[]
): Promise<CreateBrokerImportJobResponse> {
  const { payload } = await requestJson(`/api/transactions/import/${provider}/jobs`, {
    method: "POST",
    json: {
      portfolioId,
      rows,
    },
    fallbackMessage: `Nie udało się uruchomić importu ${provider.toUpperCase()}.`,
  });

  return payload as CreateBrokerImportJobResponse;
}
