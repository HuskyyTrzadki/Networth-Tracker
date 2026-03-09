import { badRequestError } from "@/lib/http/app-error";

import type { BrokerImportProviderId } from "../../lib/broker-import-providers";
import type {
  BrokerImportPreviewResponse,
} from "../../lib/broker-import-types";
import type { SupabaseServerClient } from "../search/search-types";
import type { CreateTransactionRequest } from "../schema";
import type { SettlementFx } from "../settlement";
import { xtbBrokerImportProvider } from "./providers/xtb/adapter";
import type { BrokerImportReadyRow } from "./shared";

export type BrokerImportExecution = Readonly<{
  request: CreateTransactionRequest;
  guardMode: "STRICT" | "IMPORT";
  settlementOverride: Readonly<{
    cashQuantity: string;
    fx?: SettlementFx | null;
  }> | null;
}>;

export type BrokerImportProviderAdapter = Readonly<{
  id: BrokerImportProviderId;
  buildPreview: (
    supabase: SupabaseServerClient,
    files: readonly File[],
    baseCurrency: string
  ) => Promise<BrokerImportPreviewResponse>;
  parseReadyRow: (payload: unknown) => BrokerImportReadyRow;
  sortReadyRows: (rows: readonly BrokerImportReadyRow[]) => readonly BrokerImportReadyRow[];
  buildImportExecution: (
    portfolioId: string,
    row: BrokerImportReadyRow
  ) => BrokerImportExecution;
  buildRowDebugLabel: (row: BrokerImportReadyRow) => string;
  buildSourceSummary: (rows: readonly BrokerImportReadyRow[]) => Record<string, unknown>;
  resolveErrorMessage: (error: unknown, fallbackMessage: string) => string;
}>;

const implementedProviders: Partial<Record<BrokerImportProviderId, BrokerImportProviderAdapter>> = {
  xtb: xtbBrokerImportProvider,
};

export const getBrokerImportProvider = (providerId: BrokerImportProviderId) =>
  implementedProviders[providerId] ?? null;

export const requireBrokerImportProvider = (providerId: BrokerImportProviderId) => {
  const provider = getBrokerImportProvider(providerId);
  if (!provider) {
    throw badRequestError(`Import dla brokera ${providerId.toUpperCase()} nie jest jeszcze dostępny.`, {
      code: "BROKER_IMPORT_PROVIDER_UNAVAILABLE",
      details: { provider: providerId },
    });
  }

  return provider;
};
