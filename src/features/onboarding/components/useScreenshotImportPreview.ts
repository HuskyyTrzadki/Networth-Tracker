"use client";

import { useKeyedAsyncResource } from "@/features/common/hooks/use-keyed-async-resource";
import {
  previewScreenshotImportHoldings,
  type ScreenshotPreviewResponse,
} from "@/features/transactions/client/preview-screenshot-import";
import { formatCurrencyString, getCurrencyFormatter } from "@/lib/format-currency";

import type { HoldingRow } from "./ScreenshotHoldingsTable";
import type {
  ScreenshotImportPreviewState,
  ScreenshotImportStep,
} from "./screenshot-import-types";
import {
  buildPreviewFingerprint,
  buildPreviewHoldings,
} from "./screenshot-import-utils";

type Options = Readonly<{
  step: ScreenshotImportStep;
  rows: HoldingRow[];
}>;

type PriceByInstrumentId = Readonly<
  Record<string, Readonly<{ price: string | null; currency: string }>>
>;

const IDLE_PREVIEW_STATE: ScreenshotImportPreviewState = {
  status: "idle",
  totalUsd: null,
  missingQuotes: 0,
  missingFx: 0,
  asOf: null,
  errorMessage: null,
};

const waitWithAbort = (signal: AbortSignal, delayMs: number) =>
  new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);

    const onAbort = () => {
      window.clearTimeout(timeoutId);
      reject(new DOMException("Aborted", "AbortError"));
    };

    signal.addEventListener("abort", onAbort, { once: true });
  });

const toPricesByInstrumentId = (
  data: ScreenshotPreviewResponse | null
): PriceByInstrumentId => {
  if (!data) return {};

  const nextPrices: Record<string, { price: string | null; currency: string }> =
    {};
  data.holdings.forEach((holding) => {
    nextPrices[holding.instrumentId] = {
      price: holding.price,
      currency: holding.currency,
    };
  });

  return nextPrices;
};

export function useScreenshotImportPreview({ step, rows }: Options) {
  const previewHoldings = buildPreviewHoldings(rows);
  const previewFingerprint = buildPreviewFingerprint(previewHoldings);
  const requestKey =
    step === "review" && previewHoldings.length > 0 ? previewFingerprint : null;

  const resource = useKeyedAsyncResource<ScreenshotPreviewResponse>({
    requestKey,
    load: async (signal) => {
      await waitWithAbort(signal, 350);
      return previewScreenshotImportHoldings({ holdings: previewHoldings }, signal);
    },
    getErrorMessage: (error) =>
      error instanceof Error ? error.message : "Nie udało się policzyć sumy w USD.",
  });

  const previewState: ScreenshotImportPreviewState = (() => {
    if (!requestKey) {
      return IDLE_PREVIEW_STATE;
    }

    if (resource.status === "loading" || resource.status === "idle") {
      return {
        ...IDLE_PREVIEW_STATE,
        status: "loading",
      };
    }

    if (resource.status === "error") {
      return {
        ...IDLE_PREVIEW_STATE,
        status: "error",
        errorMessage: resource.errorMessage,
      };
    }

    return {
      status: "ready",
      totalUsd: resource.data?.totalUsd ?? null,
      missingQuotes: resource.data?.missingQuotes ?? 0,
      missingFx: resource.data?.missingFx ?? 0,
      asOf: resource.data?.asOf ?? null,
      errorMessage: null,
    };
  })();

  const pricesByInstrumentId =
    requestKey && resource.status === "success"
      ? toPricesByInstrumentId(resource.data)
      : {};

  const usdFormatter = getCurrencyFormatter("USD");
  const formattedUsd = previewState.totalUsd
    ? usdFormatter
      ? formatCurrencyString(previewState.totalUsd, usdFormatter) ??
        `${previewState.totalUsd} USD`
      : `${previewState.totalUsd} USD`
    : null;

  return { formattedUsd, previewState, pricesByInstrumentId };
}
