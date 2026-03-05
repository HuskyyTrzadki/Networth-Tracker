import type { ScreenshotPreviewPayload } from "../lib/screenshot-preview-schema";
import { requestJson } from "@/lib/http/client-request";

export type ScreenshotPreviewResponse = Readonly<{
  totalUsd: string | null;
  missingQuotes: number;
  missingFx: number;
  asOf: string | null;
  holdings: readonly Readonly<{
    instrumentId: string;
    price: string | null;
    currency: string;
  }>[];
}>;

export async function previewScreenshotImportHoldings(
  payload: ScreenshotPreviewPayload,
  signal?: AbortSignal
): Promise<ScreenshotPreviewResponse> {
  const { payload: responsePayload } = await requestJson(
    "/api/transactions/screenshot/preview",
    {
      method: "POST",
      json: payload,
      signal,
      fallbackMessage: "Nie udało się policzyć sumy w USD.",
    }
  );

  if (
    !responsePayload ||
    typeof responsePayload !== "object" ||
    !("totalUsd" in responsePayload)
  ) {
    throw new Error("Brak danych do podglądu w USD.");
  }

  return responsePayload as ScreenshotPreviewResponse;
}
