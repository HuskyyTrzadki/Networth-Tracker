import type { ScreenshotImportCommitPayload } from "@/features/onboarding/lib/screenshot-import-schema";

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

  const data = (await response.json().catch(() => null)) as
    | CommitScreenshotImportResponse
    | { message?: string; missingTickers?: string[] }
    | null;

  if (!response.ok) {
    const message =
      data && "message" in data && data.message
        ? data.message
        : "Nie udało się zapisać importu.";
    const error = new Error(message) as Error & { missingTickers?: string[] };
    if (data && "missingTickers" in data) {
      error.missingTickers = data.missingTickers;
    }
    throw error;
  }

  if (!data || !("portfolioId" in data)) {
    throw new Error("Brak odpowiedzi po zapisie importu.");
  }

  return data;
}
