import type { ScreenshotImportCommitPayload } from "@/features/onboarding/lib/screenshot-import-schema";
import { getApiErrorDetails, toClientError } from "@/lib/http/client-error";
import { requestJson } from "@/lib/http/client-request";

import type { ScreenshotPortfolioImportPayload } from "../lib/screenshot-import-schema";

type CommitScreenshotImportPayload =
  | ScreenshotImportCommitPayload
  | ScreenshotPortfolioImportPayload;

export type CommitScreenshotImportResponse = Readonly<{
  portfolioId: string;
  createdHoldings: number;
}>;

export async function commitScreenshotImport(
  payload: CommitScreenshotImportPayload
): Promise<CommitScreenshotImportResponse> {
  const endpoint =
    "portfolioId" in payload
      ? "/api/transactions/screenshot/commit"
      : "/api/onboarding/screenshot/commit";

  const { response, payload: responsePayload } = await requestJson(endpoint, {
    method: "POST",
    json: payload,
    fallbackMessage: "Nie udało się zapisać importu.",
    throwOnError: false,
  });

  if (!response.ok) {
    const error = toClientError(
      responsePayload,
      "Nie udało się zapisać importu.",
      response.status
    ) as Error & { missingTickers?: string[] };
    const details = getApiErrorDetails(responsePayload);
    if (
      details &&
      typeof details === "object" &&
      "missingTickers" in details &&
      Array.isArray((details as { missingTickers?: unknown }).missingTickers)
    ) {
      error.missingTickers = (details as { missingTickers: string[] }).missingTickers;
    } else if (
      responsePayload &&
      typeof responsePayload === "object" &&
      "missingTickers" in responsePayload &&
      Array.isArray((responsePayload as { missingTickers?: unknown }).missingTickers)
    ) {
      // Backward compatibility for any legacy payloads still returning top-level field.
      error.missingTickers = (responsePayload as { missingTickers: string[] }).missingTickers;
    }
    throw error;
  }

  if (
    !responsePayload ||
    typeof responsePayload !== "object" ||
    !("portfolioId" in responsePayload)
  ) {
    throw new Error("Brak odpowiedzi po zapisie importu.");
  }

  return responsePayload as CommitScreenshotImportResponse;
}
