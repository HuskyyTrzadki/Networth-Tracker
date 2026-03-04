import type { ScreenshotPreviewPayload } from "../lib/screenshot-preview-schema";
import { toClientError } from "@/lib/http/client-error";

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
  const response = await fetch("/api/transactions/screenshot/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw toClientError(
      data,
      "Nie udało się policzyć sumy w USD.",
      response.status
    );
  }

  if (!data || typeof data !== "object" || !("totalUsd" in data)) {
    throw new Error("Brak danych do podglądu w USD.");
  }

  return data as ScreenshotPreviewResponse;
}
