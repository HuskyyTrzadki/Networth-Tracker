import type { ScreenshotImportCommitPayload } from "@/features/onboarding/lib/screenshot-import-schema";
import { getApiErrorDetails, toClientError } from "@/lib/http/client-error";

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

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const error = toClientError(
      data,
      "Nie udało się zapisać importu.",
      response.status
    ) as Error & { missingTickers?: string[] };
    const details = getApiErrorDetails(data);
    if (
      details &&
      typeof details === "object" &&
      "missingTickers" in details &&
      Array.isArray((details as { missingTickers?: unknown }).missingTickers)
    ) {
      error.missingTickers = (details as { missingTickers: string[] }).missingTickers;
    } else if (
      data &&
      typeof data === "object" &&
      "missingTickers" in data &&
      Array.isArray((data as { missingTickers?: unknown }).missingTickers)
    ) {
      // Backward compatibility for any legacy payloads still returning top-level field.
      error.missingTickers = (data as { missingTickers: string[] }).missingTickers;
    }
    throw error;
  }

  if (!data || typeof data !== "object" || !("portfolioId" in data)) {
    throw new Error("Brak odpowiedzi po zapisie importu.");
  }

  return data as CommitScreenshotImportResponse;
}
