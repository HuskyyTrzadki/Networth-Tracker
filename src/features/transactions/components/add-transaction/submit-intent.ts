import { DEFAULT_CUSTOM_ASSET_TYPE } from "../../lib/custom-asset-types";
import type { InstrumentSearchResult } from "../../lib/instrument-search";
import type {
  CreateTransactionRequest,
  UpdateTransactionRequest,
} from "../../server/schema";
import type { FormValues } from "../AddTransactionDialogContent";
import { buildSubmitPayloadFields } from "./submit-helpers";

export type TransactionSubmitIntent =
  | Readonly<{
      kind: "edit";
      transactionId: string;
      payload: UpdateTransactionRequest;
    }>
  | Readonly<{
      kind: "create";
      portfolioId: string;
      payload: CreateTransactionRequest;
    }>;

export type BuildTransactionSubmitIntentResult =
  | Readonly<{
      ok: false;
      field: "assetId" | "root";
      message: string;
    }>
  | Readonly<{
      ok: true;
      intent: TransactionSubmitIntent;
    }>;

type BuildTransactionSubmitIntentInput = Readonly<{
  mode: "create" | "edit";
  values: FormValues;
  isCashTab: boolean;
  isCustomTab: boolean;
  selectedInstrument: InstrumentSearchResult | null;
  forcedPortfolioId: string | null;
  editTransactionId?: string;
}>;

const buildUpdatePayload = (
  values: FormValues,
  isCashTab: boolean,
  isCustomTab: boolean
): UpdateTransactionRequest => ({
  type: values.type,
  date: values.date,
  quantity: values.quantity,
  ...buildSubmitPayloadFields(values, isCashTab),
  notes: values.notes,
  customAnnualRatePct: isCustomTab ? (values.customAnnualRatePct ?? "") : undefined,
});

const buildMarketInstrumentPayload = (selectedInstrument: InstrumentSearchResult) => ({
  provider: selectedInstrument.provider,
  providerKey: selectedInstrument.providerKey,
  symbol: selectedInstrument.symbol,
  name: selectedInstrument.name,
  currency: selectedInstrument.currency,
  instrumentType: selectedInstrument.instrumentType ?? undefined,
  exchange: selectedInstrument.exchange ?? undefined,
  region: selectedInstrument.region ?? undefined,
  logoUrl: selectedInstrument.logoUrl ?? undefined,
});

const buildCustomInstrumentPayload = (values: FormValues) => ({
  name: values.customName ?? "",
  currency: values.customCurrency ?? "",
  notes: values.notes,
  kind: values.customAssetType ?? DEFAULT_CUSTOM_ASSET_TYPE,
  valuationKind: "COMPOUND_ANNUAL_RATE" as const,
  annualRatePct: values.customAnnualRatePct ?? "0",
});

const normalizeEditTransactionId = (transactionId: string | undefined) =>
  transactionId?.trim() ?? "";

export const buildTransactionSubmitIntent = ({
  mode,
  values,
  isCashTab,
  isCustomTab,
  selectedInstrument,
  forcedPortfolioId,
  editTransactionId,
}: BuildTransactionSubmitIntentInput): BuildTransactionSubmitIntentResult => {
  if (!isCustomTab && !selectedInstrument) {
    return {
      ok: false,
      field: "assetId",
      message: "Wybierz instrument.",
    };
  }

  if (mode === "edit") {
    const normalizedTransactionId = normalizeEditTransactionId(editTransactionId);
    if (!normalizedTransactionId) {
      return {
        ok: false,
        field: "root",
        message: "Brak identyfikatora transakcji do edycji.",
      };
    }

    return {
      ok: true,
      intent: {
        kind: "edit",
        transactionId: normalizedTransactionId,
        payload: buildUpdatePayload(values, isCashTab, isCustomTab),
      },
    };
  }

  const portfolioId = forcedPortfolioId ?? values.portfolioId;
  const createPayloadBase: Omit<
    CreateTransactionRequest,
    "portfolioId" | "clientRequestId" | "customInstrument" | "instrument"
  > = {
    type: values.type,
    date: values.date,
    quantity: values.quantity,
    ...buildSubmitPayloadFields(values, isCashTab),
    notes: values.notes,
    customAnnualRatePct: isCustomTab ? (values.customAnnualRatePct ?? "") : undefined,
  };

  const payload: CreateTransactionRequest = isCustomTab
    ? {
        ...createPayloadBase,
        portfolioId,
        clientRequestId: crypto.randomUUID(),
        customInstrument: buildCustomInstrumentPayload(values),
      }
    : {
        ...createPayloadBase,
        portfolioId,
        clientRequestId: crypto.randomUUID(),
        instrument: buildMarketInstrumentPayload(selectedInstrument!),
      };

  return {
    ok: true,
    intent: {
      kind: "create",
      portfolioId,
      payload,
    },
  };
};
